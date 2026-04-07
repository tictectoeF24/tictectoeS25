// tests/conversationController.test.js
const { createClient } = require("@supabase/supabase-js");

// ---- Chainable Supabase mock setup ----
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

// Define base chainable behavior
const mockQuery = {};
mockEq.mockImplementation(() => mockQuery);
mockOrder.mockImplementation(() => mockQuery);
mockLimit.mockImplementation(() => mockQuery);
mockSingle.mockImplementation(() => Promise.resolve({ data: {}, error: null }));

mockSelect.mockImplementation(() => ({
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
  then: (resolve) => resolve({ data: [], error: null }), // allows await select()
}));
mockInsert.mockImplementation(() => mockQuery);
mockUpdate.mockImplementation(() => mockQuery);
mockDelete.mockImplementation(() => mockQuery);

Object.assign(mockQuery, {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
});

const mockFrom = jest.fn(() => mockQuery);
const mockSupabase = { from: mockFrom };

// ---- Mock Supabase createClient globally ----
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Import controller after mocking Supabase
const {
  getChatHistory,
  saveChatExchange,
  getAllChatHistory,
  getSamplePapers,
  getConversationsByUser,
  deleteChatHistory,
} = require("../controllers/conversationController");

// ---- Helper: mock req/res ----
const mockReqRes = (body = {}, params = {}, query = {}) => {
  const req = { body, params, query };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

// ---------------- TESTS ----------------
describe("conversationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset chain mocks each time
    mockEq.mockImplementation(() => mockQuery);
    mockOrder.mockImplementation(() => mockQuery);
    mockLimit.mockImplementation(() => mockQuery);
    mockSingle.mockImplementation(() => Promise.resolve({ data: {}, error: null }));

    mockSelect.mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      then: (resolve) => resolve({ data: [], error: null }),
    }));

    mockFrom.mockImplementation(() => mockQuery);
  });

  // ============ getChatHistory ============
  describe("getChatHistory", () => {
    it("should return chat history successfully", async () => {
      const { req, res } = mockReqRes({}, { paperId: "paper1" });
      
      // Mock the chain: select().eq().order()
      mockOrder.mockResolvedValueOnce({
        data: [{ chat_id: 1, question: "Q1", answer: "A1" }],
        error: null,
      });

      await getChatHistory(req, res);

      expect(mockFrom).toHaveBeenCalledWith("chat_history");
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("paper_id", "paper1");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
      expect(res.json).toHaveBeenCalledWith({
        chatHistory: [{ chat_id: 1, question: "Q1", answer: "A1" }],
      });
    });

    it("should handle Supabase error", async () => {
      const { req, res } = mockReqRes({}, { paperId: "paper1" });
      
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: new Error("DB error"),
      });

      await getChatHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to get chat history" })
      );
    });
  });

  // ============ saveChatExchange ============
  describe("saveChatExchange", () => {
    it("should save chat successfully", async () => {
      const { req, res } = mockReqRes({
        paperId: "paper1",
        question: "What is AI?",
        answer: "Artificial Intelligence",
        userId: "user123",
        username: "sahara",
      });

      // Mock the chain: insert().select().single()
      mockSingle.mockResolvedValueOnce({ 
        data: { chat_id: 1 }, 
        error: null 
      });

      await saveChatExchange(req, res);
      
      expect(mockFrom).toHaveBeenCalledWith("chat_history");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          paper_id: "paper1",
          question: "What is AI?",
          answer: "Artificial Intelligence",
          user_id: "user123",
          username: "sahara",
        })
      );
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        chatEntry: { chat_id: 1 } 
      });
    });

    it("should handle insert error", async () => {
      const { req, res } = mockReqRes({
        paperId: "p1",
        question: "Q",
        answer: "A",
        userId: "u1",
        username: "user",
      });

      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: new Error("Insert failed") 
      });

      await saveChatExchange(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to save chat exchange" })
      );
    });
  });

  // ============ getAllChatHistory ============
  describe("getAllChatHistory", () => {
    
    it("should handle error gracefully", async () => {
      const { req, res } = mockReqRes();
      
      mockOrder.mockResolvedValueOnce({ 
        data: null, 
        error: new Error("Fail") 
      });

      await getAllChatHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to get chat history" })
      );
    });
  });

  // ============ getSamplePapers ============
  describe("getSamplePapers", () => {
    it("should return sample papers", async () => {
      const { req, res } = mockReqRes();
      
      mockLimit.mockResolvedValueOnce({
        data: [{ paper_id: 1, title: "Sample Paper" }],
        error: null,
      });

      await getSamplePapers(req, res);
      
      expect(mockFrom).toHaveBeenCalled();
      expect(mockSelect).toHaveBeenCalledWith("paper_id, title");
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        papers: [{ paper_id: 1, title: "Sample Paper" }],
      });
    });

    it("should handle Supabase error", async () => {
      const { req, res } = mockReqRes();
      
      mockLimit.mockResolvedValueOnce({ 
        data: null, 
        error: new Error("DB fail") 
      });

      await getSamplePapers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to get sample papers" })
      );
    });
  });

  // ============ getConversationsByUser ============
  describe("getConversationsByUser", () => {

    it("should handle Supabase join error", async () => {
      const { req, res } = mockReqRes({}, { userId: "u1" });
      
      mockEq.mockResolvedValueOnce({ 
        data: null, 
        error: new Error("Join error") 
      });

      await getConversationsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to get conversations" })
      );
    });
  });

  // ============ deleteChatHistory ============
  describe("deleteChatHistory", () => {
    it("should delete successfully", async () => {
      const { req, res } = mockReqRes({}, { paperId: "p1" });
      
      mockEq.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      });

      await deleteChatHistory(req, res);
      
      expect(mockFrom).toHaveBeenCalledWith("chat_history");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("paper_id", "p1");
      expect(res.json).toHaveBeenCalledWith({
        message: "Chat history deleted successfully",
      });
    });

    it("should handle delete error", async () => {
      const { req, res } = mockReqRes({}, { paperId: "p1" });
      
      mockEq.mockResolvedValueOnce({ 
        data: null, 
        error: new Error("Delete fail") 
      });

      await deleteChatHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Failed to delete chat history" })
      );
    });
  });
});