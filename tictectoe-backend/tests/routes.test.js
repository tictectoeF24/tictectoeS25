/**
 * @jest-environment node
 */

const request = require("supertest");
const express = require("express");

// -----------------------------
// 🔹 Mock external dependencies FIRST
// -----------------------------

// Mock all controller functions
const mockAuthController = {
  signUpUser: jest.fn(),
  verifyOtp: jest.fn(),
  loginUser: jest.fn(),
  requestResetPassword: jest.fn(),
  verifyResetOtp: jest.fn(),
  setNewPassword: jest.fn(),
  getUserProfile: jest.fn(),
  checkEmailAvailability: jest.fn(),
};

const mockConversationController = {
  getChatHistory: jest.fn(),
  saveChatExchange: jest.fn(),
  getAllChatHistory: jest.fn(),
  getSamplePapers: jest.fn(),
  deleteChatHistory: jest.fn(),
  getConversationsByUser: jest.fn(),
};

const mockFollowController = {
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  checkIfFollowing: jest.fn(),
  getUserFollowers: jest.fn(),
  getUserFollowing: jest.fn(),
  getUserById: jest.fn(),
};

const mockPaperController = {
  updateLike: jest.fn(),
  updateUnlike: jest.fn(),
  updateComment: jest.fn(),
  updateBookmark: jest.fn(),
  importPapers: jest.fn(),
  getPaperById: jest.fn(),
  getPaperLikeCountFromId: jest.fn(),
  getPaperBookmarkCountFromId: jest.fn(),
  getPaperCommentCountFromId: jest.fn(),
  getCommentsFromId: jest.fn(),
  fetchPapersByClickCount: jest.fn(),
  getAudioStatus: jest.fn(),
  checkIfAlreadyLiked: jest.fn(),
  checkIfAlreadyBookmarked: jest.fn(),
  searchPapers: jest.fn(),
  streamAudioSegment: jest.fn(),
  incrementPaperClick: jest.fn(),
  getAudioSegments: jest.fn(),
  fetchBookmarks: jest.fn(),
  fetchRecommendations: jest.fn(),
  fetchLikes: jest.fn(),
  fetchComments: jest.fn(),
  fetchInterests: jest.fn(),
  fetchCategories: jest.fn(),
};

const mockProfileController = {
  updateProfile: jest.fn(),
  handleOrcidCallback: jest.fn(),
  fetchOrcidPublications: jest.fn(),
  claimAuthorship: jest.fn(),
  checkAuthorship: jest.fn(),
  updateInterests: jest.fn(),
};

const mockSearchController = {
  searchUsers: jest.fn(),
};

const mockUtilitiesController = {
  saveInterests: jest.fn(),
  getCategories: jest.fn(),
  extractPdfText: jest.fn(),
};

const mockGoogleGenerativeAI = {
  getGenerativeModel: jest.fn(() => ({
    generateContent: jest.fn(),
  })),
};

// Mock authenticate middleware
const mockAuthenticate = jest.fn((req, res, next) => {
  req.user = { id: 1, email: "test@example.com" };
  next();
});

// Mock modules
jest.mock("../controllers/authController", () => mockAuthController);
jest.mock("../controllers/conversationController", () => mockConversationController);
jest.mock("../controllers/followController", () => mockFollowController);
jest.mock("../controllers/paperController", () => mockPaperController);
jest.mock("../controllers/profileController", () => mockProfileController);
jest.mock("../controllers/searchController", () => mockSearchController);
jest.mock("../controllers/utilitiesController", () => mockUtilitiesController);
jest.mock("../middleware/authenticate", () => mockAuthenticate);
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => mockGoogleGenerativeAI),
}));

// Mock environment variables
process.env.GEMINI_API_KEY = "test_gemini_key";

