const express = require('express');
const router = express.Router();
const {
  getChatHistory,
  saveChatExchange,
  getAllChatHistory,
  getSamplePapers,
  deleteChatHistory,
  getConversationsByUser
} = require('../controllers/conversationController');

// Get chat history for a specific paper
router.get('/paper/:paperId', getChatHistory);

// Get conversations by user ID
router.get('/user/:userId', getConversationsByUser);

// Save a complete chat exchange (question + answer)
router.post('/save-exchange', saveChatExchange);

// Get all chat history (for admin or user overview)
router.get('/all', getAllChatHistory);

// Get sample papers for testing
router.get('/sample-papers', getSamplePapers);

// Delete chat history for a paper
router.delete('/paper/:paperId', deleteChatHistory);

module.exports = router;
