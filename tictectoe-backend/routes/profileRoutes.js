const express = require("express");
const router = express.Router();
const { updateProfile, handleOrcidCallback, fetchOrcidPublications, claimAuthorship, checkAuthorship, updateInterests } = require("../controllers/profileController");
const authenticate = require("../middleware/authenticate");
const { fetchBookmarks, fetchLikes, fetchComments, fetchInterests, fetchCategories } = require('../controllers/paperController');

router.put("/update-profile", authenticate, updateProfile);
router.put('/update-interests', authenticate, updateInterests);
router.get('/bookmarks', authenticate, fetchBookmarks);
router.get('/likes', authenticate, fetchLikes);
router.get('/comments', authenticate, fetchComments);
router.get('/interests', authenticate, fetchInterests);
// ORCID OAuth Callback Route
router.get("/auth/orcid/callback", handleOrcidCallback);

/// routes for fetching publication
router.get("/auth/orcid/publications", fetchOrcidPublications);
router.post("/auth/orcid/claim", authenticate, claimAuthorship);
router.get("/auth/orcid/check", authenticate, checkAuthorship);
router.get('/categories', fetchCategories);

module.exports = router;
