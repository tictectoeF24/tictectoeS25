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
const mockPdfParse = jest.fn();
const mockExec = jest.fn();
const mockXml2jsParseStringPromise = jest.fn();
const mockSgMailSend = jest.fn();
const mockCronSchedule = jest.fn();

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
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
    })),
  },
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

jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock("pdf-parse", () => mockPdfParse);

jest.mock("child_process", () => ({
  exec: mockExec,
}));

jest.mock("xml2js", () => ({
  parseStringPromise: mockXml2jsParseStringPromise,
}));

jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: mockSgMailSend,
}));

jest.mock("node-cron", () => ({
  schedule: mockCronSchedule,
}));

// Mock the transformers library properly to avoid dynamic import issues
jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn().mockImplementation(() => {
    // Return a mock pipeline function
    const mockPipeline = jest.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
    });
    
    // Add the __call__ method that some code might expect
    mockPipeline.__call__ = jest.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
    });
    
    return Promise.resolve(mockPipeline);
  }),
}));

jest.mock("os", () => ({
  tmpdir: jest.fn().mockReturnValue("/tmp"),
}));

jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  resolve: jest.fn((...args) => args.join("/")),
}));

// Import controller AFTER mocks
const {
  updateLike,
  updateUnlike,
  updateBookmark,
  updateUnbookmark,
  updateComment,
  importPapers,
  getPaperById,
  getAudioSegments,
  getAudioStatus,
  streamAudioSegment,
  searchPapers,
  fetchBookmarks,
  fetchLikes,
  fetchComments,
  fetchInterests,
  fetchCategories,
  incrementPaperClick,
  fetchPapersByClickCount,
  checkIfAlreadyLiked,
  checkIfAlreadyBookmarked,
  getCommentsFromId,
  getPaperLikeCountFromId,
  getPaperBookmarkCountFromId,
  getPaperCommentCountFromId,
  generateEmbeddingWhileSignUp,
  fetchRecommendations,
} = require("../controllers/paperController");

