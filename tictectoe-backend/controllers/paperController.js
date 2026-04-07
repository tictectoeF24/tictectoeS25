/* eslint-disable no-undef, no-unused-vars */
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { exec } = require("child_process");
const xml2js = require("xml2js");
const cron = require("node-cron");
const os = require("os");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const ffmpegPath = path.resolve(__dirname, '../ffmpeg/bin/ffmpeg.exe');

const convertPdfToLatex = async (pdfUrl, doi) => {
  try {
    // console.log(`🚀 Converting PDF to LaTeX for DOI: ${doi}`);

    // Set paths dynamically
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, `${doi.replace(/\W/g, "_")}.pdf`);
    const latexOutputPath = path.join(tmpDir, `${doi.replace(/\W/g, "_")}.tex`);

    // Download the PDF
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(pdfPath, Buffer.from(response.data));

    // Set `pdftolatex` paths (relative to project root)
    const pdftolatexDir = path.join(process.cwd(), "pdftolatex");
    const pdftolatexScript = path.join(pdftolatexDir, "convert_pdf.py");

    // Run `pdftolatex`
    const command = `PYTHONPATH="${pdftolatexDir}" python3 "${pdftolatexScript}" --filepath "${pdfPath}"`;
    // console.log(`⚙️ Running command: ${command}`);

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(null);
        }

        // console.log(stdout);
        // console.log(`✅ LaTeX extracted and saved to: ${latexOutputPath}`);

        // Read the generated `.tex` file
        if (!fs.existsSync(latexOutputPath)) {
          console.error("❌ LaTeX file not found!");
          return reject(null);
        }

        const latexContent = fs.readFileSync(latexOutputPath, "utf-8");

        resolve(latexContent);
      });
    });
  } catch (error) {
    console.error("❌ Error in convertPdfToLatex:", error);
    return null;
  }
};

async function extractPlainTextFromPdf(pdfUrl) {
  const resp = await axios.get(pdfUrl, { responseType: "arraybuffer" });
  const pdfData = await pdfParse(resp.data);
  const text = (pdfData.text || "").trim();
  return text.length ? text : null;
}

const executeCommand = (command, description) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during ${description}:`, stderr || error.message);
        return reject(error);
      }
      console.log(`${description} completed:`, stdout);
      resolve();
    });
  });
};

const cleanupTemporaryFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    }
  });
};

const getSegmentFiles = (tempDir, doi) => {
  return fs
    .readdirSync(tempDir)
    .filter((file) => file.startsWith(`${doi}_segment_`));
};

const generateAndUploadAudioSegments = async (pdfUrl, doi) => {
  try {
    const sanitizedDoi = encodeURIComponent(doi.replace(/[:/\\?]/g, "_"));

    const tempDir = os.tmpdir();
    const textFilePath = path.join(tempDir, `${sanitizedDoi}_text.txt`);
    const outputAudioPath = path.join(tempDir, `${sanitizedDoi}.mp3`);
    const segmentOutputPath = path.join(
      tempDir,
      `${sanitizedDoi}_segment_%03d.mp3`
    );

    const pdfBuffer = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    const pdfData = await pdfParse(pdfBuffer.data);
    fs.writeFileSync(textFilePath, pdfData.text);
    console.log(`Extracted text from PDF: ${textFilePath}`);

    const pythonScriptPath = path.join(
      __dirname,
      "../python-scripts/tts_pyttsx.py"
    );
    const ttsCommand = `python "${pythonScriptPath}" "${textFilePath}" "${outputAudioPath}"`;
    await executeCommand(ttsCommand, "TTS conversion");

    const segmentCommand = `"${ffmpegPath}" -i "${outputAudioPath}" -f segment -segment_time 1800 -c:a libmp3lame "${segmentOutputPath}"`;
    await executeCommand(segmentCommand, "Audio segmentation");

    const segmentUrls = await uploadSegmentsToSupabase(tempDir, sanitizedDoi);

    cleanupTemporaryFiles([
      textFilePath,
      outputAudioPath,
      ...getSegmentFiles(tempDir, sanitizedDoi),
    ]);

    return segmentUrls;
  } catch (error) {
    console.error("Error during TTS generation:", error);
    return null;
  }
};

const uploadSegmentsToSupabase = async (tempDir, sanitizedDoi) => {
  const segmentFiles = getSegmentFiles(tempDir, sanitizedDoi);
  const segmentUrls = [];

  for (const file of segmentFiles) {
    const filePath = path.join(tempDir, file);
    const audioBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from("audios")
      .upload(`audio_segments/${sanitizedDoi}/${file}`, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading segment to Supabase:", error);
      throw error;
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audios/audio_segments/${sanitizedDoi}/${file}`;
    segmentUrls.push(publicUrl);
  }

  return segmentUrls;
};

/**
 * Fetches author uploaded latex code for the paper, extracts it and serves to a helper for processing.
 * @param {String} arxivId 
 * @returns 
 */
const fetchArxivSourceLatex = async (arxivId) => {
  if (!arxivId) return null;

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "arxiv-src-"));
  const tarPath = path.join(tmpRoot, "source.tar");
  const extractDir = path.join(tmpRoot, "src");

  try {
    const sourceUrl = `https://arxiv.org/e-print/${encodeURIComponent(arxivId)}`;
    const response = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 30000 });
    fs.writeFileSync(tarPath, Buffer.from(response.data));
    fs.mkdirSync(extractDir);

    await executeCommand(`tar -xf "${tarPath}" -C "${extractDir}"`, "Extract arXiv source");

    const texFiles = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stats = fs.statSync(full);
        if (stats.isDirectory()) walk(full);
        else if (entry.toLowerCase().endsWith(".tex")) texFiles.push(full);
      }
    })(extractDir);

    if (texFiles.length === 0) return null;

    texFiles.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
    const preferred = texFiles.find((file) => {
      const content = fs.readFileSync(file, "utf-8");
      return /\\begin{document}/.test(content);
    });

    return fs.readFileSync(preferred || texFiles[0], "utf-8");
  } catch (err) {
    console.error("Failed to fetch official LaTeX:", err.message);
    return null;
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  }
};

/**
 * Takes the paper url to generate latex_content for model processing.
 * @param {Object} paper 
 * @returns 
 */
const ensureLatexContentForPaper = async (paper) => {
  if (!paper) throw new Error("Missing paper object");
  const pdfUrl = paper.pdf_url;
  const arxivId = paper.doi?.replace(/^https?:\/\/arxiv.org\/abs\//, "");
  let latexContent = null;

  if (arxivId) {
    latexContent = await fetchArxivSourceLatex(arxivId);
    console.log("tarball length:", latexContent?.length || 0);
  }

  if (!latexContent || latexContent.length < 10000) {
    if (!pdfUrl) throw new Error(`Missing pdf_url for DOI ${paper.doi}`);
    console.log("Tarball length too small, using text parsing for context")
    const pdfText = await extractPlainTextFromPdf(pdfUrl);
    latexContent = pdfText;
    console.log("text extracted: " + latexContent.length);
  }

  // eslint-disable-next-line no-control-regex
  const sanitize = (text) => (text ? text.replace(/\u0000/g, "").trim() : "");
  latexContent = sanitize(latexContent);

  if (!latexContent || !latexContent.trim()) {
    throw new Error(`No content extracted for DOI ${paper.doi}`);
  }

  const { error } = await supabase
    .from("paper")
    .update({ latex_content: latexContent })
    .eq("doi", paper.doi);

  if (error) throw error;

  return latexContent;
};
/**
 * Loads Gemini model instance and prompts it to generate TTS formatted sections by using latex_content
 * @param {String} doi 
 * @returns 
 */

async function generateProcessedPaperJsonForDoi(doi) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // 1) Fetch the paper from Supabase
  const { data: paper, error } = await supabase
    .from("paper")
    .select("title, summary, latex_content, processed_papers_json")
    .eq("doi", doi)
    .single();

  if (error || !paper) {
    throw new Error(`Paper not found for DOI ${doi}: ${error?.message}`);
  }

  // Prefer LaTeX/full text if available, otherwise fall back to summary
  const context = paper.latex_content;
  if (!context || !context.trim()) {
    throw new Error(`No content available to summarize for DOI ${doi}`);
  }

  // 2) Build the prompt you specified
  const question = `
You are preparing text for TTS. Read the paper "${paper.title}" and return a JSON object. Keys must be the major sections only (e.g., "abstract", "introduction") and cover all the details discussed. Each value must be { "summary": "<concise paragraph optimized for speech>" }. Return valid JSON only, DO NOT INCLUDE LATEX COMMANDS and backslashes.
`.trim();

  const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Context:\n${context}\n\nInstruction:\n${question}`;

  // 3) Call Gemini
  let processed = null;

  while (processed == null) {
    try {
      const result = await model.generateContent(prompt);  // 1
      let raw = (result.response.text() || "").trim();     // 2
      if (!raw) throw new Error("Empty response from model");

      // 3. Try to parse JSON
      try {
        processed = JSON.parse(raw);
      } catch {
        raw = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```/i, "")
          .replace(/```$/i, "")
          .trim();
          raw = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        processed = JSON.parse(raw);                            // 4
      }
    } catch (err) {                                        // 5
      console.log(`[Gemini Sections] failed attempt`, err.message);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // 5) Persist to Supabase
  const orderedSections = Object.entries(processed).map(([title, value], index) => ({
  order: index,
  title,
  summary:
    getSummaryText(value),
}));
const {error: updateError} = await supabase
  .from("paper")
  .update({ processed_papers_json: orderedSections })
  .eq("doi", doi);
  if (updateError) console.error(`[Gemini Sections] Supabase update failed for ${doi}:`, updateError);
  
  console.log(processed);
  return processed;
}

const getSummaryText = (value) => {
  if (typeof value === "string") return value;
  if (typeof value?.summary === "string") return value.summary;
  if (typeof value?.summary?.summary === "string") return value.summary.summary;
  return "";
};


/**
 * Given an array of section texts and a DOI,
 * synthesize each section via Google TTS, upload
 * to Supabase, and return the ordered list of URLs.
 * Also updates the DB incrementally after each upload.
 */
async function generateAndUploadFromJson(sectionTexts, doi) {
  const sanitizedDoi = encodeURIComponent(doi.replace(/[:/\\?]/g, "_"));
  const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;
  const segmentUrls = [];

  // Helper: simple retry on 500
  async function synthesizeWithRetry(payload, tries = 3) {
    for (let i = 1; i <= tries; i++) {
      try {
        return await axios.post(ttsUrl, payload);
      } catch (err) {
        const status = err.response?.status;
        if (i === tries || status !== 500) throw err;
        await new Promise((r) => setTimeout(r, 500 * i));
      }
    }
  }

  for (let idx = 0; idx < sectionTexts.length; idx++) {
    const text = sectionTexts[idx];
    const payload = {
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Chirp3-HD-Fenrir"
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    // 1️⃣ Synthesize
    const resp = await synthesizeWithRetry(payload);
    if (!resp.data.audioContent) {
      throw new Error(`TTS failed for section ${idx + 1}`);
    }
    const buf = Buffer.from(resp.data.audioContent, "base64");

    // 2️⃣ Upload to Supabase storage
    const fileName = `section_${String(idx).padStart(3, "0")}.mp3`;
    const { error: uploadError } = await supabase
      .storage
      .from("audios")
      .upload(`audio_segments/${sanitizedDoi}/${fileName}`, buf, {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (uploadError) {
      throw uploadError;
    }

    // 3️⃣ Build public URL and append to our list
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audios/audio_segments/${sanitizedDoi}/${fileName}`;
    segmentUrls.push(publicUrl);

    // 4️⃣ Immediately persist the growing list back to the paper record
    const { error: updateError } = await supabase
      .from("paper")
      .update({ audio_urls: segmentUrls })
      .eq("doi", doi);
    if (updateError) {
      console.error(`Failed to update DB after section ${idx + 1}:`, updateError);
      // but keep going—at worst the client will re-fetch the full list at the end
    }
  }

  return segmentUrls;
}


