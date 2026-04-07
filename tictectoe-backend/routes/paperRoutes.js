const express = require("express");
const router = express.Router();
const {
  updateLike,
  updateUnlike,
  updateComment,
  updateBookmark,
  updateUnbookmark,
  importPapers,
  getPaperById,
  getPaperLikeCountFromId,
  getPaperBookmarkCountFromId,
  getPaperCommentCountFromId,
  getCommentsFromId,
  fetchPapersByClickCount,
  fetchPapersByClickCountByLimit,
  getTtsTranscript,
} = require('../controllers/paperController');
const paperController = require("../controllers/paperController");
const authenticate = require("../middleware/authenticate");

// Protect all routes that require user authentication
// Note: Specific routes should be defined before parameterized routes
router.post('/unbookmark', authenticate, (req, res, next) => {
  console.log('✅ /unbookmark route hit');
  updateUnbookmark(req, res, next);
});
router.post('/like', authenticate, updateLike);
router.post('/unlike', authenticate, updateUnlike);
router.post('/comment', authenticate, updateComment);
router.post('/bookmark', authenticate, updateBookmark);
router.get("/audio-status/:doi", paperController.getAudioStatus);
router.get("/tts-transcript/:doi", getTtsTranscript);
router.get('/papers', authenticate, importPapers);
router.get('/paper/:id', getPaperById);
router.get('/:id/like-count', getPaperLikeCountFromId);
router.get('/:id/bookmark-count', getPaperBookmarkCountFromId);
router.get('/:id/comment-count', getPaperCommentCountFromId);
router.get('/:id/comments', getCommentsFromId);

router.get("/:id/like-status", authenticate, paperController.checkIfAlreadyLiked);
router.get("/:id/bookmark-status", authenticate, paperController.checkIfAlreadyBookmarked);

router.post("/search", authenticate, paperController.searchPapers);
router.get("/streamAudioSegment/:doi/:segmentIndex", paperController.streamAudioSegment);
router.get("/papers-by-click-count", fetchPapersByClickCount);
router.get("/papers-by-click-count-limit", fetchPapersByClickCountByLimit);
router.post("/increment-click", authenticate, paperController.incrementPaperClick);
router.post("/audio", paperController.getAudioSegments);
router.post("/generate-missing-embeddings", paperController.generateMissingEmbeddings);

module.exports = router;