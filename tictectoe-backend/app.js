require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const paperRoutes = require("./routes/paperRoutes");
const utilitiesRoutes = require("./routes/utilitiesRoutes");
const userRoutes = require("./routes/userRoutes");
const followRoutes = require("./routes/followRoutes");
const chatbotRoutes = require("./routes/chatbot");
const conversationRoutes = require("./routes/conversationRoutes");
const noteRoutes = require("./routes/noteRoutes");

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
app.use("/api/notes", noteRoutes);

// Separate ORCID Authentication Route (Without Authentication)
app.options("/api/profile/auth/orcid/callback", cors());
app.use(
  "/api/profile/auth/orcid/callback",
  require("./controllers/profileController").handleOrcidCallback
);

// Additional API routes
app.use("/api/profile", profileRoutes);
app.use("/api/paper", paperRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

//PDF Fetch (For viewing PDF's in EmbedPDF)
app.get("/api/arxiv-pdf/:id", async (req, res) => {
  const id = req.params.id;
  const arxivURL = `https://arxiv.org/pdf/${id}.pdf`;

  const response = await fetch(arxivURL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/pdf"
    }
  });

  if (!response.ok) {
    return res.status(response.status).send("Failed to fetch PDF from arxiv");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader("Content-Type", "application/pdf");
  res.send(buffer);
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
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

module.exports = app;
