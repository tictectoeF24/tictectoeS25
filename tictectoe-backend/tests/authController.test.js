/**
 * @jest-environment node
 */

// Clear module cache before each test to ensure fresh imports
beforeAll(() => {
  jest.resetModules();
});

require("dotenv").config();

// -----------------------------
// 🔹 Create trackable mock functions
// -----------------------------
const mockCreateClient = jest.fn();
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();
const mockSgMailSend = jest.fn();
const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();
const mockGenerateEmbedding = jest.fn();

// -----------------------------
// 🔹 Shared Supabase mock (reused across all tests)
// -----------------------------
const mockSupabaseInstance = {
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    }),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

// Set up the mock to return our instance and track calls
mockCreateClient.mockReturnValue(mockSupabaseInstance);

// -----------------------------
// Mock external dependencies BEFORE importing the controller
// -----------------------------
jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: mockSgMailSend,
}));

jest.mock("bcrypt", () => ({
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

jest.mock("jsonwebtoken", () => ({
  sign: mockJwtSign,
  verify: mockJwtVerify,
}));

jest.mock("../controllers/paperController", () => ({
  generateEmbeddingWhileSignUp: mockGenerateEmbedding,
}));

// Mock setInterval to prevent the cleanup function from running
jest.spyOn(global, "setInterval").mockImplementation(() => {});

// -----------------------------
// Import controller AFTER mocks
// -----------------------------
const {
  signUpUser,
  verifyOtp,
  loginUser,
  getUserProfile,
  requestResetPassword,
  verifyResetOtp,
  setNewPassword,
} = require("../controllers/authController");

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    // Clear only the call history, not the implementations
    mockSupabaseInstance.from.mockClear();
    mockJwtSign.mockClear();
    mockJwtVerify.mockClear();
    mockSgMailSend.mockClear();
    mockBcryptHash.mockClear();
    mockBcryptCompare.mockClear();
    mockGenerateEmbedding.mockClear();
    
    // Reset default mock return values
    mockJwtSign.mockReturnValue("mock-jwt-token");
    mockJwtVerify.mockReturnValue({ userId: 1 });
    mockSgMailSend.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue("hashed-password");
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateEmbedding.mockResolvedValue(true);
    
    req = { body: {}, headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  // -----------------------
  // SIGN UP
  // -----------------------
  it("should successfully sign up a user", async () => {
    req.body = {
      email: "test@dal.ca", // Use allowed domain
      password: "123456",
      username: "testuser",
      name: "Tester",
      userInterest: ["AI", "ML"], // Array with at least 2 items
      subscribeNewsletter: false,
    };

    // Mock the lookup for existing user (should return empty)
    mockSupabaseInstance.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [], // No existing user
            error: null,
          }),
        }),
      }),
    });

    // Mock the insert operation
    mockSupabaseInstance.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null,
        }),
      }),
    });

    await signUpUser(req, res);

    // ✅ Since createClient is called at module load, check that supabase operations were called
    expect(mockSupabaseInstance.from).toHaveBeenCalledWith("users");
    expect(mockGenerateEmbedding).toHaveBeenCalledWith(["AI", "ML"], 1);
    expect(mockSgMailSend).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Signup successful. OTP sent to your email.",
    });
  });

  it("should handle duplicate email error on signup", async () => {
    req.body = {
      email: "duplicate@dal.ca",
      password: "123456",
      username: "dupuser",
      name: "Dup",
      userInterest: ["ML", "AI"],
      subscribeNewsletter: true,
    };

    // Mock existing verified user
    mockSupabaseInstance.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 1, verified: true }], // Existing verified user
            error: null,
          }),
        }),
      }),
    });

    await signUpUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already in use." });
  });

  // -----------------------
  // VERIFY OTP
  // -----------------------
  it("should verify OTP and return token", async () => {
    req.body = { email: "user@dal.ca", otp: 123456 };

    mockSupabaseInstance.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, otp: 123456 },
              error: null,
            }),
          }),
        }),
      }),
    });

    mockSupabaseInstance.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await verifyOtp(req, res);

    expect(mockJwtSign).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // -----------------------
  // LOGIN
  // -----------------------
  it("should log in verified user", async () => {
    req.body = { email: "user@dal.ca", password: "password" };

    mockSupabaseInstance.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 1, password: "hashed", verified: true, email: "user@dal.ca" }],
            error: null,
          }),
        }),
      }),
    });

    await loginUser(req, res);

    expect(mockJwtSign).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should reject unverified user", async () => {
    req.body = { email: "user@dal.ca", password: "password" };

    // First call for user lookup
    mockSupabaseInstance.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 1, password: "hashed", verified: false, email: "user@dal.ca" }],
            error: null,
          }),
        }),
      }),
    });

    // Second call for updating OTP
    mockSupabaseInstance.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "User not verified", resent: true });
  });

  // -----------------------
  // PROFILE
  // -----------------------
  it("should fetch user profile", async () => {
    req.headers.authorization = "Bearer mock-jwt-token";

    mockSupabaseInstance.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              name: "Tester",
              email: "user@dal.ca",
              username: "tester",
              bio: "bio",
              id: 1,
            },
            error: null,
          }),
        }),
      }),
    });

    await getUserProfile(req, res);

    expect(mockJwtVerify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // -----------------------
  // PASSWORD RESET
  // -----------------------
  it("should send OTP for password reset", async () => {
    req.body = { email: "reset@dal.ca" };

    mockSupabaseInstance.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ email: "reset@dal.ca" }],
          error: null,
        }),
      }),
    });

    mockSupabaseInstance.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await requestResetPassword(req, res);

    expect(mockSgMailSend).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should verify reset OTP", async () => {
    req.body = { email: "reset@dal.ca", otp: 123456 };

    mockSupabaseInstance.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { otp: 123456 },
            error: null,
          }),
        }),
      }),
    });

    await verifyResetOtp(req, res);

    expect(mockSupabaseInstance.from).toHaveBeenCalledWith("users");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "OTP verified. You can reset your password now.",
    });
  });

  it("should set new password successfully", async () => {
    req.body = { email: "reset@dal.ca", newPassword: "newpass123" };

    mockSupabaseInstance.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await setNewPassword(req, res);

    expect(mockBcryptHash).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset successfully",
    });
  });

  // -----------------------
  // Additional test to verify createClient was called during module load
  // -----------------------
  it("should have initialized supabase client", () => {
    // This verifies that createClient was called when the module was loaded
    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockCreateClient).toHaveBeenCalledWith(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });
});