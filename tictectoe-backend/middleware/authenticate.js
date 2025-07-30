const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("🔹 Received Authorization Header:", authHeader); // Log the full header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or incorrectly formatted Authorization header");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.split(" ")[1];

  if (!token) {
    console.error("Token is missing after splitting Authorization header");
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT Payload:", decoded); // Debugging

    if (!decoded.userId) {
      console.error("Token does not contain a valid userId");
      return res.status(403).json({ message: "Invalid token: No userId found" });
    }

    req.user = { id: decoded.userId }; // Attach user ID to request
    console.log("🔹 User authenticated successfully:", req.user);
    
    next(); // Proceed to the next middleware

  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
