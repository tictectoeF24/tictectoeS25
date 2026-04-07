// Downloads arXiv's official source tarball and returns the main .tex (or null)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { executeCommand, extractPlainTextFromPdf } = require('../controllers/paperController');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fetchArxivSourceLatex(arxivId) {
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
}

// Ensures latex_content exists for the paper; saves the fetched text back to Supabase
async function ensureLatexContentForPaper(paper) {
  if (!paper) throw new Error("Missing paper object");
  const pdfUrl = paper.pdf_url;
  const arxivId = paper.doi?.replace(/^https?:\/\/arxiv.org\/abs\//, "");
  let latexContent = null;

  // try tarball
  if (arxivId) {
    latexContent = await fetchArxivSourceLatex(arxivId);
    console.log("tarball length:", latexContent?.length || 0);
  }

  // fallback to plain PDF text if missing/short latex
  if (!latexContent || latexContent.length < 10000) {
    if (!pdfUrl) throw new Error(`Missing pdf_url for DOI ${paper.doi}`);
    const pdfText = await extractPlainTextFromPdf(pdfUrl);
    latexContent = pdfText;
  }
    const sanitize = (text) =>
    // eslint-disable-next-line no-control-regex
    text ? text.replace(/\u0000/g, "").trim() : "";
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
}


(async () => {
  const doi = process.argv[2];
  if (!doi) throw new Error('Pass a DOI');
  const { data } = await supabase.from('paper').select('*').eq('doi', doi).single();
  const latex = await ensureLatexContentForPaper(data);
  console.log('Fetched LaTeX length:', latex?.length || 0);
})().catch(err => {
  console.error('Failed to ensure LaTeX:', err);
  process.exit(1);
});
