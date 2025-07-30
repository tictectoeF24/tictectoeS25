const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate payload and log requests
router.post('/', async (req, res) => {
  const { question, context, model = "gemini-2.5-flash", config = {} } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "question" field.' });
  }
  if (typeof context !== 'string') {
    return res.status(400).json({ error: 'Invalid "context" field - must be a string.' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured.' });
  }
  try {
    console.log(`[Gemini Chatbot] Question: ${question}`);
    console.log(`[Gemini Chatbot] Context: ${context ? context.substring(0, 100) + '...' : 'No context provided'}`);
    
    const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Create appropriate prompt based on whether context is available
    const prompt = context && context.trim() 
      ? `Context: ${context}\n\nQuestion: ${question}\n\nPlease answer the question based on the provided context.`
      : `Question: ${question}\n\nPlease provide a helpful answer to this question.`;
    
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Retry logic for handling overloaded model
    let retryCount = 0;
    const maxRetries = 2;
    const retryDelay = 1500; // 1.5 seconds
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[Gemini Chatbot] Attempt ${retryCount + 1}/${maxRetries + 1}`);
        const response = await model.generateContent(prompt);
        
        // Extract the answer from the response
        const answer = response.response.text() || "No answer.";
        
        console.log(`[Gemini Chatbot] Success on attempt ${retryCount + 1}`);
        return res.json({ answer });
        
      } catch (geminiError) {
        retryCount++;
        
        // Check if it's a 503 overloaded error
        const is503Error = geminiError.message?.includes('503') || 
                           geminiError.message?.includes('overloaded') ||
                           geminiError.message?.includes('Service Unavailable');
        
        console.log(`[Gemini Chatbot] Attempt ${retryCount} failed:`, geminiError.message);
        
        if (is503Error && retryCount <= maxRetries) {
          console.log(`[Gemini Chatbot] Model overloaded, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // If not a 503 error or max retries reached, throw the error
        throw geminiError;
      }
    }
    
  } catch (err) {
    console.error('[Gemini Chatbot] Error:', err.message);
    
    // Check if it's specifically a 503 overload error
    if (err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('Service Unavailable')) {
      return res.status(503).json({ 
        error: 'The AI service is currently overloaded. Please try again in a few moments.',
        isOverloadError: true
      });
    }
    
    // Handle other types of errors
    let errorMessage = 'Chatbot error';
    if (err.message?.includes('API key')) {
      errorMessage = 'API configuration error';
    } else if (err.message?.includes('quota')) {
      errorMessage = 'API quota exceeded';
    } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
      errorMessage = 'Network connection error';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: err.message 
    });
  }
});

module.exports = router;