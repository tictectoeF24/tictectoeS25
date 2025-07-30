const express = require("express");
const router = express.Router();
const { searchUsers } = require("../controllers/searchController");
const { getUserById } = require("../controllers/followController");
router.get("/users/:id", getUserById);
router.get("/search-users", searchUsers);

module.exports = router;