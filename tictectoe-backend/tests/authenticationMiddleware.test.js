const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authenticate");

// Mock environment variable for JWT
process.env.JWT_SECRET = "testsecret";

describe("Authenticate Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get("/protected", authenticate, (req, res) => {
      res.status(200).json({ userId: req.user.id });
    });
  });

  test("should return 401 if Authorization header is missing", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No token provided");
  });

  test("should return 401 if Authorization header does not start with Bearer", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Token abc123");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No token provided");
  });

  test("should return 403 if token is invalid", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  test("should return 403 if token does not contain userId", async () => {
    const token = jwt.sign({ foo: "bar" }, process.env.JWT_SECRET);
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid token: No userId found");
  });

  test("should allow access if token is valid and contains userId", async () => {
    const token = jwt.sign({ userId: "12345" }, process.env.JWT_SECRET);
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("12345");
  });
});
