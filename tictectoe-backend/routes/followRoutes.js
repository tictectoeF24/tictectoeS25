const express = require("express");
const {
    followUser,
    unfollowUser,
    checkIfFollowing,
    getUserFollowers,
    getUserFollowing,
    // getFollowCounts,
} = require("../controllers/followController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// **Follow a user**
router.post("/follow", authenticate, followUser);

// **Unfollow a user**
router.delete("/unfollow", authenticate, unfollowUser);

// **Check if a user is following another user**
router.get("/check-following/:userId", authenticate, checkIfFollowing);

// **Get the list of followers for a user**
router.get("/followers/:userId", getUserFollowers);

// **Get the list of users a specific user is following**
router.get("/following/:userId", getUserFollowing);

// router.get("/follow-count/:userId", authenticate, getFollowCounts);

module.exports = router;