describe("Paper Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = { 
      body: {}, 
      params: {}, 
      user: { id: 1 },
      headers: {},
    };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
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
  // LIKE FUNCTIONALITY
  // -----------------------
  describe("updateLike", () => {
    it("should successfully add a like", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: [{ user_id: 1, paper_id: 1 }], error: null }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { like_count: 5 }, error: null }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await updateLike(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Like added",
        data: { user_id: 1, paper_id: 1 },
      });
    });

    it("should handle database error when adding like", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      });

      await updateLike(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error adding like to post",
        error: { message: "Database error" },
      });
    });
  });

  describe("updateUnlike", () => {
    it("should successfully remove a like", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { like_count: 5 }, error: null }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await updateUnlike(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Paper unliked",
        data: [],
      });
    });

    it("should handle database error when removing like", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
          }),
        }),
      });

      await updateUnlike(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error unliking paper",
        error: "Database error",
      });
    });
  });

  // -----------------------
  // BOOKMARK FUNCTIONALITY
  // -----------------------
  describe("updateBookmark", () => {
    it("should successfully add a bookmark", async () => {
      req.body = { paper_id: 1 };

      // First check if bookmark exists (should return no data)
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      // Insert bookmark
      mockSupabaseInstance.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: [{ user_id: 1, paper_id: 1 }], error: null }),
      });

      // Get current bookmark count
      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { bookmark_count: 3 }, error: null }),
          }),
        }),
      });

      // Update bookmark count
      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bookmark added",
        data: { user_id: 1, paper_id: 1 },
      });
    });

    it("should handle existing bookmark", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            }),
          }),
        }),
      });

      await updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bookmark already exists",
        data: { id: 1 },
      });
    });

    it("should handle database error when adding bookmark", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      });

      await updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error adding bookmarks to post",
        error: { message: "Database error" },
      });
    });
  });

  describe("updateUnbookmark", () => {
    it("should successfully remove a bookmark", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null, count: 1 }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { bookmark_count: 5 }, error: null }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await updateUnbookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Paper unbookmarked",
        data: [],
      });
    });

    it("should handle bookmark not found", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
          }),
        }),
      });

      await updateUnbookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Bookmark not found" });
    });
  });

  // -----------------------
  // COMMENT FUNCTIONALITY
  // -----------------------
  describe("updateComment", () => {
    it("should successfully add a comment", async () => {
      req.body = { paper_id: 1, content: "Great paper!" };

      mockSupabaseInstance.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: [{ user_id: 1, paper_id: 1, content: "Great paper!" }], error: null }),
      });

      await updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Comment added",
        data: { user_id: 1, paper_id: 1, content: "Great paper!" },
      });
    });

    it("should handle database error when adding comment", async () => {
      req.body = { paper_id: 1, content: "Great paper!" };

      mockSupabaseInstance.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      });

      await updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error adding comment to post",
        error: { message: "Database error" },
      });
    });
  });

  // -----------------------
  // PAPER RETRIEVAL
  // -----------------------
  describe("getPaperById", () => {
    it("should successfully fetch a paper by ID", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                paper_id: 1,
                title: "Test Paper",
                author_names: "John Doe",
                categories: "cs.AI",
              },
              error: null,
            }),
          }),
        }),
      });

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Paper fetched successfully",
        data: expect.objectContaining({
          paper_id: 1,
          title: "Test Paper",
          category_readable: "Artificial Intelligence",
        }),
      });
    });

    it("should handle paper not found", async () => {
      req.params = { id: "999" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      });

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // -----------------------
  // AUDIO FUNCTIONALITY
  // -----------------------
  describe("getAudioSegments", () => {
    it("should return existing audio segments", async () => {
      req.body = { doi: "10.1000/test" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                title: "Test Paper",
                author_names: "John Doe",
                audio_urls: ["url1.mp3", "url2.mp3"],
                processed_papers_json: { section1: { summary: "summary1" }, section2: { summary: "summary2" } },
              },
              error: null,
            }),
          }),
        }),
      });

      await getAudioSegments(req, res);

      expect(res.json).toHaveBeenCalledWith({
        title: "Test Paper",
        author: "John Doe",
        segments: ["url1.mp3", "url2.mp3"],
        status: "completed",
        progress: 2,
        total: 2,
      });
    });

    it("should handle missing DOI", async () => {
      req.body = {};

      await getAudioSegments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "DOI is required" });
    });

    it("should handle paper not found", async () => {
      req.body = { doi: "nonexistent" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      });

      await getAudioSegments(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Paper not found for this DOI" });
    });

    it("should handle generation needed scenario", async () => {
      req.body = { doi: "10.1000/test" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                title: "Test Paper",
                author_names: "John Doe",
                audio_urls: null,
                processed_papers_json: { section1: { summary: "summary1" } },
              },
              error: null,
            }),
          }),
        }),
      });

      await getAudioSegments(req, res);

      expect(res.json).toHaveBeenCalledWith({
        title: "Test Paper",
        author: "John Doe",
        segments: [],
        status: "generating",
        progress: 0,
        total: 1,
      });
    });
  });

  describe("getAudioStatus", () => {
    it("should return audio status", async () => {
      req.params = { doi: encodeURIComponent("10.1000/test") };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                title: "Test Paper",
                audio_urls: ["url1.mp3", "url2.mp3"],
                processed_papers_json: { section1: { summary: "summary1" }, section2: { summary: "summary2" } },
              },
              error: null,
            }),
          }),
        }),
      });

      await getAudioStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        title: "Test Paper",
        segments: ["url1.mp3", "url2.mp3"],
        status: "completed",
        progress: 2,
        total: 2,
      });
    });

    it("should handle paper not found for audio status", async () => {
      req.params = { doi: encodeURIComponent("nonexistent") };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      });

      await getAudioStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Paper not found" });
    });
  });

  describe("streamAudioSegment", () => {
    it("should handle missing audio URLs", async () => {
      req.params = { doi: "10.1000/test", segmentIndex: "0" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { audio_urls: null },
              error: null,
            }),
          }),
        }),
      });

      await streamAudioSegment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Audio segment not found" });
    });

    it("should handle invalid segment index", async () => {
      req.params = { doi: "10.1000/test", segmentIndex: "5" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { audio_urls: ["url1.mp3", "url2.mp3"] },
              error: null,
            }),
          }),
        }),
      });

      await streamAudioSegment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Audio segment 5 not found" });
    });
  });

  // -----------------------
  // SEARCH FUNCTIONALITY
  // -----------------------
  describe("searchPapers", () => {
    it("should search papers by title", async () => {
      req.body = { searchTerm: "machine learning" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({
            data: [
              {
                paper_id: 1,
                title: "Machine Learning Basics",
                author_names: "John Doe",
                categories: "cs.LG",
                like_count: 5,
                bookmark_count: 3,
              },
            ],
            error: null,
          }),
        }),
      });

      await searchPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Search results fetched successfully",
        resultsCount: 1,
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Machine Learning Basics",
            category_readable: "Machine Learning",
          }),
        ]),
      });
    });

    it("should handle no search criteria", async () => {
      req.body = {};

      await searchPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "At least one search criterion is required",
      });
    });

    it("should handle no results found", async () => {
      req.body = { searchTerm: "nonexistent" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      await searchPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "No results found",
        data: [],
      });
    });

    it("should search with date filters", async () => {
      req.body = { 
        searchTerm: "AI", 
        start_date: "2024-01-01", 
        end_date: "2024-12-31" 
      };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: [
                  {
                    paper_id: 1,
                    title: "AI Research",
                    categories: "cs.AI",
                    like_count: 0,
                    bookmark_count: 0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      await searchPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Search results fetched successfully",
        resultsCount: 1,
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "AI Research",
            category_readable: "Artificial Intelligence",
          }),
        ]),
      });
    });
  });

  // -----------------------
  // USER DATA FETCHING
  // -----------------------
  describe("fetchBookmarks", () => {
    it("should fetch user bookmarks", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                paper_id: 1,
                timestamp: "2024-01-01",
                paper: {
                  title: "Test Paper",
                  author_names: "John Doe",
                  categories: "cs.AI",
                },
              },
            ],
            error: null,
          }),
        }),
      });

      await fetchBookmarks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bookmarks fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Test Paper",
            category_readable: "Artificial Intelligence",
          }),
        ]),
      });
    });

    it("should handle missing user ID", async () => {
      req.user = null;

      await fetchBookmarks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    });

    it("should handle database error when fetching bookmarks", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      await fetchBookmarks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching bookmarks",
        error: { message: "Database error" },
      });
    });
  });

  describe("fetchLikes", () => {
    it("should fetch user likes", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                paper_id: 1,
                timestamp: "2024-01-01",
                paper: {
                  title: "Liked Paper",
                  author_names: "Jane Doe",
                  categories: "cs.LG",
                },
              },
            ],
            error: null,
          }),
        }),
      });

      await fetchLikes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Likes fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Liked Paper",
            category_readable: "Machine Learning",
          }),
        ]),
      });
    });

    it("should handle missing user ID for likes", async () => {
      req.user = null;

      await fetchLikes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Follower ID is required" });
    });
  });

  describe("fetchComments", () => {
    it("should fetch user comments grouped by paper", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  paper_id: 1,
                  content: "Great paper!",
                  timestamp: "2024-01-01",
                  paper: {
                    title: "Test Paper",
                    categories: "cs.AI",
                  },
                },
                {
                  paper_id: 1,
                  content: "Very insightful!",
                  timestamp: "2024-01-02",
                  paper: {
                    title: "Test Paper",
                    categories: "cs.AI",
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      await fetchComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Comments fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            paper_id: 1,
            title: "Test Paper",
            category_readable: "Artificial Intelligence",
            comments: expect.arrayContaining([
              expect.objectContaining({ content: "Great paper!" }),
              expect.objectContaining({ content: "Very insightful!" }),
            ]),
          }),
        ]),
      });
    });

    it("should handle missing user ID for comments", async () => {
      req.user = null;

      await fetchComments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });
    });
  });

  describe("fetchInterests", () => {
    it("should fetch user interests", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_interest: '["AI", "Machine Learning"]' },
              error: null,
            }),
          }),
        }),
      });

      await fetchInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Interests fetched successfully",
        interests: ["AI", "Machine Learning"],
      });
    });

    it("should handle insufficient interests", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_interest: '["AI"]' },
              error: null,
            }),
          }),
        }),
      });

      await fetchInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Less than two interests found, which is unexpected.",
      });
    });

    it("should handle missing user ID for interests", async () => {
      req.user = null;

      await fetchInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required user ID" });
    });

    it("should handle null interests", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_interest: null },
              error: null,
            }),
          }),
        }),
      });

      await fetchInterests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Less than two interests found, which is unexpected.",
      });
    });
  });

  describe("fetchCategories", () => {
    it("should fetch all categories", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              PrimaryCategory: "Computer Science",
              SubCategory: '["AI", "Machine Learning", "Computer Vision"]',
            },
            {
              PrimaryCategory: "Physics",
              SubCategory: '["Quantum Physics", "Astrophysics"]',
            },
          ],
          error: null,
        }),
      });

      await fetchCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Categories fetched successfully",
        categories: {
          "Computer Science": ["AI", "Machine Learning", "Computer Vision"],
          "Physics": ["Quantum Physics", "Astrophysics"],
        },
      });
    });

    it("should handle no categories found", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      await fetchCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No categories found" });
    });

    it("should handle database error when fetching categories", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      });

      await fetchCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching categories",
        error: { message: "Database error" },
      });
    });
  });

  // -----------------------
  // INTERACTION CHECKS
  // -----------------------
  describe("checkIfAlreadyLiked", () => {
    it("should return true if user has liked the paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { like_id: 1 },
                error: null,
              }),
            }),
          }),
        }),
      });

      await checkIfAlreadyLiked(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hasLiked: true });
    });

    it("should return false if user has not liked the paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116" }, // No rows returned
              }),
            }),
          }),
        }),
      });

      await checkIfAlreadyLiked(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hasLiked: false });
    });

    it("should handle missing required fields for like check", async () => {
      req.params = { id: "1" };
      req.user = null;
      req.body = {};

      await checkIfAlreadyLiked(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    });
  });

  describe("checkIfAlreadyBookmarked", () => {
    it("should return true if user has bookmarked the paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 1 },
                error: null,
              }),
            }),
          }),
        }),
      });

      await checkIfAlreadyBookmarked(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hasBookmarked: true });
    });

    it("should return false if user has not bookmarked the paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116" },
              }),
            }),
          }),
        }),
      });

      await checkIfAlreadyBookmarked(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hasBookmarked: false });
    });

    it("should handle missing required fields for bookmark check", async () => {
      req.params = { id: "1" };
      req.user = null;
      req.body = {};

      await checkIfAlreadyBookmarked(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    });
  });

  // -----------------------
  // CLICK TRACKING
  // -----------------------
  describe("incrementPaperClick", () => {
    it("should successfully increment click count", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { click_count: 5 },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseInstance.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await incrementPaperClick(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Click count updated successfully",
      });
    });

    it("should handle missing paper_id", async () => {
      req.body = {};

      await incrementPaperClick(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing `paper_id`" });
    });

    it("should handle failed click count fetch", async () => {
      req.body = { paper_id: 1 };

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

      await incrementPaperClick(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch click count" });
    });

    it("should handle failed click count update", async () => {
      req.body = { paper_id: 1 };

      mockSupabaseInstance.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { click_count: 5 },
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

      await incrementPaperClick(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to update click count" });
    });
  });

  // -----------------------
  // POPULAR PAPERS
  // -----------------------
  describe("fetchPapersByClickCount", () => {
    it("should fetch papers ordered by click count", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                paper_id: 1,
                title: "Popular Paper",
                categories: "cs.AI",
                like_count: 10,
                bookmark_count: 5,
              },
            ],
            error: null,
          }),
        }),
      });

      await fetchPapersByClickCount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Popular Paper",
            category_readable: "Artificial Intelligence",
          }),
        ]),
      });
    });

    it("should handle database error when fetching popular papers", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      await fetchPapersByClickCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch papers" });
    });
  });

  // -----------------------
  // RECOMMENDATIONS
  // -----------------------
  describe("fetchRecommendations", () => {
    it("should fetch recommended papers", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  paper_id: 1,
                  title: "Recommended Paper",
                  categories: "cs.LG",
                  click_count: 100,
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      await fetchRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Recommendations fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Recommended Paper",
            category_readable: "Machine Learning",
          }),
        ]),
      });
    });

    it("should handle missing user ID for recommendations", async () => {
      req.user = null;

      await fetchRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    });

    it("should handle database error when fetching recommendations", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      await fetchRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Unexpected error occurred" });
    });
  });

  // -----------------------
  // COUNT FUNCTIONS
  // -----------------------
  describe("getPaperLikeCountFromId", () => {
    it("should return like count for a paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      });

      await getPaperLikeCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });

    it("should handle database error when getting like count", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: { message: "Database error" } }),
        }),
      });

      await getPaperLikeCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error getting like count",
        error: "Database error",
      });
    });
  });

  describe("getPaperBookmarkCountFromId", () => {
    it("should return bookmark count for a paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      });

      await getPaperBookmarkCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
    });

    it("should handle database error when getting bookmark count", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: { message: "Database error" } }),
        }),
      });

      await getPaperBookmarkCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error getting bookmark count",
        error: "Database error",
      });
    });
  });

  describe("getPaperCommentCountFromId", () => {
    it("should return comment count for a paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 7, error: null }),
        }),
      });

      await getPaperCommentCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 7 });
    });

    it("should handle database error when getting comment count", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: { message: "Database error" } }),
        }),
      });

      await getPaperCommentCountFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error getting comment count",
        error: "Database error",
      });
    });
  });

  describe("getCommentsFromId", () => {
    it("should fetch comments for a paper", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  comment_id: 1,
                  content: "Great paper!",
                  timestamp: "2024-01-01",
                  users: { name: "John Doe", username: "johndoe" },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      await getCommentsFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        comments: expect.arrayContaining([
          expect.objectContaining({
            content: "Great paper!",
            userName: "John Doe",
            userHandle: "johndoe",
          }),
        ]),
      });
    });

    it("should handle database error when getting comments", async () => {
      req.params = { id: "1" };

      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      await getCommentsFromId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error getting comments",
        error: "Database error",
      });
    });
  });

  // -----------------------
  // IMPORT PAPERS
  // -----------------------
  describe("importPapers", () => {
    it("should handle missing user ID", async () => {
      req.user = null;

      await importPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Follower ID is required" });
    });

    it("should handle missing user embeddings", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { interest_embeddings: null },
              error: null,
            }),
          }),
        }),
      });

      await importPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Error fetching user data" });
    });

    it("should handle database error when fetching user data", async () => {
      mockSupabaseInstance.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      await importPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Error fetching user data" });
    });
  });
});