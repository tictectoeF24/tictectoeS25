import os
import requests
import fitz  # PyMuPDF for PDF text extraction
from flask import Flask, render_template, request, jsonify
from supabase import create_client
from transformers import pipeline, BartTokenizer

# Flask App
app = Flask(__name__)

# Supabase credentials
SUPABASE_URL = "https://tncpegymtqdgnfkwndca.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY3BlZ3ltdHFkZ25ma3duZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxODkxODEsImV4cCI6MjA0Mjc2NTE4MX0.0Ltp_VvJmRQWqFxf9UJHYDwrbiRDRt8aWoFgcY_PPJA"

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load AI summarization model and tokenizer
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")

def fetch_papers(paper_id=None):
    """
    Fetches either all research papers that do not have an AI-generated summary yet 
    or a single paper by its ID.
    """
    if paper_id:
        response = supabase.table("paper").select("paper_id", "pdf_url").eq("paper_id", paper_id).execute()
    else:
        response = supabase.table("paper").select("paper_id", "pdf_url").is_("ai_generated_summary", None).execute()
    
    return response.data if response.data else []

def download_pdf(pdf_url):
    """
    Downloads the PDF from the given URL and saves it temporarily.
    """
    # Ensure the URL is a valid string
    pdf_url = pdf_url.strip().strip("[]").replace('"', '').replace("'", "")

    response = requests.get(pdf_url)
    if response.status_code == 200:
        temp_pdf_path = "temp_paper.pdf"
        with open(temp_pdf_path, "wb") as f:
            f.write(response.content)
        return temp_pdf_path
    return None

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file.
    """
    doc = fitz.open(pdf_path)
    text = "\n".join([page.get_text("text") for page in doc])
    doc.close()
    return text

def split_text_into_chunks(text, max_tokens=512):
    """
    Splits text into manageable chunks based on token limit.
    """
    tokens = tokenizer.encode(text, add_special_tokens=False)
    chunked_tokens = [tokens[i:i + max_tokens] for i in range(0, len(tokens), max_tokens)]
    return [tokenizer.decode(chunk, skip_special_tokens=True) for chunk in chunked_tokens]

def summarize_text(text):
    """
    Summarizes a given text by splitting it into chunks if necessary.
    """
    text_chunks = split_text_into_chunks(text, max_tokens=512)
    summaries = []

    for i, chunk in enumerate(text_chunks):
        print(f"📄 Summarizing chunk {i+1}/{len(text_chunks)} (length: {len(chunk.split())} words)...", flush=True)
        if not chunk.strip():
            print(f"⚠️ Skipping empty chunk {i+1}", flush=True)
            continue
        try:
            summary = summarizer(chunk, max_length=150, min_length=40, do_sample=False)[0]['summary_text']
            summaries.append(summary)
        except Exception as e:
            print(f"⚠️ Error summarizing chunk {i+1}: {e}", flush=True)
            summaries.append("")

    return " ".join(summaries)

def update_paper_summary(paper_id, summary):
    """
    Updates the research paper record in Supabase with the AI-generated summary.
    """
    supabase.table("paper").update({"ai_generated_summary": summary}).eq("paper_id", paper_id).execute()

def summarize_papers(paper_id=None):
    """
    Summarizes either all pending papers or a single paper by ID.
    """
    papers = fetch_papers(paper_id)

    if not papers:
        print("✅ No papers found that require summarization.", flush=True)
        return "No papers found to summarize."

    results = []
    for paper in papers:
        print(f"📄 Processing Paper: {paper['paper_id']}", flush=True)

        pdf_path = download_pdf(paper["pdf_url"])
        if not pdf_path:
            print(f"❌ Failed to download PDF: {paper['pdf_url']}", flush=True)
            continue

        pdf_text = extract_text_from_pdf(pdf_path)
        if not pdf_text.strip():
            print(f"❌ No text extracted from PDF: {paper['paper_id']}", flush=True)
            continue

        summary = summarize_text(pdf_text)
        update_paper_summary(paper["paper_id"], summary)
        print(f"✅ Summary updated for Paper: {paper['paper_id']}", flush=True)

        os.remove(pdf_path)
        results.append({"paper_id": paper["paper_id"], "summary": summary})

    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/summarize_all', methods=['GET'])
def summarize_all():
    """
    Flask route to summarize all pending papers.
    """
    summaries = summarize_papers()
    return jsonify({"message": "Summarization complete", "summaries": summaries})

@app.route('/summarize_single', methods=['POST'])
def summarize_single():
    """
    Flask route to summarize a single paper based on its paper_id.
    """
    paper_id = request.form.get("paper_id")
    if not paper_id:
        return jsonify({"error": "Missing paper_id"}), 400

    summaries = summarize_papers(paper_id)
    return jsonify({"message": f"Summarization complete for paper {paper_id}", "summaries": summaries})

if __name__ == "__main__":
    app.run(debug=True)