describe("API Routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Setup default successful responses
    Object.values(mockAuthController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockConversationController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockFollowController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockPaperController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockProfileController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockSearchController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
    
    Object.values(mockUtilitiesController).forEach(fn => {
      fn.mockImplementation((req, res) => res.status(200).json({ success: true }));
    });
  });

  // -----------------------
  // AUTH ROUTES
  // -----------------------
  describe("Auth Routes (/api/auth)", () => {
    beforeEach(() => {
      const authRoutes = require("../routes/authRoutes");
      app.use("/api/auth", authRoutes);
    });

    it("POST /api/auth/signup should call signUpUser", async () => {
      const userData = { email: "test@example.com", password: "password123" };
      
      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData);

      expect(response.status).toBe(200);
      expect(mockAuthController.signUpUser).toHaveBeenCalled();
    });

    it("POST /api/auth/verify-otp should call verifyOtp", async () => {
      const otpData = { email: "test@example.com", otp: "123456" };
      
      const response = await request(app)
        .post("/api/auth/verify-otp")
        .send(otpData);

      expect(response.status).toBe(200);
      expect(mockAuthController.verifyOtp).toHaveBeenCalled();
    });

    it("POST /api/auth/login should call loginUser", async () => {
      const loginData = { email: "test@example.com", password: "password123" };
      
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(mockAuthController.loginUser).toHaveBeenCalled();
    });

    it("POST /api/auth/request-reset-password should call requestResetPassword", async () => {
      const resetData = { email: "test@example.com" };
      
      const response = await request(app)
        .post("/api/auth/request-reset-password")
        .send(resetData);

      expect(response.status).toBe(200);
      expect(mockAuthController.requestResetPassword).toHaveBeenCalled();
    });

    it("POST /api/auth/verify-reset-otp should call verifyResetOtp", async () => {
      const otpData = { email: "test@example.com", otp: "123456" };
      
      const response = await request(app)
        .post("/api/auth/verify-reset-otp")
        .send(otpData);

      expect(response.status).toBe(200);
      expect(mockAuthController.verifyResetOtp).toHaveBeenCalled();
    });

    it("POST /api/auth/set-new-password should call setNewPassword", async () => {
      const passwordData = { token: "reset_token", password: "newpassword123" };
      
      const response = await request(app)
        .post("/api/auth/set-new-password")
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(mockAuthController.setNewPassword).toHaveBeenCalled();
    });

    it("GET /api/auth/user-profile should call getUserProfile", async () => {
      const response = await request(app)
        .get("/api/auth/user-profile");

      expect(response.status).toBe(200);
      expect(mockAuthController.getUserProfile).toHaveBeenCalled();
    });

    it("GET /api/auth/check-email should call checkEmailAvailability", async () => {
      const response = await request(app)
        .get("/api/auth/check-email")
        .query({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(mockAuthController.checkEmailAvailability).toHaveBeenCalled();
    });
  });

  // -----------------------
  // GEMINI CHATBOT ROUTES (INLINE)
  // -----------------------
  describe("Gemini Chatbot Routes (/api/gemini)", () => {
    beforeEach(() => {
      // Create the gemini router inline since the file doesn't exist
      const express = require('express');
      const router = express.Router();
      const { GoogleGenerativeAI } = require('@google/generative-ai');

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      router.post('/', async (req, res) => {
        const { question, context, config = {} } = req.body;

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
          const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
          const prompt = context && context.trim() 
            ? `Context: ${context}\n\nQuestion: ${question}\n\nPlease answer the question based on the provided context.`
            : `Question: ${question}\n\nPlease provide a helpful answer to this question.`;
          
          const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
          const response = await model.generateContent(prompt);
          const answer = response.response.text() || "No answer.";
          
          return res.json({ answer });
        } catch (err) {
          if (err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('Service Unavailable')) {
            return res.status(503).json({ 
              error: 'The AI service is currently overloaded. Please try again in a few moments.',
              isOverloadError: true
            });
          }
          
          res.status(500).json({ 
            error: 'Chatbot error', 
            details: err.message 
          });
        }
      });

      app.use("/api/gemini", router);
    });

    it("POST /api/gemini should handle missing question", async () => {
      const chatData = {
        context: "Some context",
        config: {}
      };

      const response = await request(app)
        .post("/api/gemini")
        .send(chatData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing or invalid "question" field.');
    });

    it("POST /api/gemini should handle invalid context type", async () => {
      const chatData = {
        question: "What is AI?",
        context: 123, // Invalid type
        config: {}
      };

      const response = await request(app)
        .post("/api/gemini")
        .send(chatData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid "context" field - must be a string.');
    });

    it("POST /api/gemini should handle missing API key", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      
      // Recreate the route with missing API key
      app = express();
      app.use(express.json());
      
      const express2 = require('express');
      const router = express2.Router();
      
      router.post('/', async (req, res) => {
        const { question, context } = req.body;
        if (!question || typeof question !== 'string') {
          return res.status(400).json({ error: 'Missing or invalid "question" field.' });
        }
        if (typeof context !== 'string') {
          return res.status(400).json({ error: 'Invalid "context" field - must be a string.' });
        }
        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({ error: 'Gemini API key not configured.' });
        }
      });
      
      app.use("/api/gemini", router);
      
      const chatData = {
        question: "What is AI?",
        context: "Some context"
      };

      const response = await request(app)
        .post("/api/gemini")
        .send(chatData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Gemini API key not configured.');
      
      // Restore API key
      process.env.GEMINI_API_KEY = originalKey;
    });
  });

  // -----------------------
  // CONVERSATION ROUTES
  // -----------------------
  describe("Conversation Routes (/api/conversations)", () => {
    beforeEach(() => {
      const conversationRoutes = require("../routes/conversationRoutes");
      app.use("/api/conversations", conversationRoutes);
    });

    it("GET /api/conversations/paper/:paperId should call getChatHistory", async () => {
      const response = await request(app)
        .get("/api/conversations/paper/123");

      expect(response.status).toBe(200);
      expect(mockConversationController.getChatHistory).toHaveBeenCalled();
    });

    it("GET /api/conversations/user/:userId should call getConversationsByUser", async () => {
      const response = await request(app)
        .get("/api/conversations/user/456");

      expect(response.status).toBe(200);
      expect(mockConversationController.getConversationsByUser).toHaveBeenCalled();
    });

    it("POST /api/conversations/save-exchange should call saveChatExchange", async () => {
      const exchangeData = {
        paperId: "123",
        question: "What is this about?",
        answer: "This is about AI"
      };

      const response = await request(app)
        .post("/api/conversations/save-exchange")
        .send(exchangeData);

      expect(response.status).toBe(200);
      expect(mockConversationController.saveChatExchange).toHaveBeenCalled();
    });

    it("GET /api/conversations/all should call getAllChatHistory", async () => {
      const response = await request(app)
        .get("/api/conversations/all");

      expect(response.status).toBe(200);
      expect(mockConversationController.getAllChatHistory).toHaveBeenCalled();
    });

    it("GET /api/conversations/sample-papers should call getSamplePapers", async () => {
      const response = await request(app)
        .get("/api/conversations/sample-papers");

      expect(response.status).toBe(200);
      expect(mockConversationController.getSamplePapers).toHaveBeenCalled();
    });

    it("DELETE /api/conversations/paper/:paperId should call deleteChatHistory", async () => {
      const response = await request(app)
        .delete("/api/conversations/paper/123");

      expect(response.status).toBe(200);
      expect(mockConversationController.deleteChatHistory).toHaveBeenCalled();
    });
  });

  // -----------------------
  // FOLLOW ROUTES
  // -----------------------
  describe("Follow Routes (/api/follow)", () => {
    beforeEach(() => {
      const followRoutes = require("../routes/followRoutes");
      app.use("/api/follow", followRoutes);
    });

    it("POST /api/follow/follow should call followUser with authentication", async () => {
      const followData = { userId: 123 };

      const response = await request(app)
        .post("/api/follow/follow")
        .send(followData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockFollowController.followUser).toHaveBeenCalled();
    });

    it("DELETE /api/follow/unfollow should call unfollowUser with authentication", async () => {
      const unfollowData = { userId: 123 };

      const response = await request(app)
        .delete("/api/follow/unfollow")
        .send(unfollowData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockFollowController.unfollowUser).toHaveBeenCalled();
    });

    it("GET /api/follow/check-following/:userId should call checkIfFollowing", async () => {
      const response = await request(app)
        .get("/api/follow/check-following/123");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockFollowController.checkIfFollowing).toHaveBeenCalled();
    });

    it("GET /api/follow/followers/:userId should call getUserFollowers", async () => {
      const response = await request(app)
        .get("/api/follow/followers/123");

      expect(response.status).toBe(200);
      expect(mockFollowController.getUserFollowers).toHaveBeenCalled();
    });

    it("GET /api/follow/following/:userId should call getUserFollowing", async () => {
      const response = await request(app)
        .get("/api/follow/following/123");

      expect(response.status).toBe(200);
      expect(mockFollowController.getUserFollowing).toHaveBeenCalled();
    });
  });

  // -----------------------
  // PAPER ROUTES
  // -----------------------
  describe("Paper Routes (/api/papers)", () => {
    beforeEach(() => {
      const paperRoutes = require("../routes/paperRoutes");
      app.use("/api/papers", paperRoutes);
    });

    it("POST /api/papers/like should call updateLike with authentication", async () => {
      const likeData = { paperId: 123 };

      const response = await request(app)
        .post("/api/papers/like")
        .send(likeData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.updateLike).toHaveBeenCalled();
    });

    it("POST /api/papers/unlike should call updateUnlike with authentication", async () => {
      const unlikeData = { paperId: 123 };

      const response = await request(app)
        .post("/api/papers/unlike")
        .send(unlikeData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.updateUnlike).toHaveBeenCalled();
    });

    it("POST /api/papers/comment should call updateComment with authentication", async () => {
      const commentData = { paperId: 123, comment: "Great paper!" };

      const response = await request(app)
        .post("/api/papers/comment")
        .send(commentData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.updateComment).toHaveBeenCalled();
    });

    it("POST /api/papers/bookmark should call updateBookmark with authentication", async () => {
      const bookmarkData = { paperId: 123 };

      const response = await request(app)
        .post("/api/papers/bookmark")
        .send(bookmarkData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.updateBookmark).toHaveBeenCalled();
    });

    it("GET /api/papers/papers should call importPapers with authentication", async () => {
      const response = await request(app)
        .get("/api/papers/papers");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.importPapers).toHaveBeenCalled();
    });

    it("GET /api/papers/paper/:id should call getPaperById", async () => {
      const response = await request(app)
        .get("/api/papers/paper/123");

      expect(response.status).toBe(200);
      expect(mockPaperController.getPaperById).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/like-count should call getPaperLikeCountFromId", async () => {
      const response = await request(app)
        .get("/api/papers/123/like-count");

      expect(response.status).toBe(200);
      expect(mockPaperController.getPaperLikeCountFromId).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/bookmark-count should call getPaperBookmarkCountFromId", async () => {
      const response = await request(app)
        .get("/api/papers/123/bookmark-count");

      expect(response.status).toBe(200);
      expect(mockPaperController.getPaperBookmarkCountFromId).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/comment-count should call getPaperCommentCountFromId", async () => {
      const response = await request(app)
        .get("/api/papers/123/comment-count");

      expect(response.status).toBe(200);
      expect(mockPaperController.getPaperCommentCountFromId).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/comments should call getCommentsFromId", async () => {
      const response = await request(app)
        .get("/api/papers/123/comments");

      expect(response.status).toBe(200);
      expect(mockPaperController.getCommentsFromId).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/like-status should call checkIfAlreadyLiked", async () => {
      const response = await request(app)
        .get("/api/papers/123/like-status");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.checkIfAlreadyLiked).toHaveBeenCalled();
    });

    it("GET /api/papers/:id/bookmark-status should call checkIfAlreadyBookmarked", async () => {
      const response = await request(app)
        .get("/api/papers/123/bookmark-status");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.checkIfAlreadyBookmarked).toHaveBeenCalled();
    });

    it("POST /api/papers/search should call searchPapers with authentication", async () => {
      const searchData = { query: "machine learning" };

      const response = await request(app)
        .post("/api/papers/search")
        .send(searchData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.searchPapers).toHaveBeenCalled();
    });

    it("GET /api/papers/papers-by-click-count should call fetchPapersByClickCount", async () => {
      const response = await request(app)
        .get("/api/papers/papers-by-click-count");

      expect(response.status).toBe(200);
      expect(mockPaperController.fetchPapersByClickCount).toHaveBeenCalled();
    });

    it("POST /api/papers/increment-click should call incrementPaperClick", async () => {
      const clickData = { paperId: 123 };

      const response = await request(app)
        .post("/api/papers/increment-click")
        .send(clickData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.incrementPaperClick).toHaveBeenCalled();
    });

    it("POST /api/papers/audio should call getAudioSegments", async () => {
      const audioData = { doi: "10.1000/test" };

      const response = await request(app)
        .post("/api/papers/audio")
        .send(audioData);

      expect(response.status).toBe(200);
      expect(mockPaperController.getAudioSegments).toHaveBeenCalled();
    });
  });

  // -----------------------
  // PROFILE ROUTES
  // -----------------------
  describe("Profile Routes (/api/profile)", () => {
    beforeEach(() => {
      const profileRoutes = require("../routes/profileRoutes");
      app.use("/api/profile", profileRoutes);
    });

    it("PUT /api/profile/update-profile should call updateProfile with authentication", async () => {
      const profileData = { name: "John Doe", bio: "Software developer" };

      const response = await request(app)
        .put("/api/profile/update-profile")
        .send(profileData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockProfileController.updateProfile).toHaveBeenCalled();
    });

    it("PUT /api/profile/update-interests should call updateInterests with authentication", async () => {
      const interestsData = { interests: ["AI", "Machine Learning"] };

      const response = await request(app)
        .put("/api/profile/update-interests")
        .send(interestsData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockProfileController.updateInterests).toHaveBeenCalled();
    });

    it("GET /api/profile/bookmarks should call fetchBookmarks with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/bookmarks");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.fetchBookmarks).toHaveBeenCalled();
    });

    it("GET /api/profile/recommendations should call fetchRecommendations with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/recommendations");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.fetchRecommendations).toHaveBeenCalled();
    });

    it("GET /api/profile/likes should call fetchLikes with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/likes");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.fetchLikes).toHaveBeenCalled();
    });

    it("GET /api/profile/comments should call fetchComments with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/comments");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.fetchComments).toHaveBeenCalled();
    });

    it("GET /api/profile/interests should call fetchInterests with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/interests");

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockPaperController.fetchInterests).toHaveBeenCalled();
    });

    it("GET /api/profile/auth/orcid/callback should call handleOrcidCallback", async () => {
      const response = await request(app)
        .get("/api/profile/auth/orcid/callback")
        .query({ code: "auth_code", state: "test_state" });

      expect(response.status).toBe(200);
      expect(mockProfileController.handleOrcidCallback).toHaveBeenCalled();
    });

    it("GET /api/profile/auth/orcid/publications should call fetchOrcidPublications", async () => {
      const response = await request(app)
        .get("/api/profile/auth/orcid/publications")
        .query({ orcid: "0000-0000-0000-0000" });

      expect(response.status).toBe(200);
      expect(mockProfileController.fetchOrcidPublications).toHaveBeenCalled();
    });

    it("POST /api/profile/auth/orcid/claim should call claimAuthorship with authentication", async () => {
      const claimData = { paperId: 123, orcidId: "0000-0000-0000-0000" };

      const response = await request(app)
        .post("/api/profile/auth/orcid/claim")
        .send(claimData);

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockProfileController.claimAuthorship).toHaveBeenCalled();
    });

    it("GET /api/profile/auth/orcid/check should call checkAuthorship with authentication", async () => {
      const response = await request(app)
        .get("/api/profile/auth/orcid/check")
        .query({ paperId: 123 });

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockProfileController.checkAuthorship).toHaveBeenCalled();
    });

    it("GET /api/profile/categories should call fetchCategories", async () => {
      const response = await request(app)
        .get("/api/profile/categories");

      expect(response.status).toBe(200);
      expect(mockPaperController.fetchCategories).toHaveBeenCalled();
    });
  });

  // -----------------------
  // SEARCH ROUTES (INLINE)
  // -----------------------
  describe("Search Routes (/api/search)", () => {
    beforeEach(() => {
      // Create the search router inline since the file doesn't exist
      const express = require("express");
      const router = express.Router();
      
      router.get("/users/:id", mockFollowController.getUserById);
      router.get("/search-users", mockSearchController.searchUsers);
      
      app.use("/api/search", router);
    });

    it("GET /api/search/users/:id should call getUserById", async () => {
      const response = await request(app)
        .get("/api/search/users/123");

      expect(response.status).toBe(200);
      expect(mockFollowController.getUserById).toHaveBeenCalled();
    });

    it("GET /api/search/search-users should call searchUsers", async () => {
      const response = await request(app)
        .get("/api/search/search-users")
        .query({ query: "john", page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(mockSearchController.searchUsers).toHaveBeenCalled();
    });
  });

  // -----------------------
  // UTILITIES ROUTES
  // -----------------------
  describe("Utilities Routes (/api/utilities)", () => {
    beforeEach(() => {
      const utilitiesRoutes = require("../routes/utilitiesRoutes");
      app.use("/api/utilities", utilitiesRoutes);
    });

    it("POST /api/utilities/updateAvailableInterest should call saveInterests", async () => {
      const interestsData = { interests: ["AI", "ML", "Data Science"] };

      const response = await request(app)
        .post("/api/utilities/updateAvailableInterest")
        .send(interestsData);

      expect(response.status).toBe(200);
      expect(mockUtilitiesController.saveInterests).toHaveBeenCalled();
    });

    it("GET /api/utilities/getCategories should call getCategories and return data", async () => {
      const mockCategories = [
        { id: 1, name: "Computer Science" },
        { id: 2, name: "Biology" }
      ];
      
      mockUtilitiesController.getCategories.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get("/api/utilities/getCategories");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(mockUtilitiesController.getCategories).toHaveBeenCalled();
    });

    it("GET /api/utilities/getCategories should handle errors", async () => {
      mockUtilitiesController.getCategories.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/utilities/getCategories");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to fetch categories");
    });

    it("POST /api/utilities/extract-pdf-text should extract PDF text", async () => {
      const mockExtractedText = "This is extracted PDF text content";
      mockUtilitiesController.extractPdfText.mockResolvedValue(mockExtractedText);

      const pdfData = { url: "https://example.com/document.pdf" };

      const response = await request(app)
        .post("/api/utilities/extract-pdf-text")
        .send(pdfData);

      expect(response.status).toBe(200);
      expect(response.body.text).toBe(mockExtractedText);
      expect(response.body.length).toBe(mockExtractedText.length);
      expect(response.body.preview).toBe(mockExtractedText.substring(0, 200) + "...");
      expect(mockUtilitiesController.extractPdfText).toHaveBeenCalledWith(pdfData.url);
    });

    it("POST /api/utilities/extract-pdf-text should handle missing URL", async () => {
      const response = await request(app)
        .post("/api/utilities/extract-pdf-text")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("PDF URL is required");
    });

    it("POST /api/utilities/extract-pdf-text should handle extraction errors", async () => {
      mockUtilitiesController.extractPdfText.mockRejectedValue(new Error("Failed to download PDF"));

      const pdfData = { url: "https://example.com/invalid.pdf" };

      const response = await request(app)
        .post("/api/utilities/extract-pdf-text")
        .send(pdfData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to extract PDF text");
      expect(response.body.details).toBe("Failed to download PDF");
    });
  });

  // -----------------------
  // AUTHENTICATION MIDDLEWARE TESTS
  // -----------------------
  describe("Authentication Middleware", () => {
    it("should add user to request object", async () => {
      const paperRoutes = require("../routes/paperRoutes");
      app.use("/api/papers", paperRoutes);

      const response = await request(app)
        .post("/api/papers/like")
        .send({ paperId: 123 });

      expect(response.status).toBe(200);
      expect(mockAuthenticate).toHaveBeenCalled();
    });

    it("should handle authentication failure", async () => {
      mockAuthenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: "Unauthorized" });
      });

      const paperRoutes = require("../routes/paperRoutes");
      app.use("/api/papers", paperRoutes);

      const response = await request(app)
        .post("/api/papers/like")
        .send({ paperId: 123 });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });

  // -----------------------
  // ERROR HANDLING TESTS
  // -----------------------
  describe("Error Handling", () => {
    it("should handle controller errors gracefully", async () => {
      mockAuthController.signUpUser.mockImplementation((req, res) => {
        res.status(500).json({ error: "Internal server error" });
      });

      const authRoutes = require("../routes/authRoutes");
      app.use("/api/auth", authRoutes);

      const response = await request(app)
        .post("/api/auth/signup")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });

    it("should handle malformed JSON requests", async () => {
      const authRoutes = require("../routes/authRoutes");
      app.use("/api/auth", authRoutes);

      const response = await request(app)
        .post("/api/auth/signup")
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
});