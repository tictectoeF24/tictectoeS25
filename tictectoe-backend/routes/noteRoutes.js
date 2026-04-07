const express = require("express");
const router = express.Router();
const {
  getNoteHistory,
  saveNote,
  getAllNoteHistory,
  getSamplePapers,
  deleteNoteHistory,
  getNoteHistoryByUser,
  getNotesByPaperAndUser
} = require("../controllers/noteController");

// Get note history for a specific paper
router.get("/paper/:paperId", getNoteHistory);

// Get note threads by user ID
router.get("/user/:userId", getNoteHistoryByUser);

router.get("/paper/:paperId/user/:userId", getNotesByPaperAndUser);

// Save a complete chat exchange (question + answer)
router.post("/save-note", saveNote);

// Get all chat history (for admin or user overview)
router.get("/all", getAllNoteHistory);

// Get sample papers for testing
router.get("/sample-papers", getSamplePapers);

// Delete chat history for a paper
router.delete("/paper/:paperId", deleteNoteHistory);

module.exports = router;
