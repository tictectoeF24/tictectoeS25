
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const pdf = require("pdf-parse");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const saveInterests = async (interests) => {
  try {
    const { error } = await supabase
      .from("utilities")
      .update({ available_user_interests: interests })

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error saving interests:", error);
    throw error;
  }
}

const getCategories = async () => {
  console.log("GET /utilities/getCategories hit");
  try {
    const { data, error } = await supabase
      .from("category")
      .select("*");  // Fetches all columns

    if (error) {
      throw error;
    }

    return data;  // Returns an array of category rows
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

const extractPdfText = async (pdfUrl) => {
  try {
    console.log("Extracting PDF text from:", pdfUrl);
    
    // Download the PDF
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });
    
    // Parse the PDF
    const data = await pdf(response.data);
    
    console.log("PDF text extracted successfully, length:", data.text.length);
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF text:", error.message);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
};

module.exports = {
  saveInterests, getCategories, extractPdfText
};
