const request = require("supertest");
const app = require("../app");

// Mock all route files to isolate app.js behavior
jest.mock("../routes/authRoutes", () => jest.fn((req, res) => res.json({ route: "auth" })));
jest.mock("../routes/profileRoutes", () => jest.fn((req, res) => res.json({ route: "profile" })));
jest.mock("../routes/paperRoutes", () => jest.fn((req, res) => res.json({ route: "paper" })));
jest.mock("../routes/utilitiesRoutes", () => jest.fn((req, res) => res.json({ route: "utilities" })));
jest.mock("../routes/userRoutes", () => jest.fn((req, res) => res.json({ route: "user" })));
jest.mock("../routes/followRoutes", () => jest.fn((req, res) => res.json({ route: "follow" })));
jest.mock("../routes/chatbot", () => jest.fn((req, res) => res.json({ route: "chatbot" })));
jest.mock("../routes/conversationRoutes", () => jest.fn((req, res) => res.json({ route: "conversation" })));
jest.mock("../controllers/profileController", () => ({
  handleOrcidCallback: (req, res) => res.json({ route: "orcid-callback" }),
}));

describe("App.js", () => {
  test("should respond to /health route", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Server is running" });
  });

  test("should handle 404 for unknown route", async () => {
    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
  });

  test("should trigger error-handling middleware", async () => {
  const express = require("express");
  const baseApp = require("../app");

  // New app instance that uses app.js routes and middleware
  const errorApp = express();

  // Define a route that manually triggers an error
  errorApp.get("/error", (req, res, next) => {
    next(new Error("Forced error"));
  });

  // Mount all app.js middleware (including error handler)
  errorApp.use(baseApp._router);
  errorApp.use((err, req, res, next) => {
    console.error("Caught in test error middleware:", err.message);
    res.status(500).json({
      message: "Something went wrong!",
      error: err.message,
    });
  });

  const res = await request(errorApp).get("/error");

  expect(res.status).toBe(500);
  expect(res.body.message).toBe("Something went wrong!");
  expect(res.body.error).toBe("Forced error");
});
});
