
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const sgMail = require("@sendgrid/mail");
const { generateEmbeddingForUserInterest, generateEmbeddingWhileSignUp } = require("./paperController");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const SECRET_KEY = process.env.JWT_SECRET;

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const sendOtpEmail = async (recipientEmail, otp) => {
  const msg = {
    to: recipientEmail,
    from: "TicTecToef24@gmail.com",
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It is valid for the next 5 minutes.`,
    html: `<p>Your OTP code is: <strong>${otp}</strong>. It is valid for the next 5 minutes.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("OTP email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

const signUpUser = async (req, res) => {
  const { email, password, username, name, userInterest, subscribeNewsletter } = req.body;

  if (!email || !password || !username || !name || !userInterest) {
    console.log("All fields are required for signin up");
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await hashPassword(password);

    const { data, error } = await supabase.from("users").insert([
      {
        email,
        password: hashedPassword,
        username,
        name,
        user_interest: userInterest,
        otp: otp,
        verified: false,
        subscribeNewsletter,
        created_at: new Date(),
      },
    ]).select("*");

    if (error) {
      if (error.code === '23505') {
        console.log(error)
        console.log("Status: 1")
        return res.status(400).json({ error: error.details });
      } else {
        console.log("Status: 2")
        return res.status(500).json({ error: error });
      }
    }
    const userId = data[0]?.id;
    if (userId) {
      const response = await generateEmbeddingWhileSignUp(userInterest, userId);
      if (!response) {
        console.log("Failed to generate embeddings for user interest", response);
        console.log("Status: 3")
        return res.status(400).json({ error: "Failed to generate embeddings for user interest" });
      }
      console.log("Response is valid in signupUser");
      const responseFromOtp = await sendOtpEmail(email, otp);
      console.log("responseFromOtp", responseFromOtp);
      console.log("Status: 4")
      return res.status(200).json({ message: "Signup successful. OTP sent to your email." });

    } else {
      console.log("Status: 5")
      res.status(400).json({ error: "Failed to create user" });
      console.log("id of user is not present in data");
      return;
    }



  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find user with matching email and OTP
    const { data, error } = await supabase
      .from("users")
      .select("id, otp")
      .eq("email", email)
      .eq("otp", otp)
      .single(); // Ensure only one result is fetched

    if (error || !data) {
      return res.status(400).json({ error: "Invalid OTP or user not found" });
    }

    // Update user to set verified and clear the OTP
    const { id: userId } = data; // Extract userId from data
    const { error: updateError } = await supabase
      .from("users")
      .update({ verified: true, otp: null })
      .eq("email", email);

    if (updateError) {
      return res.status(500).json({ error: "Failed to verify user" });
    }

    // Generate JWT token for the verified user
    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ message: "User verified successfully.", token });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, password, verified")
      .eq("email", email);

    if (error || data.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = data[0];

    if (!user.verified) {
      return res.status(400).json({ error: "User not verified" });
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Fetch user data by ID
    const { data, error } = await supabase
      .from("users")
      .select("name, email, username, bio, id, orcid, orcid_access_token")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requestResetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("email", email);

  if (error || data.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  await supabase.from("users").update({ otp: otp }).eq("email", email);

  try {
    await sendOtpEmail(email, otp);
    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send OTP email." });
  }
};

const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("otp")
    .eq("email", email)
    .eq("otp", otp);

  if (error || data.length === 0) {
    return res.status(400).json({ error: "Invalid OTP or user not found." });
  }

  return res
    .status(200)
    .json({ message: "OTP verified. You can reset your password now." });
};

const setNewPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email and new password are required." });
  }

  try {
    const hashedPassword = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword, otp: null })
      .eq("email", email);

    if (updateError) {
      console.error("Update Error:", updateError);
      return res.status(500).json({ error: "Failed to update password." });
    }

    console.log("Password reset successfully for:", email);
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error in setNewPassword:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUnverifiedUsers = async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("users")
    .delete()
    .lte("created_at", fiveMinutesAgo)
    .eq("verified", false);

  if (error) {
    console.error("Failed to delete unverified users:", error);
  } else {
    console.log("Unverified users deleted successfully");
  }
};

setInterval(deleteUnverifiedUsers, 5 * 60 * 1000);

module.exports = {
  signUpUser,
  verifyOtp,
  loginUser,
  getUserProfile,
  setNewPassword,
  verifyResetOtp,
  requestResetPassword,
};
