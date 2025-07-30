require('dotenv').config();
console.log('Loaded GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const paperRoutes = require("./routes/paperRoutes");
const authenticate = require("./middleware/authenticate");
const utilitiesRoutes = require("./routes/utilitiesRoutes"); const userRoutes = require("./routes/userRoutes");
const followRoutes = require("./routes/followRoutes");
const chatbotRoutes = require("./routes/chatbot");
const conversationRoutes = require("./routes/conversationRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api", userRoutes);
app.use("/auth", authRoutes);
app.use("/utilities", utilitiesRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/conversations", conversationRoutes);


// Separate ORCID Authentication Route (Without Authentication)
app.use("/api/profile/auth/orcid/callback", require("./controllers/profileController").handleOrcidCallback);

// Additional API routes
app.use("/api/profile", profileRoutes);
app.use("/api/paper", paperRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

// Start the server
const PORT = process.env.PORT || 3001;
const IP = "xxx.xxx.xxx.xxx";
app.listen(PORT, () => {
  console.log(`Server running on http://${IP}:${PORT}`);
});