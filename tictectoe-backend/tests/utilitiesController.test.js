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
const mockPdfParse = jest.fn();

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
}));

jest.mock("pdf-parse", () => mockPdfParse);

// Mock environment variables
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test_service_key";

// Import controller AFTER mocks
const { saveInterests, getCategories, extractPdfText } = require("../controllers/utilitiesController"); // Adjust path as needed

describe("Utilities Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  // SAVE INTERESTS
  // -----------------------
  describe("saveInterests", () => {
    it("should successfully save interests", async () => {
      const interests = ["AI", "Machine Learning", "Data Science"];

      const mockChain = {
        update: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await saveInterests(interests);

      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("utilities");
      expect(mockChain.update).toHaveBeenCalledWith({
        available_user_interests: interests,
      });
      expect(result).toBe(true);
    });

    it("should handle empty interests array", async () => {
      const interests = [];

      const mockChain = {
        update: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await saveInterests(interests);

      expect(mockChain.update).toHaveBeenCalledWith({
        available_user_interests: [],
      });
      expect(result).toBe(true);
    });

    it("should handle unexpected error", async () => {
      const interests = ["AI", "Machine Learning"];

      mockSupabaseInstance.from.mockImplementation(() => {
        throw new Error("Connection failed");
      });

      await expect(saveInterests(interests)).rejects.toThrow("Connection failed");
    });

    it("should handle null interests", async () => {
      const interests = null;

      const mockChain = {
        update: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await saveInterests(interests);

      expect(mockChain.update).toHaveBeenCalledWith({
        available_user_interests: null,
      });
      expect(result).toBe(true);
    });

    it("should handle very large interests array", async () => {
      const interests = new Array(1000).fill("Interest");

      const mockChain = {
        update: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await saveInterests(interests);

      expect(mockChain.update).toHaveBeenCalledWith({
        available_user_interests: interests,
      });
      expect(result).toBe(true);
    });
  });

  // -----------------------
  // GET CATEGORIES
  // -----------------------
  describe("getCategories", () => {
    it("should successfully fetch categories", async () => {
      const mockCategories = [
        { id: 1, name: "Computer Science", description: "CS category" },
        { id: 2, name: "Biology", description: "Bio category" },
        { id: 3, name: "Physics", description: "Physics category" },
      ];

      const mockChain = {
        select: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await getCategories();

      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("category");
      expect(mockChain.select).toHaveBeenCalledWith("*");
      expect(result).toEqual(mockCategories);
    });

    it("should handle empty categories", async () => {
      const mockCategories = [];

      const mockChain = {
        select: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await getCategories();

      expect(result).toEqual([]);
    });

    
    it("should handle unexpected error", async () => {
      mockSupabaseInstance.from.mockImplementation(() => {
        throw new Error("Connection failed");
      });

      await expect(getCategories()).rejects.toThrow("Connection failed");
    });

    it("should handle null data response", async () => {
      const mockChain = {
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabaseInstance.from.mockReturnValue(mockChain);

      const result = await getCategories();

      expect(result).toBeNull();
    });
  });

  // -----------------------
  // EXTRACT PDF TEXT
  // -----------------------
  describe("extractPdfText", () => {
    it("should successfully extract text from PDF", async () => {
      const pdfUrl = "https://example.com/document.pdf";
      const mockPdfBuffer = Buffer.from("mock pdf content");
      const mockExtractedText = "This is extracted text from PDF";

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockResolvedValue({
        text: mockExtractedText,
        numpages: 5,
        info: {},
      });

      const result = await extractPdfText(pdfUrl);

      expect(mockAxiosGet).toHaveBeenCalledWith(pdfUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer);
      expect(result).toBe(mockExtractedText);
    });

    it("should handle PDF download error", async () => {
      const pdfUrl = "https://example.com/nonexistent.pdf";

      mockAxiosGet.mockRejectedValue(new Error("404 Not Found"));

      await expect(extractPdfText(pdfUrl)).rejects.toThrow(
        "Failed to extract PDF text: 404 Not Found"
      );
    });

    it("should handle PDF parsing error", async () => {
      const pdfUrl = "https://example.com/corrupt.pdf";
      const mockPdfBuffer = Buffer.from("corrupt pdf content");

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockRejectedValue(new Error("Invalid PDF format"));

      await expect(extractPdfText(pdfUrl)).rejects.toThrow(
        "Failed to extract PDF text: Invalid PDF format"
      );
    });

    it("should handle timeout error", async () => {
      const pdfUrl = "https://example.com/large.pdf";

      mockAxiosGet.mockRejectedValue(new Error("timeout of 30000ms exceeded"));

      await expect(extractPdfText(pdfUrl)).rejects.toThrow(
        "Failed to extract PDF text: timeout of 30000ms exceeded"
      );
    });

    it("should handle empty PDF text", async () => {
      const pdfUrl = "https://example.com/empty.pdf";
      const mockPdfBuffer = Buffer.from("empty pdf");

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockResolvedValue({
        text: "",
        numpages: 1,
        info: {},
      });

      const result = await extractPdfText(pdfUrl);

      expect(result).toBe("");
    });

    it("should handle very large PDF text", async () => {
      const pdfUrl = "https://example.com/large.pdf";
      const mockPdfBuffer = Buffer.from("large pdf content");
      const mockLargeText = "a".repeat(1000000); // 1MB of text

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockResolvedValue({
        text: mockLargeText,
        numpages: 100,
        info: {},
      });

      const result = await extractPdfText(pdfUrl);

      expect(result).toBe(mockLargeText);
      expect(result.length).toBe(1000000);
    });

    it("should handle invalid URL", async () => {
      const pdfUrl = "invalid-url";

      mockAxiosGet.mockRejectedValue(new Error("Invalid URL"));

      await expect(extractPdfText(pdfUrl)).rejects.toThrow(
        "Failed to extract PDF text: Invalid URL"
      );
    });

    it("should handle network error", async () => {
      const pdfUrl = "https://example.com/document.pdf";

      mockAxiosGet.mockRejectedValue(new Error("Network Error"));

      await expect(extractPdfText(pdfUrl)).rejects.toThrow(
        "Failed to extract PDF text: Network Error"
      );
    });

    it("should handle PDF with special characters", async () => {
      const pdfUrl = "https://example.com/special.pdf";
      const mockPdfBuffer = Buffer.from("special pdf content");
      const mockSpecialText = "Text with special chars: àáâãäåæçèé";

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockResolvedValue({
        text: mockSpecialText,
        numpages: 1,
        info: {},
      });

      const result = await extractPdfText(pdfUrl);

      expect(result).toBe(mockSpecialText);
    });

    it("should handle PDF with newlines and formatting", async () => {
      const pdfUrl = "https://example.com/formatted.pdf";
      const mockPdfBuffer = Buffer.from("formatted pdf content");
      const mockFormattedText = "Line 1\nLine 2\n\nParagraph 2\n\tTabbed content";

      mockAxiosGet.mockResolvedValue({
        data: mockPdfBuffer,
      });

      mockPdfParse.mockResolvedValue({
        text: mockFormattedText,
        numpages: 2,
        info: {},
      });

      const result = await extractPdfText(pdfUrl);

      expect(result).toBe(mockFormattedText);
    });
  });
});