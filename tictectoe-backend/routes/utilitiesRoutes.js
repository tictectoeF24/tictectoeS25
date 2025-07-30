const express = require("express");
const router = express.Router();
const { saveInterests, getCategories, extractPdfText } = require("../controllers/utilitiesController");

router.post("/updateAvailableInterest", saveInterests);

router.get("/getCategories", async (req, res) => {
    try {
      const result = await getCategories();   // Fetch data
      res.json(result);                       // ✅ Send response to Postman
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

router.post("/extract-pdf-text", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "PDF URL is required" });
    }
    
    console.log("PDF extraction request for:", url);
    const text = await extractPdfText(url);
    
    res.json({ 
      text: text,
      length: text.length,
      preview: text.substring(0, 200) + "..."
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    res.status(500).json({ 
      error: "Failed to extract PDF text",
      details: error.message 
    });
  }
});
  


module.exports = router;