const getAudioSegments = async (req, res) => {
  const { doi } = req.body;

  console.log("DOI received:", doi);
  if (!doi) {
    return res.status(400).json({ error: "DOI is required" });
  }

  try {
   const { data, error } = await supabase
  .from("paper")
  .select("title, author_names, pdf_url, audio_urls, processed_papers_json")
  .eq("doi", doi)
  .single();


    if (error || !data) {
      console.error("Error fetching paper:", error || "Paper not found");
      return res.status(404).json({ error: "Paper not found for this DOI" });
    }

    let { audio_urls: audioUrls, processed_papers_json: procJson } = data;

    // Parse audio_urls if it's a string
    let currentSegments = audioUrls || [];
    if (typeof currentSegments === "string") {
      try {
        currentSegments = JSON.parse(currentSegments);
      } catch (parseError) {
        console.error("Error parsing audio_urls:", parseError);
        currentSegments = [];
      }
    }

    // Calculate total sections from processed JSON
    const totalSections = procJson ?
      Object.values(procJson).filter(section =>
        getSummaryText(section).trim().length > 0
      ).length : 0;

    // Check if generation is needed
    const needsGeneration = (!audioUrls || audioUrls.length === 0) && procJson;

    if (needsGeneration) {
      console.log(`Starting background TTS generation for DOI: ${doi}`);

      // Start generation in background (don't await)
      generateAudioInBackground(doi, procJson).catch(err => {
        console.error("Background generation failed:", err);
      });

     return res.json({
  title: data.title,
  author: data.author_names,
  segments: currentSegments,
  status: "generating",
  progress: currentSegments.length,
  total: totalSections
});

    }

   return res.json({
  title: data.title,
  author: data.author_names,
  segments: currentSegments,
  status: "completed",
  progress: currentSegments.length,
  total: totalSections
});

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Background generation function
async function generateAudioInBackground(doi, procJson) {
  try {
    const sectionTexts = Object.values(procJson)
    .map((section) => getSummaryText(section).trim())
    .filter(Boolean);

    if (sectionTexts.length === 0) {
      console.warn("No summaries to generate for DOI:", doi);
      return;
    }

    console.log(`Generating ${sectionTexts.length} sections for DOI: ${doi}`);
    await generateAndUploadFromJson(sectionTexts, doi);
    console.log(`Completed generation for DOI: ${doi}`);
  } catch (error) {
    console.error("Background generation error:", error.response?.data || error.message);
  }
}

const getAudioStatus = async (req, res) => {
  const { doi } = req.params;

  try {
    // Decode the DOI properly
    const decodedDoi = decodeURIComponent(doi);

    const { data, error } = await supabase
      .from("paper")
      .select("title, audio_urls, processed_papers_json")
      .eq("doi", decodedDoi) // Use decoded DOI
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Paper not found" });
    }

    let currentSegments = data.audio_urls || [];
    if (typeof currentSegments === "string") {
      try {
        currentSegments = JSON.parse(currentSegments);
      } catch (parseError) {
        console.error("Error parsing audio_urls:", parseError);
        currentSegments = [];
      }
    }
    const totalSections = data.processed_papers_json ?
      Object.values(data.processed_papers_json).filter(section =>
        getSummaryText(section).trim().length > 0
      ).length : 0;

    const isCompleted = currentSegments.length === totalSections && totalSections > 0;

    return res.json({
      title: data.title,
      segments: currentSegments,
      status: isCompleted ? "completed" : "generating",
      progress: totalSections > 0 ? currentSegments.length : 0,
      total: totalSections
    });

  } catch (err) {
    console.error("Error getting audio status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const streamAudioSegment = async (req, res) => {
  const { doi, segmentIndex } = req.params;

  try {
    console.log(`DOI received: ${doi}`);
    console.log(`Fetching segment index: ${segmentIndex}`);

    const { data, error } = await supabase
      .from("paper")
      .select("audio_urls")
      .eq("doi", doi)
      .single();

    if (error || !data || !data.audio_urls) {
      console.error(
        "Error fetching paper details:",
        error || "No audio URLs found"
      );
      return res.status(404).json({ error: "Audio segment not found" });
    }

    let audioUrls = data.audio_urls;

    if (typeof audioUrls === "string") {
      try {
        audioUrls = JSON.parse(audioUrls);
      } catch (parseError) {
        console.error("Error parsing audio_urls:", parseError);
        return res.status(500).json({ error: "Invalid format for audio URLs" });
      }
    }

    const segmentUrl = audioUrls[segmentIndex];

    if (!segmentUrl) {
      console.error(`Segment URL not found for index ${segmentIndex}`);
      return res
        .status(404)
        .json({ error: `Audio segment ${segmentIndex} not found` });
    }

    console.log(`Audio URL for segment ${segmentIndex}: ${segmentUrl}`);

    const response = await axios.get(segmentUrl, { responseType: "stream" });

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (err) {
    console.error("Server error while streaming audio:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleDailyFetch = async () => {
  try {
    console.log("Fetching arXiv articles...");
    const { data, error } = await axios.get("http://export.arxiv.org/api/query", {
      params: {
        search_query: "all",
        start: 0,
        max_results: 100,
        sortBy: "submittedDate",
        sortOrder: "descending",
      }
    });

    // if (xmlData) {

    // } else {
    //   console.log("Xmldata not available");
    // }

    const jsonData = await xml2js.parseStringPromise(data);
    const articles = jsonData.feed.entry.slice(0, 5);
    // console.log("Articles: ", JSON.stringify(articles, null, 2));
    // return;
    console.log("First 5 arXiv entries:");
for (const a of articles) {
  console.log({
    id: a.id?.[0],
    published: a.published?.[0],
    updated: a.updated?.[0],
    title: a.title?.[0]?.trim(),
  });
}
    if (!articles) {
      console.log("No articles found in the fetched data.");
      return;
    }

    await insertArticlesIntoSupabase(articles);

    // Generate embeddings for new papers
    // await generateMissingEmbeddings();
    // await generateEmbeddingForUserInterest();
    // return;

    console.log("Completed fetching and upserting arXiv articles.");
  } catch (err) {
    console.error("Error fetching articles:", err);
  }
};


/**
 * Checks with supabase to search for missing embedding entries.
 * @returns a console log to tell if there are any missing embeddings entries
 */
async function checkMissingEmbedding(){
  const { data, error } = await supabase
    .from('paper')
    .select('title','doi')
    .is("paper_embeddings",null)
    
  if(error){
    console.log("Error in fetching: ", error);
    return;
  }
  if(data.length == 0){
    console.log("THERE ARE MISSING PAPER EMBEDDINGS FOR THESE PAPERS: ", data);
  } else {
    console.log("Everything is fine so far.")
  }
}

/**
 * Testing code for seeing if there are missing embeddings or not
 * To use this code, you need to change the cron schedule to the right time for you to initiate test.
 * regex: minute hour date month *
 * example: 15:19 11/March is 19 15 11 3 *
 * example code:
 * cron.schedule("0 9 * * 0", () => {
 *  console.log("Cron job: Fetching and storing daily arXiv articles...");
 *  handleDailyFetch();
 * 
 * What to look for in the console:
 *  "THERE ARE MISSING PAPER EMBEDDINGS FOR THESE PAPERS: " if missing embeddings
 *  "Everything is fine so far." : If no missing embeddings
 */
cron.schedule("40 12 13 3 *", () => {
  console.log("Cron job: Fetching and storing daily arXiv articles...");
  handleDailyFetch();
  generateMissingEmbeddings();
  checkMissingEmbedding();
});

/**
 * Run a GET method on the axios api http://export.arxiv.org/api/query
 * retrieve the latest papers found.
 * Starting importing at the startIndex value and maxResults papers from there.
 * @returns data object after using fetch API on axios.
 */
async function fetchArxivArticles() {
  let startIndex = 3;
  let maxResults=100;
  try {
    const response = await axios.get("http://export.arxiv.org/api/query", {
      params: {
        search_query: "all",
        start: startIndex,
        max_results: maxResults,
        sortBy: "submittedDate",
        sortOrder: "descending",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching articles from arXiv:", error);
    return null;
  }
}

// Call the xml2js parseString promise function
async function parseArxivResponse(xml) {
  try {
    return await xml2js.parseStringPromise(xml);
  } catch (error) {
    console.error("Error parsing XML from arXiv:", error);
    return null;
  }
}

async function insertArticlesIntoSupabase(articles) {
  // console.log("Articles length: ", articles.length);

  for (let article of articles) {
    const { title, summary, published, author, id } = article;
    // const categories = article["arxiv:primary_category"][0]["$"]["term"];
    // if (categories === null) {
    //   return;
    // }

    let categories = null;
    if (article["arxiv:primary_category"] && article["arxiv:primary_category"][0]?.["$"]?.["term"]) {
      categories = article["arxiv:primary_category"][0]["$"]["term"];
    } else {
      categories = "Unknown";
    }

    const pdfUrl = article.pdf_url || `https://arxiv.org/pdf/${id[0].split("/").pop()}.pdf`;

    // checking if doi is already available on supabase
    const { data: existingPaper, error: existingError } = await supabase
      .from("paper")
      .select("doi")
      .eq("doi", id[0])
      .maybeSingle();

    if (existingError || existingPaper) {
      console.log(`Paper with DOI ${id[0]} already exists in Supabase.`);
      continue;
    } else {
      console.log("Inserting new paper with DOI: ", id[0]);
    }

    const { error, data } = await supabase.from("paper").upsert(
      [
        {
          title: title[0],
          summary: summary[0],
          author_names: author.map((auth) => auth.name).join(", "),
          pdf_url: pdfUrl,
          published_date: published[0],
          categories: categories,
          doi: id[0],
          latex_content: null,
        },
      ],
    )
      .select();



    if (error) {
      console.error("Error inserting or updating article in Supabase:", error);
    }
    if (!error && data && data[0]) {
    const insertedPaper = data[0];

    try {
      // Ensure latex_content is present / high quality
      const latex = await ensureLatexContentForPaper(insertedPaper);

      // Generate processed_papers_json using that latex
      await generateProcessedPaperJsonForDoi(insertedPaper.doi);

      // (optional) start audio generation in background from processed JSON
      // const { data: refreshed } = await supabase
      //   .from("paper")
      //   .select("doi, processed_papers_json")
      //   .eq("doi", insertedPaper.doi)
      //   .single();
      // if (refreshed?.processed_papers_json) {
      //   generateAudioInBackground(insertedPaper.doi, refreshed.processed_papers_json)
      //     .catch(err => console.error("Background audio generation failed:", err));
      // }
    } catch (err) {
      console.error("Post-ingestion processing failed for DOI", insertedPaper.doi, err);
    }
  } else {
        console.log(`Upserted article: ${id[0]}`);
      }
    }
    console.log("reached newsletter");
      //sendWeeklyPopularPapersNewsletter();
}

/**
 * Update the timestamp of the like update
 * Fetch current like count
 * increment the value of the like and update the table
 * 
 * Remove this column "like count" completely from the papers table
 * To accurately determine this number, perform a group by then count statement
 * in the likes table instead
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateLike = async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const paper_id = req.body.paper_id;
    const body = req.body;

    const newData = { user_id, ...body };

    // 1. Insert into likes table
    const { data, error } = await supabase.from("likes").insert([newData]);
    if (error) {
      return res
        .status(500)
        .json({ message: "Error adding like to post", error });
    }

    // 2. Fetch current like_count
    const { data: paperData, error: fetchError } = await supabase
      .from("paper")
      .select("like_count")
      .eq("paper_id", paper_id)
      .single();

    if (fetchError) {
      return res
        .status(500)
        .json({ message: "Like added but failed to fetch like_count", error: fetchError });
    }

    // 3. Increment like_count
    const newLikeCount = (paperData?.like_count || 0) + 1;

    const { error: countError } = await supabase
      .from("paper")
      .update({ like_count: newLikeCount })
      .eq("paper_id", paper_id);

    if (countError) {
      return res
        .status(500)
        .json({ message: "Like added but failed to increment like_count", error: countError });
    }

    return res.status(200).json({ message: "Like added", data: newData });
  } catch (error) {
    return res.status(500).json({ message: "Error adding like to post", error });
  }
};

/**
 * Algorithm to unlike a post
 * Process:
 * 1. Delete the entree of a user's like on the likes table
 * 2. Fetch the like count column from the papers table
 * 3. Then decrement it by 1
 * 4. Update that entree with the new value
 * 
 * Suggestion to change: 
 * Remove this column "like count" completely from the papers table
 * To accurately determine this number, perform a group by then count statement
 * in the likes table instead
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateUnlike = async (req, res) => {
  const user_id = req.user?.id || req.body.user_id;
  const paper_id = req.body.paper_id;

  try {
    // 1. Remove from likes table
    const { data, error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user_id)
      .eq("paper_id", paper_id);

    if (error) {
      return res
        .status(500)
        .json({ message: "Error unliking paper", error: error.message });
    }

    // 2. Fetch current like_count
    const { data: paperData, error: fetchError } = await supabase
      .from("paper")
      .select("like_count")
      .eq("paper_id", paper_id)
      .single();

    if (fetchError) {
      return res
        .status(500)
        .json({ message: "Paper unliked but failed to fetch like_count", error: fetchError });
    }

    // 3. Decrement like_count, but not below 0
    const newLikeCount = Math.max((paperData?.like_count || 1) - 1, 0);

    const { error: countError } = await supabase
      .from("paper")
      .update({ like_count: newLikeCount })
      .eq("paper_id", paper_id);

    if (countError) {
      return res
        .status(500)
        .json({ message: "Paper unliked but failed to decrement like_count", error: countError });
    }

    return res.status(200).json({ message: "Paper unliked", data: data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error unliking paper", error: error.message });
  }
};

/**
 * Function to insert a new bookmark entree
 * Process:
 * 1. Check if user already bookmarked this paper
 * 2. If yes then exit
 * 3. If no then insert a new entree for this instance
 * 4. Update by incrementing the bookmark count on paper table
 * 
 * Suggestion:
 * 1. Since the user's only possible state to trigger this
 *    is when they did not bookmark it, the initial stage is not
 *    necessary
 * 2. Use a count after grouping the paper_id in bookmark table to 
 *    accurately determine the count rather than relying on the number column
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateBookmark = async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const paper_id = req.body.paper_id;
    const body = req.body;

    // Check if bookmark already exists
    const { data: existing, error: existingError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user_id)
      .eq("paper_id", paper_id)
      .single();

    if (existing) {
      return res.status(200).json({ message: "Bookmark already exists", data: existing });
    }

    const newData = { user_id, ...body };

    // 1. Insert into bookmarks table
    const { data, error } = await supabase.from("bookmarks").insert([newData]);
    if (error) {
      return res
        .status(500)
        .json({ message: "Error adding bookmarks to post", error });
    }

    // 2. Fetch current bookmark_count
    const { data: paperData, error: fetchError } = await supabase
      .from("paper")
      .select("bookmark_count")
      .eq("paper_id", paper_id)
      .single();

    if (fetchError) {
      return res
        .status(500)
        .json({ message: "Bookmark added but failed to fetch bookmark_count", error: fetchError });
    }

    // 3. Increment bookmark_count
    const newBookmarkCount = (paperData?.bookmark_count || 0) + 1;

    const { error: countError } = await supabase
      .from("paper")
      .update({ bookmark_count: newBookmarkCount })
      .eq("paper_id", paper_id);

    if (countError) {
      return res
        .status(500)
        .json({ message: "Bookmark added but failed to increment bookmark_count", error: countError });
    }

    return res.status(200).json({ message: "Bookmark added", data: newData });
  } catch (error) {
    return res.status(500).json({ message: "Error adding bookmark to post", error });
  }
};

/**
 * Function to delete a bookmark entree
 * Process:
 * 1. Invoke the delete isntance on the entree that is in the bookmarks table
 *    the entree to delete: [intended paper_id, current logged in user] 
 * 2. if there was an issue in the process or no deletion was made, an error log is returned 
 * 3. Fetch the bookmark_count and decrement it
 * 4. Update the bookmarl_count for the paper entree 
 * 
 * Suggestion:
 * 1. Use a count after grouping the paper_id in bookmark table to 
 *    accurately determine the count rather than relying on the number column
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const updateUnbookmark = async (req, res) => {
  const user_id = req.user?.id || req.body.user_id;
  const paper_id = req.body.paper_id;

  console.log("updateUnbookmark called with:", { user_id, paper_id, hasUser: !!req.user });

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  if (!paper_id) {
    return res.status(400).json({ message: "Paper ID is required" });
  }

  try {
    // 1. Remove from bookmarks table and get count of deleted rows
    const { data, error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user_id)
      .eq("paper_id", paper_id)
      .select();

    if (error) {
      console.error("Supabase delete error:", error);
      return res
        .status(500)
        .json({ message: "Error unbookmarking paper", error: error.message });
    }
    
    // Check if any rows were deleted
    const deletedCount = data ? data.length : 0;
    if (deletedCount === 0) {
      console.log("No bookmark found to delete for user_id:", user_id, "paper_id:", paper_id);
      return res.status(404).json({ message: "Bookmark not found" });
    }

    // 2. Fetch current bookmark_count
    const { data: paperData, error: fetchError } = await supabase
      .from("paper")
      .select("bookmark_count")
      .eq("paper_id", paper_id)
      .single();

    if (fetchError) {
      return res
        .status(500)
        .json({ message: "Paper unbookmarked but failed to fetch bookmark_count", error: fetchError });
    }

    // 3. Decrement bookmark_count, but not below 0
    const newBookmarkCount = Math.max((paperData?.bookmark_count || 1) - 1, 0);

    const { error: countError } = await supabase
      .from("paper")
      .update({ bookmark_count: newBookmarkCount })
      .eq("paper_id", paper_id);

    if (countError) {
      return res
        .status(500)
        .json({ message: "Paper unbookmarked but failed to decrement bookmark_count", error: countError });
    }

    console.log("Bookmark successfully removed, new count:", newBookmarkCount);
    return res.status(200).json({ message: "Paper unbookmarked", data });
  } catch (error) {
    console.error("updateUnbookmark catch error:", error);
    return res
      .status(500)
      .json({ message: "Error unbookmarking paper", error: error.message });
  }
};


const updateComment = async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const body = req.body;

    const newData = { user_id, ...body };

    const { data, error } = await supabase.from("comments").insert([newData]);

    if (error) {
      return res
        .status(500)
        .json({ message: "Error adding comment to post", error });
    }

    res.status(200).json({ message: "Comment added", data: newData });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment to post", error });
  }
};

/**
 * I assume that this function is for user manually inserting a new paper into db
 * Not sure if it was really used anywhere or not.
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function importPapers(req, res) {
  try {
    const user_id = req?.user?.id;
    if (!user_id) {
      console.error("Follower ID is missing");
      return res.status(400).json({ error: "Follower ID is required" });
    }
    console.log("user_id:", user_id);
    const currentTime = new Date().toISOString();

    // Fetch user embeddings
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("interest_embeddings, last_paper_fetch")
      .eq("id", user_id)
      .single();

    if (userError || !userData?.interest_embeddings) {

      return res.status(400).json({ message: "Error fetching user data" });
    }

    // Fetch paper Embeddings
    let query = supabase
      .from("paper")
      .select("*")
      .not("paper_embeddings", "is", null);

    if (userData.last_paper_fetch) {
      query = query.or(
        `created_at.gt.${userData.last_paper_fetch},paper_embeddings.not.is.null`
      );
    }

    const { data: papers, error: papersError } = await query;

    if (papersError) {
      return res.status(500).json({ message: "Error fetching papers", papersError });
    }

    const maxClicks = Math.max(...(papers ?? []).map((p) => p.click_count || 0), 0);
    const maxLikes = Math.max(...(papers ?? []).map((p) => p.like_count || 0), 0);
    const maxBookmarks = Math.max(...(papers ?? []).map((p) => p.bookmark_count || 0), 0);

    const rankedPapers = (papers ?? [])
        .map((paper) => {
          let paperEmb = paper.paper_embeddings;

          if (typeof paperEmb === "string") {
            try {
              paperEmb = JSON.parse(paperEmb);
            } catch {
              return null;
            }
          }

          if (!Array.isArray(paperEmb) || paperEmb.length !== userData.interest_embeddings.length) {
            return null;
          }

          const similarity = cosineSimilarity(userData.interest_embeddings, paperEmb);
          // Cosine similarity can be negative so clamp it to [0,1]
          const similarityScore = clamp01(similarity);

          const clickScore = safeLogNorm(paper.click_count || 0, maxClicks);
          const likeScore = safeLogNorm(paper.like_count || 0, maxLikes);
          const bookmarkScore = safeLogNorm(paper.bookmark_count || 0, maxBookmarks);
          const freshnessScore = getFreshnessScore(paper.published_date);

          const final_score =
              0.60 * similarityScore +
              0.15 * clickScore +
              0.10 * likeScore +
              0.10 * bookmarkScore +
              0.05 * freshnessScore;

          return {
            ...paper,
            similarity_score: similarity,
            click_score: clickScore,
            like_score: likeScore,
            bookmark_score: bookmarkScore,
            freshness_score: freshnessScore,
            final_score,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.final_score - a.final_score);

    // Update last paper fetch time
    const { error: updateError } = await supabase
      .from("users")
      .update({ last_paper_fetch: currentTime })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating last_paper_fetch:", updateError);
    }

    const papersWithReadableCategory = rankedPapers.slice(0, 20).map((paper) => ({
      ...paper,
      category_readable: getFullCategoryName(paper.categories),
      like_count: paper.like_count || 0,
      bookmark_count: paper.bookmark_count || 0
    }));

    // Send the response
    res.status(200).json({
      message: "Papers fetched successfully",
      data: papersWithReadableCategory,
      lastFetchTime: currentTime,
    });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error", error: error.message });
  }
}
async function getPaperForNewsLetter(user_id) {
  try {
    console.log("user_id:", user_id);
    const currentTime = new Date().toISOString();
    // Fetch user embeddings
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("interest_embeddings, last_paper_fetch")
      .eq("id", user_id)
      .single();

    console.log("Data: ", userData)
    if (userError || !userData?.interest_embeddings) {
      console.error("Error fetching user data for newsletter:", userError);
      return null;
    }

    // Fetch paper Embeddings
    let query = supabase
      .from("paper")
      .select("*")
      .not("paper_embeddings", "is", null);

    if (userData.last_paper_fetch) {
      query = query.or(
        `created_at.gt.${userData.last_paper_fetch},paper_embeddings.not.is.null`
      );
    }

    const { data: papers, error: papersError } = await query;

    if (papersError) {
      console.error("Error fetching papers for newsletter:", papersError);
      return null;
    }

    const maxClicks = Math.max(...(papers ?? []).map((p) => p.click_count || 0), 0);
    const maxLikes = Math.max(...(papers ?? []).map((p) => p.like_count || 0), 0);
    const maxBookmarks = Math.max(...(papers ?? []).map((p) => p.bookmark_count || 0), 0);

    const rankedPapers = (papers ?? [])
        .map((paper) => {
          let paperEmb = paper.paper_embeddings;

          if (typeof paperEmb === "string") {
            try {
              paperEmb = JSON.parse(paperEmb);
            } catch {
              return null;
            }
          }

          if (!Array.isArray(paperEmb) || paperEmb.length !== userData.interest_embeddings.length) {
            return null;
          }

          const similarity = cosineSimilarity(userData.interest_embeddings, paperEmb);
          // Cosine similarity can be negative so clamp it to [0,1]
          const similarityScore = clamp01(similarity);

          const clickScore = safeLogNorm(paper.click_count || 0, maxClicks);
          const likeScore = safeLogNorm(paper.like_count || 0, maxLikes);
          const bookmarkScore = safeLogNorm(paper.bookmark_count || 0, maxBookmarks);
          const freshnessScore = getFreshnessScore(paper.published_date);

          const final_score =
              0.60 * similarityScore +
              0.15 * clickScore +
              0.10 * likeScore +
              0.10 * bookmarkScore +
              0.05 * freshnessScore;

          return {
            ...paper,
            similarity_score: similarity,
            click_score: clickScore,
            like_score: likeScore,
            bookmark_score: bookmarkScore,
            freshness_score: freshnessScore,
            final_score,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.final_score - a.final_score);

    // Update last paper fetch time
    const { error: updateError } = await supabase
      .from("users")
      .update({ last_paper_fetch: currentTime })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating last_paper_fetch:", updateError);
    }

    // return the response
    return rankedPapers[0];
  } catch (error) {
    console.error("Error in getPaperForNewsLetter:", error);
    return null;
  }
}
/**
 * Helper function to retrieve specific paper from database by id
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getPaperById = async (req, res) => {
  console.log("hitted paperById")
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("paper")
      .select("*")
      .eq("paper_id", id)
      .single(); // Use .single() to fetch a single record

    if (error) {
      return res
        .status(500)
        .json({ message: "Error adding bookmarks to post", error });
    }

    const paperWithCategory = {
      ...data,
      category_readable: getFullCategoryName(data.categories)
    };
    res.status(200).json({ message: "Paper fetched successfully", data: paperWithCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching paper", error: error.message });
  }
};




async function generateEmbedding(text) {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  console.log("Generating embedding...");
  const embedding = await extractor(text, { pooling: "mean", normalize: true });
  const float32Array = new Float32Array(embedding.data);
  const array = Array.from(float32Array);
  const embeddingArray = [...array];
  return embeddingArray;
}

const generateEmbeddingForUserInterest = async (user_id) => {
  console.log("Starting to generate missing embeddings for interest..", user_id);

  const {data: userRow, error} = await supabase
      .from("users")
      .select("id, user_interest")
      .eq("id", user_id)
      .single();

  if (error) {
    console.error("Error fetching user:", error);
    return false;
  }

  if (!userRow?.user_interest) {
    console.log("No user_interest found for user:", user_id);
    return false;
  }

  let interests;
  try {
    interests = JSON.parse(userRow.user_interest);
  } catch (e) {
    console.error("user_interest is not valid JSON:", e);
    return false;
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    console.log("No interest found for user:", user_id);
    return false;
  }

  // generates all embeddings in parallel
  const embeddings = await Promise.all(
      interests.map((i) => generateEmbedding(String(i)))
  );

  // avg embeddings
  const embeddingSize = embeddings[0].length;
  const avg = Array(embeddingSize).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < embeddingSize; i++) avg[i] += emb[i];
  }
  for (let i = 0; i < embeddingSize; i++) avg[i] /= embeddings.length;

  const {error: updateErr} = await supabase
      .from("users")
      .update({interest_embeddings: avg})
      .eq("id", user_id);

  if (updateErr) {
    console.error("Failed to update interest_embeddings:", updateErr);
    return false;
  }

  console.log("Updated interest_embeddings for user:", user_id);
  return true;
};

const generateEmbeddingWhileSignUp = async (interestsArray, user_id) => {

  console.log("Starting to generate userInterest embeddings while signup", interestsArray);
  const data = [...interestsArray];
  console.log("Data: ", data);
  const embeddings = [];
  data.forEach(async interest => {
    const embedding = await generateEmbedding(interest);
    embeddings.push(embedding);

    if (embeddings.length > 0) {
      const embeddingSize = embeddings[0].length;
      const averageEmbedding = Array(embeddingSize).fill(0);
      embeddings.forEach(embedding => {
        for (let i = 0; i < embeddingSize; i++) {
          averageEmbedding[i] += embedding[i];
        }
      })
      for (let i = 0; i < embeddingSize; i++) {
        averageEmbedding[i] /= embeddings.length;
      }

      const { data, error } = await supabase
        .from("users")
        .update({ interest_embeddings: averageEmbedding })
        .eq("id", user_id)
        .select("*");
      // console.log("data,error", data, error);

      if (error) {
        console.log("error while saving embeddings: ", error);
        return false;
      }
    } else {
      console.log("embeddings.length > 0--- false");
    }
  }
  );
  return true;

}
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be the same length");
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

function safeLogNorm(value, maxValue) {
  if(!maxValue || maxValue <= 0) return 0;
  return Math.log1p(value || 0) / Math.log1p(maxValue);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function getFreshnessScore(publishedDate) {
  if (!publishedDate) return 0;
  const daysSincePublication = Math.floor(
      (new Date() - new Date(publishedDate)) / (1000 * 60 * 60 * 24)
  );
  return Math.exp(-daysSincePublication / 90);
}

async function generateMissingEmbeddings(req, res) {
  updatePaperCategory();
  try {
    console.log("Starting to generate missing embeddings...");
    const { data: papers, error } = await supabase
      .from("paper")
      .select("paper_id, summary")
      .is("paper_embeddings", null);


    if (error) {
      console.error("Error fetching papers:", error);
      if (res) return res.status(500).json({ error: "Failed to fetch papers" });
      return;
    }
    if (!papers || papers.length === 0) {
      const message = "No papers found that need embeddings";
      console.log(message);
      if (res) return res.status(200).json({ message });
      return;
    }

    let processed = 0;
    for (const paper of papers) {
      try {
        if (!paper.summary) continue;
        const paperSummary = paper.summary;

        const embedResponse = await generateEmbedding(paperSummary);
        // console.log("Embedding:", embedResponse.data);



        const resp = await supabase
          .from("paper")
          .update({ paper_embeddings: embedResponse })
          // .select("*")
          .eq("paper_id", paper.paper_id)
          .select();

        // if (!updateError) processed++;
        processed++;
        // console.log("resp: ", JSON.stringify(resp, null, 2));
      } catch (err) {
        console.error(`Error processing paper ${paper.paper_id}:`, err, JSON.stringify(err, null, 2));
      }
      // if (processed > 100) {
      //   break;
      // }
    }

    const message = `Successfully processed ${processed} out of ${papers.length} papers`;
    if (res) return res.status(200).json({ message });
  } catch (err) {
    console.error("Error in generateMissingEmbeddings:", err);
    if (res) return res.status(500).json({ error: "Internal server error" });
  }
}

async function updatePaperCategory() {
  const papers = await supabase
    .from("paper")
    .select("*")
    .not("categories", "is", null)
    .select();

  // console.log("Total Papers: ", JSON.stringify(papers.data, null, 2));
}


const incrementPaperClick = async (req, res) => {
  try {
    console.log("Received increment-click request:", req.body);

    const { paper_id } = req.body;
    if (!paper_id) {
      console.error("Error: Missing `paper_id` in request body.");
      return res.status(400).json({ error: "Missing `paper_id`" });
    }

    const { data, error } = await supabase
      .from("paper")
      .select("click_count")
      .eq("paper_id", paper_id)
      .single();

    if (error || !data) {
      console.error("Error fetching click count:", error);
      return res.status(500).json({ error: "Failed to fetch click count" });
    }

    // Increment count
    const newClickCount = (data.click_count || 0) + 1;

    // Update in database
    const { error: updateError } = await supabase
      .from("paper")
      .update({ click_count: newClickCount })
      .eq("paper_id", paper_id);

    if (updateError) {
      console.error("Error updating click count:", updateError);
      return res.status(500).json({ error: "Failed to update click count" });
    }

    res.status(200).json({ message: "Click count updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const fetchPapersByClickCount = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('paper')
      .select('paper_id, title, author_names, published_date, categories, doi, summary, like_count, bookmark_count')
      .order('click_count', { ascending: false });

    if (error) {
      console.error('Error fetching papers:', error);
      return res.status(500).json({ error: "Failed to fetch papers" });
    }

     // Add readable category name to each paper
    // const papersWithReadableCategory = await Promise.all(
    //   data.map(async (paper) => {
    //     let readable = "Unknown";
    //     if (paper.categories) {
    //       // getFullCategoryName expects an object with a category array
    //       readable = await getFullCategoryName({ category: [{ $: { term: paper.categories } }] });
    //     }
    //     return { ...paper, category_readable: readable };
    //   })
    // );
    // res.status(200).json({ data });

    const papersWithReadableCategory = data.map((paper) => ({
      ...paper,
      category_readable: getFullCategoryName(paper.categories),
      like_count: paper.like_count || 0,
      bookmark_count: paper.bookmark_count || 0
    }));

    res.status(200).json({ data: papersWithReadableCategory });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};




// updatePaperCategory();
async function searchPapers(req, res) {
  const { searchTerm, start_date, end_date } = req.body;

  if (!searchTerm && !start_date && !end_date) {
    return res.status(400).json({ message: "At least one search criterion is required" });
  }

  try {
    let query = supabase
      .from("paper")
      .select("paper_id, title, author_names, published_date, summary, pdf_url, doi, categories, like_count, bookmark_count");

    // Search in title, author_names
    if (searchTerm && searchTerm.trim() !== "") {
      const sanitizedSearchTerm = searchTerm.trim().toLowerCase();
      query = query.or(
        `title.ilike.%${sanitizedSearchTerm}%,author_names.ilike.%${sanitizedSearchTerm}%`
      );
    }

    // Filter by start_date
    if (start_date) {
      query = query.gte("published_date", start_date);
    }

    // Filter by end_date
    if (end_date) {
      const adjustedEndDate = new Date(end_date);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);
      query = query.lte("published_date", adjustedEndDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ message: "Error fetching search results", error });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ message: "No results found", data: [] });
}

// Add readable category name to each paper
const papersWithReadableCategory = data.map((paper) => ({
  ...paper,
  category_readable: getFullCategoryName(paper.categories),
  like_count: paper.like_count || 0,
  bookmark_count: paper.bookmark_count || 0
}));

res.status(200).json({
  message: "Search results fetched successfully",
  resultsCount: papersWithReadableCategory.length,
  data: papersWithReadableCategory,
});

  } catch (error) {
    res.status(500).json({ message: "Unexpected error occurred", error: error.message });
  }
}



const getPaperLikeCountFromId = async (req, res) => {
  const { id } = req.params;

  try {
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact" })
      .eq("paper_id", id);

    if (error) {
      console.error("Error getting like count:", error);
      return res
        .status(500)
        .json({ message: "Error getting like count", error: error.message });
    }

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting like count:", error);
    return res
      .status(500)
      .json({ message: "Error getting like count", error: error.message });
  }
};

const getPaperBookmarkCountFromId = async (req, res) => {
  const { id } = req.params;

  try {
    const { count, error } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact" })
      .eq("paper_id", id);

    if (error) {
      console.error("Error getting bookmark count:", error);
      return res.status(500).json({
        message: "Error getting bookmark count",
        error: error.message,
      });
    }

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting bookmark count:", error);
    return res
      .status(500)
      .json({ message: "Error getting bookmark count", error: error.message });
  }
};

const getPaperCommentCountFromId = async (req, res) => {
  const { id } = req.params;

  try {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact" })
      .eq("paper_id", id);

    if (error) {
      console.error("Error getting comment count:", error);
      return res
        .status(500)
        .json({ message: "Error getting comment count", error: error.message });
    }

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting comment count:", error);
    return res
      .status(500)
      .json({ message: "Error getting comment count", error: error.message });
  }
};

const getCommentsFromId = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
            comment_id,
            content,
            timestamp,
            users (
                name,
                username
            )
        `
      )
      .eq("paper_id", id)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error getting comments:", error);
      return res.status(500).json({
        message: "Error getting comments",
        error: error.message,
      });
    }

    // Transform the data to a simpler format
    const formattedComments = data.map((comment) => ({
      commentId: comment.comment_id,
      content: comment.content,
      timestamp: comment.timestamp,
      userName: comment.users.name,
      userHandle: comment.users.username,
    }));

    return res.status(200).json({ comments: formattedComments });
  } catch (error) {
    console.error("Error getting comments:", error);
    return res.status(500).json({
      message: "Error getting comments",
      error: error.message,
    });
  }
};

const checkIfAlreadyLiked = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id || req.body.user_id;

  if (!id || !user_id) {
    console.log("user_id or id not found in already liked: ", user_id, id);
    return res.status(400).json({ message: "Missing required fields" })
  }
  try {
    const { data, error } = await supabase
      .from("likes")
      .select("like_id")
      .eq("paper_id", id)
      .eq("user_id", user_id)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore "no rows returned" error
      console.error("Error checking like status:", error);
      return res.status(500).json({
        message: "Error checking like status",
        error: error.message,
      });
    }

    // If data exists, user has liked the paper
    const hasLiked = data !== null;

    return res.status(200).json({ hasLiked });
  } catch (error) {
    console.error("Error checking like status:", error);
    return res.status(500).json({
      message: "Error checking like status",
      error: error.message,
    });
  }
};

const checkIfAlreadyBookmarked = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id || req.body.user_id;
  if (!id || !user_id) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("paper_id", id)
      .eq("user_id", user_id)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({
        message: "Error checking bookmark status",
        error: error.message,
      });
    }

    // FIX: Only true if a row with id exists
    const hasBookmarked = !!(data && data.id);

    return res.status(200).json({ hasBookmarked });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking bookmark status",
      error: error.message,
    });
  }
};

const fetchBookmarks = async (req, res) => {
  const user_id = req?.user?.id; // Extract user ID from authenticated request
  if (!user_id) {
    console.log("user_id not found: ", user_id);
    return res.status(400).json({ message: "Missing required fields" })
  }
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
                paper_id,
                timestamp,
                paper (
                    title,
                    author_names,
                    published_date,
                    doi,
                    summary,
                    pdf_url
                )
            `)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return res.status(500).json({ message: 'Error fetching bookmarks', error });
    }

    // Format the response to include paper details
    const formattedBookmarks = data.map(bookmark => ({
      paper_id: bookmark.paper_id,
      timestamp: bookmark.timestamp,
      title: bookmark.paper?.title,
      author_names: bookmark.paper?.author_names,
      published_date: bookmark.paper?.published_date,
      doi: bookmark.paper?.doi,
      summary: bookmark.paper?.summary,
      pdf_url: bookmark.paper?.pdf_url,
      categories: bookmark.paper?.categories, // added categories
      category_readable: getFullCategoryName(bookmark.paper?.categories) // added readable category name
    }));

    res.status(200).json({ message: 'Bookmarks fetched successfully', data: formattedBookmarks });
  } catch (error) {
    console.error('Error in fetchBookmarks:', error);
    res.status(500).json({ message: 'Unexpected error occurred', error });
  }
};

const fetchRecommendations = async (req, res) => {
  const user_id = req?.user?.id;
  if (!user_id) return res.status(400).json({ message: "Missing required fields" });

  try {
    // Get user interest embeddings
    const { data: user, error: userErr } = await supabase
        .from("users")
        .select("interest_embeddings")
        .eq("id", user_id)
        .single();

    if (userErr) throw userErr;

    let userEmb = user?.interest_embeddings;

    // If it's stored as JSON string then parse it
    if (typeof userEmb === "string") {
      try { userEmb = JSON.parse(userEmb); } catch { userEmb = null; }
    }

    // If user has no embeddings then return popular papers
    if (!Array.isArray(userEmb) || userEmb.length === 0) {
      const { data, error } = await supabase
          .from("paper")
          .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count")
          .order("click_count", { ascending: false, nullsFirst: false })
          .limit(10);

      if (error) throw error;

      // match the bookmark response shape
      const formatted = (data ?? []).map(p => ({
        paper_id: p.paper_id,
        title: p.title,
        author_names: p.author_names,
        published_date: p.published_date,
        doi: p.doi,
        summary: p.summary,
        pdf_url: p.pdf_url,
        categories: p.categories,
        category_readable: getFullCategoryName(p.categories),
        click_count: p.click_count,
        like_count: p.like_count || 0,
        bookmark_count: p.bookmark_count || 0
      }));

      return res.status(200).json({
        message: "User embedding missing, returned popular papers",
        data: formatted
      });
    }

    // Fetch candidate papers with embeddings
    const { data: papers, error: paperErr } = await supabase
        .from("paper")
        .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count, paper_embeddings")
        .not("paper_embeddings", "is", null)
        .order("published_date", { ascending: false })
        .limit(300);

    if (paperErr) throw paperErr;

    // Score and rank
    const maxClicks = Math.max(...(papers ?? []).map((p) => p.click_count || 0), 0);
    const maxLikes = Math.max(...(papers ?? []).map((p) => p.like_count || 0), 0);
    const maxBookmarks = Math.max(...(papers ?? []).map((p) => p.bookmark_count || 0), 0);

    const scored = (papers ?? [])
        .map((p) => {
          let paperEmb = p.paper_embeddings;

          if (typeof paperEmb === "string") {
            try {
              paperEmb = JSON.parse(paperEmb);
            } catch {
              return null;
            }
          }

          if (!Array.isArray(paperEmb) || paperEmb.length !== userEmb.length) {
            return null;
          }

          const similarity = cosineSimilarity(userEmb, paperEmb);
          // Cosine similarity can be negative so clamp it to [0,1]
          const similarityScore = clamp01(similarity);

          const clickScore = safeLogNorm(p.click_count || 0, maxClicks);
          const likeScore = safeLogNorm(p.like_count || 0, maxLikes);
          const bookmarkScore = safeLogNorm(p.bookmark_count || 0, maxBookmarks);
          const freshnessScore = getFreshnessScore(p.published_date);

          // Weighted final score
          const final_score =
              0.60 * similarityScore +
              0.15 * clickScore +
              0.10 * likeScore +
              0.10 * bookmarkScore +
              0.05 * freshnessScore;

          return {
            ...p,
            similarity_score: similarity,
            click_score: clickScore,
            like_score: likeScore,
            bookmark_score: bookmarkScore,
            freshness_score: freshnessScore,
            final_score,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.final_score - a.final_score)
        .slice(0, 10);

    // Format response
    const formatted = (scored ?? []).map(p => ({
      paper_id: p.paper_id,
      title: p.title,
      author_names: p.author_names,
      published_date: p.published_date,
      doi: p.doi,
      summary: p.summary,
      pdf_url: p.pdf_url,
      categories: p.categories,
      category_readable: getFullCategoryName(p.categories),
      click_count: p.click_count || 0,
      like_count: p.like_count || 0,
      bookmark_count: p.bookmark_count || 0,
      similarity_score: p.similarity_score,
      click_score: p.click_score,
      like_score: p.like_score,
      bookmark_score: p.bookmark_score,
      freshness_score: p.freshness_score,
      final_score: p.final_score
    }));

    res.status(200).json({ message: 'Recommendations fetched successfully', data: formatted });

  } catch (err) {
    console.error('fetchRecommendations:', err);
    res.status(500).json({ message: 'Unexpected error occurred' });
  }
};

const fetchExploreRecommendations = async (req, res) => {
  const user_id = req?.user?.id;
  if (!user_id) return res.status(400).json({ message: "Missing required fields" });

  //If the user has an offset in the query request, use pagination
  if(req.query.offset){
    try {
      const PAPER_RANGE_OFFSET = 21;
      const offset = Number(req.query.offset) || 0;
      const limit = Number(req.query.limit) || PAPER_RANGE_OFFSET;
      const { data: user, error: userErr } = await supabase
          .from("users")
          .select("interest_embeddings")
          .eq("id", user_id)
          .single();

      if (userErr) throw userErr;

      let userEmb = user?.interest_embeddings;

      if (typeof userEmb === "string") {
        try {
          userEmb = JSON.parse(userEmb);
        } catch {
          userEmb = null;
        }
      }

      if (!Array.isArray(userEmb) || userEmb.length === 0) {
        const { data, error } = await supabase
            .from("paper")
            .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count")
            .order("click_count", { ascending: false, nullsFirst: false });

        if (error) throw error;

        const formatted = (data ?? []).map((p) => ({
          paper_id: p.paper_id,
          title: p.title,
          author_names: p.author_names,
          published_date: p.published_date,
          doi: p.doi,
          summary: p.summary,
          pdf_url: p.pdf_url,
          categories: p.categories,
          category_readable: getFullCategoryName(p.categories),
          click_count: p.click_count || 0,
          like_count: p.like_count || 0,
          bookmark_count: p.bookmark_count || 0
        }));

        return res.status(200).json({
          message: "User embedding missing, returned explore papers",
          data: formatted
        });
      }

      const { data: papers, error: paperErr } = await supabase
          .from("paper")
          .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count, paper_embeddings")
          .not("paper_embeddings", "is", null)
          .order("published_date", { ascending: false })
          .range(offset, offset + limit - 1);

      if (paperErr) throw paperErr;

      const maxClicks = Math.max(...(papers ?? []).map((p) => p.click_count || 0), 0);
      const maxLikes = Math.max(...(papers ?? []).map((p) => p.like_count || 0), 0);
      const maxBookmarks = Math.max(...(papers ?? []).map((p) => p.bookmark_count || 0), 0);

      const scored = (papers ?? [])
          .map((p) => {
            let paperEmb = p.paper_embeddings;

            if (typeof paperEmb === "string") {
              try {
                paperEmb = JSON.parse(paperEmb);
              } catch {
                return null;
              }
            }

            if (!Array.isArray(paperEmb) || paperEmb.length !== userEmb.length) {
              return null;
            }

            const similarity = cosineSimilarity(userEmb, paperEmb);
            const similarityScore = clamp01(similarity);
            const clickScore = safeLogNorm(p.click_count || 0, maxClicks);
            const likeScore = safeLogNorm(p.like_count || 0, maxLikes);
            const bookmarkScore = safeLogNorm(p.bookmark_count || 0, maxBookmarks);
            const freshnessScore = getFreshnessScore(p.published_date);

            const final_score =
                0.60 * similarityScore +
                0.15 * clickScore +
                0.10 * likeScore +
                0.10 * bookmarkScore +
                0.05 * freshnessScore;

            return {
              ...p,
              similarity_score: similarity,
              click_score: clickScore,
              like_score: likeScore,
              bookmark_score: bookmarkScore,
              freshness_score: freshnessScore,
              final_score,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.final_score - a.final_score);

      const formatted = (scored ?? []).map((p) => ({
        paper_id: p.paper_id,
        title: p.title,
        author_names: p.author_names,
        published_date: p.published_date,
        doi: p.doi,
        summary: p.summary,
        pdf_url: p.pdf_url,
        categories: p.categories,
        category_readable: getFullCategoryName(p.categories),
        click_count: p.click_count || 0,
        like_count: p.like_count || 0,
        bookmark_count: p.bookmark_count || 0,
        similarity_score: p.similarity_score,
        click_score: p.click_score,
        like_score: p.like_score,
        bookmark_score: p.bookmark_score,
        freshness_score: p.freshness_score,
        final_score: p.final_score
      }));

      res.status(200).json({
        message: "Explore recommendations fetched successfully",
        data: formatted
      });
    } catch (err) {
      console.error("fetchExploreRecommendations:", err);
      res.status(500).json({ message: "Unexpected error occurred" });
    }
  }
  else{
      try {
        const { data: user, error: userErr } = await supabase
            .from("users")
            .select("interest_embeddings")
            .eq("id", user_id)
            .single();

        if (userErr) throw userErr;

        let userEmb = user?.interest_embeddings;

        if (typeof userEmb === "string") {
          try {
            userEmb = JSON.parse(userEmb);
          } catch {
            userEmb = null;
          }
        }

        if (!Array.isArray(userEmb) || userEmb.length === 0) {
          const { data, error } = await supabase
              .from("paper")
              .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count")
              .order("click_count", { ascending: false, nullsFirst: false });

          if (error) throw error;

          const formatted = (data ?? []).map((p) => ({
            paper_id: p.paper_id,
            title: p.title,
            author_names: p.author_names,
            published_date: p.published_date,
            doi: p.doi,
            summary: p.summary,
            pdf_url: p.pdf_url,
            categories: p.categories,
            category_readable: getFullCategoryName(p.categories),
            click_count: p.click_count || 0,
            like_count: p.like_count || 0,
            bookmark_count: p.bookmark_count || 0
          }));

          return res.status(200).json({
            message: "User embedding missing, returned explore papers",
            data: formatted
          });
        }

        const { data: papers, error: paperErr } = await supabase
            .from("paper")
            .select("paper_id, title, author_names, published_date, doi, summary, pdf_url, categories, click_count, like_count, bookmark_count, paper_embeddings")
            .not("paper_embeddings", "is", null)
            .order("published_date", { ascending: false });

        if (paperErr) throw paperErr;

        const maxClicks = Math.max(...(papers ?? []).map((p) => p.click_count || 0), 0);
        const maxLikes = Math.max(...(papers ?? []).map((p) => p.like_count || 0), 0);
        const maxBookmarks = Math.max(...(papers ?? []).map((p) => p.bookmark_count || 0), 0);

        const scored = (papers ?? [])
            .map((p) => {
              let paperEmb = p.paper_embeddings;

              if (typeof paperEmb === "string") {
                try {
                  paperEmb = JSON.parse(paperEmb);
                } catch {
                  return null;
                }
              }

              if (!Array.isArray(paperEmb) || paperEmb.length !== userEmb.length) {
                return null;
              }

              const similarity = cosineSimilarity(userEmb, paperEmb);
              const similarityScore = clamp01(similarity);
              const clickScore = safeLogNorm(p.click_count || 0, maxClicks);
              const likeScore = safeLogNorm(p.like_count || 0, maxLikes);
              const bookmarkScore = safeLogNorm(p.bookmark_count || 0, maxBookmarks);
              const freshnessScore = getFreshnessScore(p.published_date);

              const final_score =
                  0.60 * similarityScore +
                  0.15 * clickScore +
                  0.10 * likeScore +
                  0.10 * bookmarkScore +
                  0.05 * freshnessScore;

              return {
                ...p,
                similarity_score: similarity,
                click_score: clickScore,
                like_score: likeScore,
                bookmark_score: bookmarkScore,
                freshness_score: freshnessScore,
                final_score,
              };
            })
            .filter(Boolean)
            .sort((a, b) => b.final_score - a.final_score);

        const formatted = (scored ?? []).map((p) => ({
          paper_id: p.paper_id,
          title: p.title,
          author_names: p.author_names,
          published_date: p.published_date,
          doi: p.doi,
          summary: p.summary,
          pdf_url: p.pdf_url,
          categories: p.categories,
          category_readable: getFullCategoryName(p.categories),
          click_count: p.click_count || 0,
          like_count: p.like_count || 0,
          bookmark_count: p.bookmark_count || 0,
          similarity_score: p.similarity_score,
          click_score: p.click_score,
          like_score: p.like_score,
          bookmark_score: p.bookmark_score,
          freshness_score: p.freshness_score,
          final_score: p.final_score
        }));

        res.status(200).json({
          message: "Explore recommendations fetched successfully",
          data: formatted
        });
      } catch (err) {
        console.error("fetchExploreRecommendations:", err);
        res.status(500).json({ message: "Unexpected error occurred" });
      }
    }
  };

  const fetchPapersByClickCountByLimit = async (req, res) => {
    try {
      const PAPER_RANGE_OFFSET = 21;
      const offset = Number(req.query.offset) || 0;
      const limit = Number(req.query.limit) || PAPER_RANGE_OFFSET;

      const { data, error } = await supabase
        .from('paper')
        .select('paper_id, title, author_names, published_date, categories, doi, summary, like_count, bookmark_count')
        .order('click_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching papers:', error);
        return res.status(500).json({ error: "Failed to fetch papers" });
      }

      const papersWithReadableCategory = data.map((paper) => ({
        ...paper,
        category_readable: getFullCategoryName(paper.categories),
        like_count: paper.like_count || 0,
        bookmark_count: paper.bookmark_count || 0
      }));

      res.status(200).json({ data: papersWithReadableCategory });

    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  const fetchLikes = async (req, res) => {
    const user_id = req?.user?.id;
    if (!user_id) {
      console.error("User ID is missing");
      return res.status(400).json({ error: "Follower ID is required" });
    }

    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
                  paper_id,
                  timestamp,
                  paper (
                      title,
                      author_names,
                      published_date,
                      doi,
                      summary,
                      pdf_url,
                      categories
                  )
              `)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error fetching likes:', error);
        return res.status(500).json({ message: 'Error fetching likes', error });
      }

      // Format the response to include paper details
      const formattedLikes = data.map(like => ({
        paper_id: like.paper_id,
        timestamp: like.timestamp,
        title: like.paper?.title,
        author_names: like.paper?.author_names,
        published_date: like.paper?.published_date,
        doi: like.paper?.doi,
        summary: like.paper?.summary,
        pdf_url: like.paper?.pdf_url,
        categories: like.paper?.categories,
        category_readable: getFullCategoryName(like.paper?.categories)
      }));

      res.status(200).json({ message: 'Likes fetched successfully', data: formattedLikes });
    } catch (error) {
      console.error('Error in fetchLikes:', error);
      res.status(500).json({ message: 'Unexpected error occurred', error });
    }
};

const fetchComments = async (req, res) => {
  const user_id = req?.user?.id;
  if (!user_id) {
    console.error("user ID is missing");
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("comments")
      .select(`
          paper_id,
          content,
          timestamp,
          paper (
            title,
            author_names,
            published_date,
            doi,
            summary,
            pdf_url
          )
        `)
      .eq("user_id", user_id)
      .order("timestamp", { ascending: false }); // Sort comments by timestamp

    if (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({ message: "Error fetching comments", error });
    }

    // Group comments by paper_id
    const groupedComments = data.reduce((acc, comment) => {
      const paperId = comment.paper_id;
      if (!acc[paperId]) {
        acc[paperId] = {
          paper_id: paperId,
          title: comment.paper?.title,
          author_names: comment.paper?.author_names,
          published_date: comment.paper?.published_date,
          doi: comment.paper?.doi,
          summary: comment.paper?.summary,
          pdf_url: comment.paper?.pdf_url,
          categories: comment.paper?.categories,
          category_readable: getFullCategoryName(comment.paper?.categories),
          comments: [], // Array to store comments for this paper
        };
      }

      acc[paperId].comments.push({
        content: comment.content,
        timestamp: comment.timestamp,
      });

      return acc;
    }, {});

    // Convert the grouped object to an array
    const formattedComments = Object.values(groupedComments);

    res.status(200).json({
      message: "Comments fetched successfully",
      data: formattedComments,
    });
  } catch (error) {
    console.error("Error in fetchComments:", error);
    res.status(500).json({ message: "Unexpected error occurred", error });
  }
};








const fetchInterests = async (req, res) => {
  const user_id = req?.user?.id;
  console.log("received user ID:", user_id)// Assuming user ID is retrieved from authentication context

  if (!user_id) {
    console.log("User ID not found: ", user_id);
    return res.status(400).json({ message: "Missing required user ID" });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_interest')
      .eq('id', user_id)
      .single(); // Fetching the single record that matches the user ID


    console.log("Database response:", data, error);
    if (error) {
      console.error('Error fetching user interests:', error);
      return res.status(500).json({ message: 'Error fetching user interests', error });
    }

    // Parse the JSON string into an array of interests
    const interests = data && data.user_interest ? JSON.parse(data.user_interest) : [];

    // Ensure that there are always two or more interests
    if (interests.length < 2) {
      return res.status(400).json({ message: "Less than two interests found, which is unexpected." });
    }

    res.status(200).json({ message: 'Interests fetched successfully', interests });
  } catch (error) {
    console.error('Unexpected error in fetchInterests:', error);
    res.status(500).json({ message: 'Unexpected error occurred', error });
  }
};

const fetchCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('category')
      .select('PrimaryCategory, SubCategory'); // Fetching all rows with primary and sub categories

    console.log("Database response:", data, error);
    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Error fetching categories', error });
    }

    if (!data || data.length === 0) {
      console.error('No categories found.');
      return res.status(404).json({ message: "No categories found" });
    }

    // Manually parse SubCategory since it's now stored as text
    const categories = data.reduce((acc, item) => {
      acc[item.PrimaryCategory] = item.SubCategory ? JSON.parse(item.SubCategory) : [];
      return acc;
    }, {});

    res.status(200).json({ message: 'Categories fetched successfully', categories });
  } catch (error) {
    console.error('Unexpected error in fetchCategories:', error);
    res.status(500).json({ message: 'Unexpected error occurred', error });
  }
};

//new function to get full category name
function getFullCategoryName(categories) {
  if (!categories) return "General";
  const firstCategory = categories.split(",")[0].trim();
  const [prefix, sub] = firstCategory.split(".");

  // Computer Science
  if (prefix === "cs") {
    switch (sub) {
      case "AI": return "Artificial Intelligence";
      case "AR": return "Augmented Reality";
      case "CC": return "Computational Complexity";
      case "CE": return "Computational Engineering, Finance, and Science";
      case "CG": return "Computational Geometry";
      case "CR": return "Cryptography and Security";
      case "CL": return "Computation and Language";
      case "CV": return "Computer Vision and Pattern Recognition";
      case "CY": return "Computers and Society";
      case "DB": return "Databases";
      case "DC": return "Distributed, Parallel, and Cluster Computing";
      case "DL": return "Digital Libraries";
      case "DM": return "Discrete Mathematics";
      case "DS": return "Data Structures and Algorithms";
      case "ET": return "Emerging Technologies";
      case "FL": return "Formal Languages and Automata Theory";
      case "GL": return "General Literature";
      case "GR": return "Graphics";
      case "GT": return "Computer Science and Game Theory";
      case "HC": return "Human-Computer Interaction";
      case "IR": return "Information Retrieval";
      case "IT": return "Information Theory";
      case "LG": return "Machine Learning";
      case "LO": return "Logic in Computer Science";
      case "MA": return "Multiagent Systems";
      case "MM": return "Multimedia";
      case "MS": return "Mathematical Software";
      case "NA": return "Numerical Analysis";
      case "NE": return "Neural and Evolutionary Computing";
      case "NI": return "Networking and Internet Architecture";
      case "OH": return "Other Computer Science";
      case "OS": return "Operating Systems";
      case "PF": return "Performance";
      case "PL": return "Programming Languages";
      case "RO": return "Robotics";
      case "SC": return "Symbolic Computation";
      case "SD": return "Sound";
      case "SE": return "Software Engineering";
      case "SI": return "Social and Information Networks";
      case "SY": return "Systems and Control";
      default: return "Unknown Category";
    }
  }

  // Economics
  if (prefix === "econ") {
    switch (sub) {
      case "EM": return "Econometrics";
      case "GN": return "General Economics";
      case "TH": return "Theoretical Economics";
      default: return "Unknown Category";
    }
  }

  // Electrical Engineering and Systems Science
  if (prefix === "eess") {
    switch (sub) {
      case "AS": return "Audio and Speech Processing";
      case "IV": return "Image and Video Processing";
      case "SP": return "Signal Processing";
      case "SY": return "Systems and Control";
      default: return "Unknown Category";
    }
  }

  // Mathematics
  if (prefix === "math") {
    switch (sub) {
      case "AC": return "Commutative Algebra";
      case "AG": return "Algebraic Geometry";
      case "AP": return "Analysis of PDEs";
      case "AT": return "Algebraic Topology";
      case "CA": return "Classical Analysis and ODEs";
      case "CO": return "Combinatorics";
      case "CT": return "Category Theory";
      case "CV": return "Complex Variables";
      case "DG": return "Differential Geometry";
      case "DS": return "Dynamical Systems";
      case "FA": return "Functional Analysis";
      case "GM": return "General Mathematics";
      case "GN": return "General Topology";
      case "GR": return "Group Theory";
      case "GT": return "Geometric Topology";
      case "HO": return "History and Overview";
      case "IT": return "Information Theory";
      case "KT": return "K-Theory and Homology";
      case "LO": return "Logic";
      case "MG": return "Metric Geometry";
      case "MP": return "Mathematical Physics";
      case "NA": return "Numerical Analysis";
      case "NT": return "Number Theory";
      case "OA": return "Operator Algebras";
      case "OC": return "Optimization and Control";
      case "PR": return "Probability";
      case "QA": return "Quantum Algebra";
      case "RA": return "Rings and Algebras";
      case "RT": return "Representation Theory";
      case "SG": return "Symplectic Geometry";
      case "SP": return "Spectral Theory";
      case "ST": return "Statistics Theory";
      default: return "Unknown Category";
    }
  }

  // Quantitative Biology
  if (prefix === "q-bio") {
    switch (sub) {
      case "BM": return "Biomolecules";
      case "CB": return "Cell Biology";
      case "GN": return "Genomics";
      case "MN": return "Molecular Networks";
      case "NC": return "Neurons and Cognition";
      case "OT": return "Other Quantitative Biology";
      case "PE": return "Populations and Evolution";
      case "QM": return "Quantitative Methods";
      case "SC": return "Subcellular Processes";
      case "TO": return "Tissues and Organs";
      default: return "Unknown Category";
    }
  }

  // Quantitative Finance
  if (prefix === "q-fin") {
    switch (sub) {
      case "CP": return "Computational Finance";
      case "EC": return "Economics";
      case "GN": return "General Finance";
      case "MF": return "Mathematical Finance";
      case "PM": return "Portfolio Management";
      case "PR": return "Pricing of Securities";
      case "RM": return "Risk Management";
      case "ST": return "Statistical Finance";
      case "TR": return "Trading and Market Microstructure";
      default: return "Unknown Category";
    }
  }

  // Statistics
  if (prefix === "stat") {
    switch (sub) {
      case "AP": return "Applications";
      case "CO": return "Computation";
      case "ML": return "Machine Learning";
      case "ME": return "Methodology";
      case "OT": return "Other Statistics";
      case "SH": return "Statistics Theory";
      default: return "Unknown Category";
    }
  }

  // Single-prefix categories (no subcategory)
  switch (prefix) {
    case "astro-ph": return "Astrophysics";
    case "cond-mat": return "Condensed Matter";
    case "gr-qc": return "General Relativity and Quantum Cosmology";
    case "hep-ex": return "High Energy Physics - Experiment";
    case "hep-lat": return "High Energy Physics - Lattice";
    case "hep-ph": return "High Energy Physics - Phenomenology";
    case "hep-th": return "High Energy Physics - Theory";
    case "math-ph": return "Mathematical Physics";
    case "nlin": return "Nonlinear Sciences";
    case "nucl-ex": return "Nuclear Experiment";
    case "nucl-th": return "Nuclear Theory";
    case "physics": return "Physics";
    case "quant-ph": return "Quantum Physics";
    default: return "Unknown Category";
  }
}

// const sendNewsLetter = async (articles) => {
//   const { data: users } = await supabase
//     .from('users')
//     .select('*');

//   for (const user of users) {
//     let emailSent = false;

//     if (user?.subscribeNewsletter) {
//       const interests = JSON.parse(user?.user_interest);

//       for (const article of articles) {
//         if (emailSent) break;

//         const categoryReadable = await getFullCategoryName(article);

//         for (let i = 0; i < interests.length; i++) {
//           if (emailSent) break;

//           for (const interest of interests) {
//             if (interest === categoryReadable) {
//               console.log("Sending email to: ", user.email);
//               sendNewsLetter_emailFormat({ article, user })
//               emailSent = true;
//               break;
//             }
//           }
//         }
//       }
//     }
//   }

// }

// const sendNewsLetter_emailFormat = async ({ article, user }) => {
//   const { title, summary, published, author, id, doi } = article;
//   const pdf_url = article.pdf_url || `https://arxiv.org/abs/${id[0].split("/").pop()}`;
//   const msg = {
//     to: user.email,
//     from: "TicTecToef24@gmail.com",
//     subject: "📢 New Research Paper Alert!",
//     text: `Exciting news! We've just published a new research paper titled: "${title[0]}" by ${author.map((auth) => auth.name).join(", ")}.
// Read the summary and access the full paper here: ${doi}`,
//     html: `<p>Exciting news! We've just published a new research paper titled:</p>
//          <h3>"${title[0]}"</h3>
//          <p>Summary of the paper: ${summary}</p>
//          <p><strong>Authors:</strong> ${author.map((auth) => auth.name).join(", ")}</p>
//          <p><strong>Published on:</strong> ${published[0]}</p>
//          <p>🔍 <a href="${pdf_url}" target="_blank">Read the full paper here</a></p>
//          <p>Best regards,<br/>The TicTecToef24 Team</p>`,
//   };

//   try {
//     setTimeout(async () => {
//       const response = await sgMail.send(msg);
//     }, 1000);      // console.log("Send mail response: ", response);
//     console.log("Newsletter email sent successfully");
//   } catch (error) {
//     console.error("Error sending newsletter email:", error);
//     throw new Error("Failed to send newsletter email");
//   }

//   // }

// }

// New weekly newsletter: send top 10 most popular papers to all subscribed users
cron.schedule("0 9 * * 0", async () => {
  console.log("Sending weekly top 10 popular papers newsletter...");
  await sendWeeklyPopularPapersNewsletter();
});

const sendWeeklyPopularPapersNewsletter = async () => {
  try {
    // Get all users who have subscribed to the newsletter
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('subscribeNewsletter', true);

    // Get top 10 most popular papers (by click count) regardless of date (for testing)
    const { data: papers, error: papersError } = await supabase
      .from('paper')
      .select('*')
      .order('click_count', { ascending: false })
      .limit(10);

    // Send the top 10 papers to each subscribed user
    for (const user of users) {
      await sendPopularPapersNewsletterEmail({ user, papers });
    }
    console.log("Weekly popular papers newsletter sent to all subscribed users.");
  } catch (error) {
    console.error("Error in weekly popular papers newsletter:", error);
  }
};

const sendPopularPapersNewsletterEmail = async ({ user, papers }) => {
  // Format published date nicely
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to get author names as a string
  function getAuthorNames(authors) {
    if (!authors) return '';
    if (Array.isArray(authors)) return authors.join(', ');
    if (typeof authors === 'string') return authors;
    return String(authors);
  }

  // Plain text version
  const papersText = papers.map((paper, i) =>
    `${i+1}. "${paper.title}"
Summary: ${paper.summary ? paper.summary : ''}
Authors: ${getAuthorNames(paper.author_names)}
Published on: ${formatDate(paper.published_date || paper.created_at)}
Read the full paper: ${paper.pdf_url || '#'}
`
  ).join('\n');

  // HTML version
  const papersHtml = papers.map((paper, i) => `
    <div style="margin-bottom: 32px; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9f9f9; box-shadow: 0 2px 8px rgba(44,62,80,0.04);">
      <div style="font-size: 18px; color: #2980b9; font-weight: bold; margin-bottom: 8px;">${i+1}. ${paper.title}</div>
      <div style="margin-bottom: 10px; color: #34495e;"><strong>Summary:</strong> ${paper.summary ? paper.summary : ''}</div>
      <div style="margin-bottom: 6px; color: #7f8c8d;"><strong>Authors:</strong> ${getAuthorNames(paper.author_names)}</div>
      <div style="margin-bottom: 12px; color: #7f8c8d;"><strong>Published on:</strong> ${formatDate(paper.published_date || paper.created_at)}</div>
      <a href="${paper.pdf_url || '#'}" target="_blank" style="display: inline-block; background: #3498db; color: #fff; padding: 10px 22px; border-radius: 5px; text-decoration: none; font-weight: bold;">Read the full paper</a>
    </div>
  `).join('');

  const appButtonHtml = `
      <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
        <a href="http://localhost:8081/recommendations" target="_blank" style="display: inline-block; background: #2ecc71; color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);">
          Open App
        </a>
      </div>
    `;

  const msg = {
    to: user.email,
    from: "tictectoew26@gmail.com",
    subject: `Top 10 Most Popular Research Papers This Week!`,
    text: `Hello ${user.name || user.username},\n\nHere are the top 10 most popular research papers from this week:\n\n${papersText}\nBest regards,\nThe TicTecToef24 Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
        <h2 style="color: #2c3e50; text-align: center; margin-bottom: 8px;">Top 10 Most Popular Research Papers This Week</h2>
        <p style="color: #7f8c8d; text-align: center; margin-top: 0;">Hello ${user.name || user.username}!</p>
        <p style="color: #34495e; text-align: center;">Here are the <strong>top 10 most popular research papers</strong> from this week:</p>
        <div style="margin-top: 32px;">${papersHtml}</div>
        ${appButtonHtml}
        <div style="text-align: center; margin-top: 40px; padding: 20px; background-color: #ecf0f1; border-radius: 8px;">
          <p style="margin: 0; color: #7f8c8d;">Best regards,<br/>The TicTecToef24 Team</p>
        </div>
      </div>
    `,
  };

  try {
    setTimeout(async () => {
      await sgMail.send(msg);
      console.log(`Popular papers newsletter email sent to ${user.email}`);
    }, 1000);
  } catch (error) {
    console.error(`Error sending popular papers newsletter email to ${user.email}:`, error);
  }
};

//update the paper categories for existing papers (run this once to update existing papers)
const updateExistingPapersWithCategories = async () => {
  try {
    let page = 0;
    const pageSize = 50;

    while (true) {
      const { data: papers, error } = await supabase
        .from("paper")
        .select("paper_id, doi")
        .is("categories", null)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("Error fetching papers:", error);
        break;
      }

      if (!papers || papers.length === 0) {
        console.log("No more papers left to update.");
        break;
      }

      console.log(`Updating batch ${page + 1}: ${papers.length} papers`);

      for (const paper of papers) {
        try {
          const arxivId = paper.doi.replace('http://arxiv.org/abs/', '');
          const response = await axios.get(`http://export.arxiv.org/api/query?id_list=${arxivId}`);
          const jsonData = await xml2js.parseStringPromise(response.data);
          const entry = jsonData.feed.entry?.[0];

          if (entry && entry["arxiv:primary_category"]) {
            const category = entry["arxiv:primary_category"][0]["$"]["term"];
            await supabase
              .from("paper")
              .update({ categories: category })
              .eq("paper_id", paper.paper_id);

            console.log(`Updated ${paper.paper_id} with category ${category}`);
          } else {
            console.log(`No category found for ${arxivId}`);
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(` Error updating paper ${paper.paper_id}:`, err.message);
        }
      }

      page++;
    }
  } catch (error) {
    console.error(" Error in updateExistingPapersWithCategories:", error);
  }
};

// const testArticles = [
//   {
//     title: ["Test Paper"],
//     summary: ["This is a test summary."],
//     published: ["2025-02-11"],
//     author: [{ name: "John Doe" }],
//     id: ["http://arxiv.org/abs/2411.03665v1"],
//     "arxiv:primary_category": [{ $: { term: "cs.AI" } }],
//     pdf_url: [`https://arxiv.org/pdf/2411.03665v1.pdf`]
//   }
// ];

// (async () => {
//   console.log("🚀 Manually testing insertArticlesIntoSupabase...");
//   await insertArticlesIntoSupabase(testArticles);
// })();

/**
 * Fetches the TTS transcript (processed paper JSON) for a given DOI
 * Returns structured sections for displaying collapsible transcript
 * @param {String} doi - The DOI of the paper
 * @returns {Object} - Transcript sections with metadata
 */
const extractSectionTitlesFromLatex = (latexContent) => {
  if (!latexContent || typeof latexContent !== "string") return [];

  const titles = [];
  const seen = new Set();

  const addTitle = (rawTitle) => {
    if (!rawTitle) return;

    const cleanedTitle = rawTitle
      .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedTitle) return;

    const normalized = cleanedTitle.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      titles.push(cleanedTitle);
    }
  };

  // 1. Try true LaTeX section headings
  const latexPatterns = [
    /\\section\*?\{([^}]+)\}/g,
    /\\subsection\*?\{([^}]+)\}/g,
  ];

  for (const pattern of latexPatterns) {
    let match;
    while ((match = pattern.exec(latexContent)) !== null) {
      addTitle(match[1]);
    }
  }

  // 2. Fallback: detect plain-text headings from extracted PDF text
  if (titles.length === 0) {
    const lines = latexContent.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) continue;
      if (trimmed.length > 100) continue;
      if (/^\d+$/.test(trimmed)) continue;

      const numberedMatch = trimmed.match(
        /^(?:\d+\.?\s*)?(abstract|introduction|background|related work|literature review|methods?|methodology|approach|experiments?|experimental setup|results?|discussion|conclusion|conclusions|future work|references)$/i
      );

      if (numberedMatch) {
        addTitle(numberedMatch[1]);
      }
    }
  }

  return titles;
};
const isBadSectionTitle = (title) => {
  const normalized = String(title || "").trim().toLowerCase();

  if (!normalized) return true;

  const exactBadTitles = new Set([
    "argument",
    "startsection section",
    "ifstar ieeeappendixsavesection",
  ]);

  if (exactBadTitles.has(normalized)) return true;

  const badPatterns = [
    /appendixsave/i,
    /^ifstar/i,
    /^startsection/i,
    /^subsection/i,
    /^section$/i,
    /^my appendix title$/i,
  ];

  return badPatterns.some((pattern) => pattern.test(normalized));
};
const isGarbageTranscriptSection = (key, value) => {
  const rawTitle = String(value?.title || key || "").trim().toLowerCase();
  const summary = String(value?.summary || "").trim().toLowerCase();

  if (!summary) return true;

  // obvious junk title
  if (rawTitle === "startsection section") return true;

  // obvious LaTeX / style-file garbage
  const garbageMarkers = [
    "startsection",
    "secfont",
    "subsecfont",
    "subsubsecfont",
    "raggedright",
    "rightskip",
    "flushglue",
    "adddotafter",
    "proofindent",
    "acmplain",
    "acmdefinition",
    "sigconf",
    "siggraph",
    "sigplan",
    "sigchi",
    "acmtog",
    "pbalance",
  ];

  const garbageHits = garbageMarkers.filter((marker) => summary.includes(marker)).length;

  if (garbageHits >= 3) return true;

  return false;
};
const getTtsTranscript = async (req, res) => {
  const { doi } = req.params;

  if (!doi) {
    return res.status(400).json({ error: "DOI is required" });
  }

  try {
    const decodedDoi = decodeURIComponent(doi);

    const { data: paper, error } = await supabase
      .from("paper")
      .select("title, author_names, processed_papers_json, latex_content")
      .eq("doi", decodedDoi)
      .single();

    if (error || !paper) {
      console.error("Error fetching paper:", error);
      return res.status(404).json({ error: "Paper not found for this DOI" });
    }

    const latexSectionTitles = extractSectionTitlesFromLatex(paper.latex_content);
    console.log("latexSectionTitles:", latexSectionTitles);

    const getRealSectionTitle = (rawTitle, index) => {
  console.log("rawTitle:", rawTitle, "index:", index);

  if (!rawTitle) {
    return latexSectionTitles[index] || `Section ${index + 1}`;
  }

  const normalized = String(rawTitle).trim();

  if (!normalized) {
    return latexSectionTitles[index] || `Section ${index + 1}`;
  }

  if (normalized.toLowerCase() === "abstract") {
    return "Abstract";
  }

  

  const match = normalized.match(/^section[_-]?(\d+)$/i);
  if (match) {
    const latexIndex = parseInt(match[1], 10) - 1;
    return latexSectionTitles[latexIndex] || `Section ${match[1]}`;
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

    let sections = [];

    if (paper.processed_papers_json) {
      if (Array.isArray(paper.processed_papers_json)) {
       sections = paper.processed_papers_json
  .filter((section, index) => {
    const summaryText =
      typeof section?.summary === "string"
        ? section.summary
        : section?.summary?.summary || "";

    const resolvedTitle = getRealSectionTitle(section?.title, index);

    return summaryText.trim().length > 0 && !isBadSectionTitle(resolvedTitle);
  })
  .map((section, index) => ({
    id: section.order ?? index,
    order: section.order ?? index,
    title: getRealSectionTitle(section.title, index),
    summary:
      typeof section.summary === "string"
        ? section.summary
        : section?.summary?.summary || "",
    expanded: false,
  }));
      } else if (typeof paper.processed_papers_json === "object") {
  sections = Object.entries(paper.processed_papers_json)
  .filter(([key, value], index) => {
    const summaryText =
      typeof value?.summary === "string"
        ? value.summary
        : value?.summary?.summary || "";

    const resolvedTitle = getRealSectionTitle(value?.title || key, index);

    if (!summaryText.trim()) return false;
    if (isGarbageTranscriptSection(key, { ...value, summary: summaryText })) return false;
    if (isBadSectionTitle(resolvedTitle)) return false;

    return true;
  })
  .map(([key, value], index) => {
    const summaryText =
      typeof value?.summary === "string"
        ? value.summary
        : value?.summary?.summary || "";

    return {
      id: index,
      order: index,
      title: getRealSectionTitle(value.title || key, index),
      summary: summaryText,
      expanded: false,
    };
  });
    }
  }

    return res.status(200).json({
      doi: decodedDoi,
      title: paper.title,
      author: paper.author_names,
      totalSections: sections.length,
      sections,
      hasContent: sections.length > 0,
    });
  } catch (err) {
    console.error("Error fetching TTS transcript:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
  
};

module.exports = {
  updateLike,
  updateUnlike,
  updateComment,
  updateBookmark,
  importPapers,
  generateMissingEmbeddings,
  getPaperById,
  getAudioStatus,
  getPaperLikeCountFromId,
  getPaperBookmarkCountFromId,
  getPaperCommentCountFromId,
  getCommentsFromId,
  checkIfAlreadyLiked,
  checkIfAlreadyBookmarked,
  updateUnbookmark,
  searchPapers,
  fetchArxivArticles,
  insertArticlesIntoSupabase,
  handleDailyFetch,
  parseArxivResponse,
  convertPdfToLatex,
  fetchBookmarks,
  fetchComments,
  fetchLikes,
  fetchInterests,
  fetchCategories,
  fetchExploreRecommendations,
  fetchRecommendations,
  getAudioSegments,
  extractPlainTextFromPdf,
  streamAudioSegment,
  incrementPaperClick,
  generateProcessedPaperJsonForDoi,
  generateEmbeddingForUserInterest,
  generateEmbeddingWhileSignUp,
  fetchPapersByClickCount,
  fetchPapersByClickCountByLimit,
  updateExistingPapersWithCategories,
  executeCommand,
  sendWeeklyPopularPapersNewsletter,
  getTtsTranscript
}
//updateExistingPapersWithCategories();