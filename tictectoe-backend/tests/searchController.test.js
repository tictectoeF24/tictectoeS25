/**
 * @jest-environment node
 */

require("dotenv").config();

// -----------------------------
// 🔹 Mock external dependencies FIRST
// -----------------------------

// Create mock functions
const mockCreateClient = jest.fn();

// Mock Supabase
const mockSupabaseInstance = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    count: jest.fn().mockResolvedValue({ count: 0, error: null }),
  })),
};

mockCreateClient.mockReturnValue(mockSupabaseInstance);

// Mock modules
jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

// Mock environment variables
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test_service_key";

// Import controller AFTER mocks
const { searchUsers } = require("../controllers/searchController"); // Adjust path as needed

describe("Search Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = { 
      query: {},
      params: {},
      body: {},
      user: { id: 1 },
      headers: {},
    };
    
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
      redirect: jest.fn(),
      setHeader: jest.fn(),
    };

    // Reset default mock implementations
    mockSupabaseInstance.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      count: jest.fn().mockResolvedValue({ count: 0, error: null }),
    });
  });

  describe("searchUsers", () => {
    it("should successfully search users by username", async () => {
      req.query = { query: "john", page: 1, limit: 10 };

      const mockUsers = [
        {
          id: 1,
          username: "johndoe",
          email: "john@example.com",
          name: "John Doe",
          bio: "Software developer",
        },
        {
          id: 2,
          username: "johnsmith",
          email: "smith@example.com",
          name: "John Smith",
          bio: "Data scientist",
        },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("users");
      expect(mockChain.select).toHaveBeenCalledWith("id, username, email, name, bio");
      expect(mockChain.or).toHaveBeenCalledWith("username.ilike.%john%, email.ilike.%john%");
      expect(mockChain.range).toHaveBeenCalledWith(0, 9);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    it("should successfully search users by email", async () => {
      req.query = { query: "example.com", page: 1, limit: 5 };

      const mockUsers = [
        {
          id: 1,
          username: "johndoe",
          email: "john@example.com",
          name: "John Doe",
          bio: "Software developer",
        },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockChain.or).toHaveBeenCalledWith("username.ilike.%example.com%, email.ilike.%example.com%");
      expect(mockChain.range).toHaveBeenCalledWith(0, 4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    it("should handle pagination correctly", async () => {
      req.query = { query: "test", page: 3, limit: 20 };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      // Page 3 with limit 20 should have offset 40 (3-1)*20 = 40
      expect(mockChain.range).toHaveBeenCalledWith(40, 59);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should use default limit when not provided", async () => {
      req.query = { query: "test", page: 1 };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockChain.range).toHaveBeenCalledWith(0, 9); // Default limit is 10
    });

    it("should handle missing search query", async () => {
      req.query = { page: 1, limit: 10 };

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Search query is required.",
      });
    });

    it("should handle empty search query", async () => {
      req.query = { query: "", page: 1, limit: 10 };

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Search query is required.",
      });
    });

    it("should handle database error", async () => {
      req.query = { query: "test", page: 1, limit: 10 };

      const mockError = { message: "Database connection failed", code: "DB001" };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database error",
        details: mockError,
      });
    });

    it("should handle empty search results", async () => {
      req.query = { query: "nonexistentuser", page: 1, limit: 10 };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: [],
        total: 0,
      });
    });

    it("should handle unexpected error", async () => {
      req.query = { query: "test", page: 1, limit: 10 };

      mockSupabaseInstance.from.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should handle special characters in search query", async () => {
      req.query = { query: "john@doe.com", page: 1, limit: 10 };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockChain.or).toHaveBeenCalledWith("username.ilike.%john@doe.com%, email.ilike.%john@doe.com%");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle very large page numbers", async () => {
      req.query = { query: "test", page: 1000, limit: 10 };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockChain.range).toHaveBeenCalledWith(9990, 9999); // (1000-1)*10 = 9990
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle string pagination parameters", async () => {
      req.query = { query: "test", page: "2", limit: "15" };

      const mockUsers = [];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      await searchUsers(req, res);

      expect(mockChain.range).toHaveBeenCalledWith(15, 1514);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});