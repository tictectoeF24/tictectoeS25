/**
 * @jest-environment node
 */

require("dotenv").config();

// -----------------------------
// 🔹 Mock external dependencies FIRST
// -----------------------------

// Create mock functions
const mockCreateClient = jest.fn();
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

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

jest.mock("axios", () => ({
  get: mockAxiosGet,
  post: mockAxiosPost,
}));

// Mock environment variables
process.env.ORCID_CLIENT_ID = "test_client_id";
process.env.ORCID_CLIENT_SECRET = "test_client_secret";
process.env.ORCID_REDIRECT_URI = "http://localhost:3000/callback";

// Import controller AFTER mocks
const {
  updateProfile,
  updateInterests,
  handleOrcidCallback,
  fetchOrcidPublications,
  claimAuthorship,
  checkAuthorship,
} = require("../controllers/profileController"); 

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = { 
      body: {}, 
      params: {}, 
      query: {},
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

  // -----------------------
  // PROFILE MANAGEMENT
  // -----------------------
  describe("updateProfile", () => {
    it("should successfully update user profile", async () => {
      req.body = {
        username: "johndoe",
        name: "John Doe",
        email: "john@example.com",
        bio: "Software developer",
      };

      // Mock successful update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock successful fetch
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                username: "johndoe",
                name: "John Doe",
                email: "john@example.com",
                bio: "Software developer",
              },
              error: null,
            }),
          }),
        }),
      });

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile updated successfully",
        data: {
          username: "johndoe",
          name: "John Doe",
          email: "john@example.com",
          bio: "Software developer",
        },
      });
    });

    it("should handle missing user ID", async () => {
      req.user = null;

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "userId is required" });
    });

    it("should handle update error", async () => {
      req.body = { username: "johndoe" };

      mockSupabaseInstance.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      });

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error updating profile",
        error: { message: "Update failed" },
      });
    });

    it("should handle fetch error after update", async () => {
      req.body = { username: "johndoe" };

      // Mock successful update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock failed fetch
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Fetch failed" },
            }),
          }),
        }),
      });

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching updated profile",
        error: { message: "Fetch failed" },
      });
    });

    it("should handle unexpected error", async () => {
      req.body = { username: "johndoe" };

      mockSupabaseInstance.from.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unexpected error updating profile",
        error: expect.any(Error),
      });
    });
  });

  // -----------------------
  // INTERESTS MANAGEMENT
  // -----------------------
  describe("updateInterests", () => {

    it("should handle unauthorized user", async () => {
      req.user = null;

      await updateInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized: User ID not found",
      });
    });

    it("should handle insufficient interests", async () => {
      req.body = { interests: ["AI"] };

      await updateInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "At least two interests are required.",
      });
    });

    it("should handle missing interests", async () => {
      req.body = {};

      await updateInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "At least two interests are required.",
      });
    });

    it("should handle database update error", async () => {
      req.body = { interests: ["AI", "Machine Learning"] };

      mockSupabaseInstance.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      await updateInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to update interests",
        error: "Database error",
      });
    });

  });

  // -----------------------
  // ORCID AUTHENTICATION
  // -----------------------
  describe("handleOrcidCallback", () => {
    it("should successfully handle ORCID callback for existing user", async () => {
      req.query = { code: "test_auth_code" };

      // Mock ORCID token response
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          access_token: "test_access_token",
          refresh_token: "test_refresh_token",
          orcid: "0000-0000-0000-0001",
          name: "John Doe",
        },
      });

      // Mock finding existing user by ORCID
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: "John Doe", email: "john@example.com" },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await handleOrcidCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:8081/explore?userId=1"
      );
    });

    it("should handle missing authorization code", async () => {
      req.query = {};

      await handleOrcidCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authorization code is missing",
      });
    });

    it("should handle ORCID API error", async () => {
      req.query = { code: "test_auth_code" };

      mockAxiosPost.mockRejectedValueOnce({
        response: { data: { error: "invalid_grant" } },
      });

      await handleOrcidCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to authenticate with ORCID",
        details: { error: "invalid_grant" },
      });
    });

    it("should handle missing ORCID ID in response", async () => {
      req.query = { code: "test_auth_code" };

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          access_token: "test_access_token",
          refresh_token: "test_refresh_token",
          name: "John Doe",
        },
      });

      await handleOrcidCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to obtain ORCID ID from ORCID",
      });
    });

    it("should handle user not found by ORCID or name", async () => {
      req.query = { code: "test_auth_code" };

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          access_token: "test_access_token",
          refresh_token: "test_refresh_token",
          orcid: "0000-0000-0000-0001",
          name: "John Doe",
        },
      });

      // Mock no existing user by ORCID
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // Mock no existing user by name
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      await handleOrcidCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "No matching user found. Please ensure your name matches the ORCID record.",
      });
    });

    it("should match user by name when ORCID user not found", async () => {
      req.query = { code: "test_auth_code" };

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          access_token: "test_access_token",
          refresh_token: "test_refresh_token",
          orcid: "0000-0000-0000-0001",
          name: "John Doe",
        },
      });

      // Mock no existing user by ORCID
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // Mock finding user by name
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: "John Doe", email: "john@example.com" },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await handleOrcidCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:8081/explore?userId=1"
      );
    });

    it("should handle update error", async () => {
      req.query = { code: "test_auth_code" };

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          access_token: "test_access_token",
          refresh_token: "test_refresh_token",
          orcid: "0000-0000-0000-0001",
          name: "John Doe",
        },
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: "John Doe", email: "john@example.com" },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      });

      await handleOrcidCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to update user with ORCID info",
      });
    });
  });

  // -----------------------
  // ORCID PUBLICATIONS
  // -----------------------
  describe("fetchOrcidPublications", () => {
    it("should successfully fetch ORCID publications", async () => {
      req.query = { userId: 1 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID API response
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          group: [
            {
              "work-summary": [
                {
                  title: { title: { value: "Test Publication" } },
                },
              ],
            },
          ],
        },
      });

      await fetchOrcidPublications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Publications fetched successfully",
        publications: expect.any(Array),
      });
    });

    it("should handle missing user ID", async () => {
      req.query = {};

      await fetchOrcidPublications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing user ID" });
    });

    it("should handle user not found or missing ORCID", async () => {
      req.query = { userId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          }),
        }),
      });

      await fetchOrcidPublications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "User ORCID not found" });
    });

    it("should handle ORCID API error", async () => {
      req.query = { userId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      mockAxiosGet.mockRejectedValueOnce({
        response: { data: { error: "Unauthorized" } },
      });

      await fetchOrcidPublications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch ORCID publications",
      });
    });
  });

  // -----------------------
  // AUTHORSHIP CLAIMS
  // -----------------------
  describe("claimAuthorship", () => {
    it("should successfully claim authorship", async () => {
      req.body = { paperId: 1 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID publications
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          group: [
            {
              "work-summary": [
                {
                  title: { title: { value: "Test Paper Title" } },
                },
              ],
            },
          ],
        },
      });

      // Mock paper from database
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { title: "Test Paper Title", author_ids: [] },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful authorship update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authorship verified and assigned successfully.",
      });
    });

    it("should handle unauthorized user", async () => {
      req.user = null;
      req.body = { paperId: 1 };

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized: User ID missing",
      });
    });

    it("should handle missing paper ID", async () => {
      req.body = {};

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing paper ID" });
    });

    it("should handle user without ORCID details", async () => {
      req.body = { paperId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User ORCID details not found",
      });
    });

    it("should handle paper not found", async () => {
      req.body = { paperId: 999 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID publications
      mockAxiosGet.mockResolvedValueOnce({
        data: { group: [] },
      });

      // Mock paper not found
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Paper not found" },
            }),
          }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Paper not found in database",
      });
    });

    it("should handle authorship verification failure", async () => {
      req.body = { paperId: 1 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID publications (different title)
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          group: [
            {
              "work-summary": [
                {
                  title: { title: { value: "Different Paper Title" } },
                },
              ],
            },
          ],
        },
      });

      // Mock paper from database
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { title: "Test Paper Title", author_ids: [] },
              error: null,
            }),
          }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You are not listed as an author of this paper on ORCID.",
      });
    });

    it("should handle already claimed authorship", async () => {
      req.body = { paperId: 1 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID publications
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          group: [
            {
              "work-summary": [
                {
                  title: { title: { value: "Test Paper Title" } },
                },
              ],
            },
          ],
        },
      });

      // Mock paper with user already as author
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { title: "Test Paper Title", author_ids: [1] },
              error: null,
            }),
          }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "You have already claimed authorship",
      });
    });

    it("should handle database update error", async () => {
      req.body = { paperId: 1 };

      // Mock user with ORCID data
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                orcid: "0000-0000-0000-0001",
                orcid_access_token: "test_token",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock ORCID publications
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          group: [
            {
              "work-summary": [
                {
                  title: { title: { value: "Test Paper Title" } },
                },
              ],
            },
          ],
        },
      });

      // Mock paper from database
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { title: "Test Paper Title", author_ids: [] },
              error: null,
            }),
          }),
        }),
      });

      // Mock failed authorship update
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      });

      await claimAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to assign authorship",
      });
    });
  });

  // -----------------------
  // AUTHORSHIP CHECKS
  // -----------------------
  describe("checkAuthorship", () => {
    it("should return true for existing author", async () => {
      req.query = { paperId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { author_ids: [1, 2, 3] },
              error: null,
            }),
          }),
        }),
      });

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isAuthor: true });
    });

    it("should return false for non-author", async () => {
      req.query = { paperId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { author_ids: [2, 3, 4] },
              error: null,
            }),
          }),
        }),
      });

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isAuthor: false });
    });

    it("should handle missing user ID or paper ID", async () => {
      req.user = { id: null };
      req.query = {};

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing user ID or paper ID",
      });
    });

    it("should handle paper not found", async () => {
      req.query = { paperId: 999 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Paper not found" },
            }),
          }),
        }),
      });

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Paper not found" });
    });

    it("should handle null author_ids", async () => {
      req.query = { paperId: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { author_ids: null },
              error: null,
            }),
          }),
        }),
      });

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isAuthor: false });
    });

    it("should handle unexpected error", async () => {
      req.query = { paperId: 1 };

      mockSupabaseInstance.from.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await checkAuthorship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unexpected error occurred",
      });
    });
  });
});