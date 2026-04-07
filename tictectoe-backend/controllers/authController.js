
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const sgMail = require("@sendgrid/mail");
const { generateEmbeddingWhileSignUp } = require("./paperController");
require("dotenv").config();

// Email validation + normalization
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "dal.ca,dalhousie.ca")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const normalizeEmail = (e) => (e || "").trim().toLowerCase();

// allow only safe local-part characters (letters, numbers, ., _, %, +, -)
const LOCAL_PART_REGEX = /^[a-z0-9._%+-]+$/i;

const isInstitutionDomain = (email) => {
  const parts = normalizeEmail(email).split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return ALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
};

const validateInstitutionEmail = (email) => {
  const e = normalizeEmail(email);
  const [local, domain] = e.split("@");
  if (!local || !domain) return { ok: false, error: "Invalid email format." };
  if (!LOCAL_PART_REGEX.test(local)) return { ok: false, error: "Email has unsupported characters." };
  if (!isInstitutionDomain(e)) return { ok: false, error: "Only institution emails are allowed." };
  return { ok: true };
};

// const checkEmailAvailability = async (req, res) => {
//   const rawEmail = req.query.email || req.body?.email;
//   if (!rawEmail) return res.status(400).json({ error: "Email is required." });

//   const normalizedEmail = normalizeEmail(rawEmail);
//   const emailCheck = validateInstitutionEmail(normalizedEmail);
//   if (!emailCheck.ok) {
//     return res.status(400).json({ available: false, error: emailCheck.error });
//   }

//   try {
//     const { data, error } = await supabase
//       .from("users")
//       .select("id")
//       .eq("email", normalizedEmail)
//       .limit(1);

//     if (error) return res.status(500).json({ available: false, error: "Server error checking email." });
//     if (data && data.length > 0) return res.status(409).json({ available: false, error: "Email already in use." });
//     return res.status(200).json({ available: true });
//   } catch (e) {
//     return res.status(500).json({ available: false, error: "Internal server error." });
//   }
// };

const checkEmailAvailability = async (req, res) => {
  const rawEmail = req.query.email || req.body?.email;
  if (!rawEmail) return res.status(400).json({ error: "Email is required." });

  const normalizedEmail = normalizeEmail(rawEmail);
  const emailCheck = validateInstitutionEmail(normalizedEmail);
  if (!emailCheck.ok) {
    return res.status(400).json({ available: false, error: emailCheck.error });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, verified")
      .eq("email", normalizedEmail)
      .limit(1);

    if (error) return res.status(500).json({ available: false, error: "Server error checking email." });

    if (!data || data.length === 0) {
      return res.status(200).json({ available: true }); // totally free
    }

    const u = data[0];
    if (u.verified) {
      // verified account owns this email
      return res.status(409).json({ available: false, error: "Email already in use." });
    }

    // unverified account exists -> tell client it's pending verification (not an error)
    return res.status(200).json({ available: false, reason: "unverified" });
  } catch (error) {
    return res.status(500).json({ error});
  }
};

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
    from: "tictectoew26@gmail.com",
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

// const signUpUser = async (req, res) => {
//   const { email, password, username, name, userInterest, subscribeNewsletter } = req.body;

//   if (!email || !password || !username || !name || !userInterest) {
//     console.log("All fields are required for signing up");
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   // ✅ Add this immediately after the above block
//   if (!Array.isArray(userInterest) || userInterest.length < 2) {
//     return res.status(400).json({ error: "Select at least 2 interests." });
//   }

//   // normalize + validate institution email
//   const normalizedEmail = normalizeEmail(email);
//   const emailCheck = validateInstitutionEmail(normalizedEmail);
//   if (!emailCheck.ok) {
//     return res.status(400).json({ error: emailCheck.error });
//   }

//   try {
//     // pre-check availability to return a clean 409
//     const { data: existingUser, error: existingErr } = await supabase
//       .from("users")
//       .select("id")
//       .eq("email", normalizedEmail)
//       .limit(1);

//     if (existingErr) {
//       console.error("Availability check error:", existingErr);
//       return res.status(500).json({ error: "Failed to check email availability." });
//     }
//     if (existingUser && existingUser.length > 0) {
//       return res.status(409).json({ error: "Email already in use." });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const hashedPassword = await hashPassword(password);

//     const { data, error } = await supabase.from("users").insert([
//       {
//         email: normalizedEmail,
//         password: hashedPassword,
//         username,
//         name,
//         user_interest: userInterest,
//         otp: otp,
//         verified: false,
//         subscribeNewsletter: !!subscribeNewsletter,
//         created_at: new Date(),
//       },
//     ]).select("*");

//     if (error) {
//       if (error.code === "23505") {
//         // unique constraint violation
//         return res.status(409).json({ error: "Email already in use." });
//       }
//       console.log("Status: 2");
//       return res.status(500).json({ error: error });
//     }
//     const userId = data[0]?.id;
//     if (userId) {
//       const response = await generateEmbeddingWhileSignUp(userInterest, userId);
//       if (!response) {
//         console.log("Failed to generate embeddings for user interest", response);
//         console.log("Status: 3")
//         return res.status(400).json({ error: "Failed to generate embeddings for user interest" });
//       }
//       console.log("Response is valid in signupUser");
//       const responseFromOtp = await sendOtpEmail(normalizedEmail, otp);
//       console.log("responseFromOtp", responseFromOtp);
//       console.log("Status: 4")
//       return res.status(200).json({ message: "Signup successful. OTP sent to your email." });

//     } else {
//       console.log("Status: 5")
//       console.log("id of user is not present in data");
//       return res.status(400).json({ error: "Failed to create user" });
//     }
//   } catch (err) {
//     console.error("Error during signup:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

const signUpUser = async (req, res) => {
  const { email, password, username, name, userInterest, subscribeNewsletter } = req.body;

  if (!email || !password || !username || !name || !userInterest) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!Array.isArray(userInterest) || userInterest.length < 2) {
    return res.status(400).json({ error: "Select at least 2 interests." });
  }

  const normalizedEmail = normalizeEmail(email);
  const emailCheck = validateInstitutionEmail(normalizedEmail);
  if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });

  try {
    // Look up existing user by email (include verified flag)
    const { data: existing, error: lookupErr } = await supabase
      .from("users")
      .select("id, verified")
      .eq("email", normalizedEmail)
      .limit(1);

    if (lookupErr) {
      console.error("Availability check error:", lookupErr);
      return res.status(500).json({ error: "Failed to check email availability." });
    }

    // CASE A: Email already exists
    if (existing && existing.length > 0) {
      const u = existing[0];

      // A1) If verified -> block with 409
      if (u.verified) {
        return res.status(409).json({ error: "Email already in use." });
      }

      // A2) If UNVERIFIED -> regenerate OTP, update, resend, and return 200 (not an error)
      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashedPassword = await hashPassword(password);

      const { error: updateErr } = await supabase
        .from("users")
        .update({
          password: hashedPassword,                // allow changing password on retry
          user_interest: userInterest,
          otp,
          subscribeNewsletter: !!subscribeNewsletter,
          created_at: new Date(),                  // refresh created_at to extend cleanup window
        })
        .eq("id", u.id);

      if (updateErr) {
        console.error("Unverified update error:", updateErr);
        return res.status(500).json({ error: "Failed to update unverified user." });
      }

      await sendOtpEmail(normalizedEmail, otp);
      return res.status(200).json({ message: "OTP resent. Please verify your email." });
    }

    // CASE B: Fresh signup (no user record yet)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await hashPassword(password);

    const { data, error } = await supabase.from("users").insert([{
      email: normalizedEmail,
      password: hashedPassword,
      username,
      name,
      user_interest: userInterest,
      otp,
      verified: false,
      subscribeNewsletter: !!subscribeNewsletter,
      created_at: new Date(),
    }]).select("*");

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Email already in use." });
      return res.status(500).json({ error: "Failed to create user." });
    }

    const userId = data?.[0]?.id;
    if (!userId) return res.status(400).json({ error: "Failed to create user" });

    const ok = await generateEmbeddingWhileSignUp(userInterest, userId);
    if (!ok) return res.status(400).json({ error: "Failed to generate embeddings for user interest" });

    await sendOtpEmail(normalizedEmail, otp);
    return res.status(200).json({ message: "Signup successful. OTP sent to your email." });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  try {
    // Find user with matching email and OTP
    const { data, error } = await supabase
      .from("users")
      .select("id, otp")
      .eq("email", normalizedEmail)
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
      .eq("email", normalizedEmail);

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

// const loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: "Email and password are required." });
//   }
//   const normalizedEmail = normalizeEmail(email);

//   try {
//     const { data, error } = await supabase
//       .from("users")
//       .select("id, password, verified")
//       .eq("email", normalizedEmail);

//     if (error || data.length === 0) {
//       return res.status(400).json({ error: "User not found" });
//     }

//     const user = data[0];

//     if (!user.verified) {
//       return res.status(400).json({ error: "User not verified" });
//     }

//     const isPasswordValid = await verifyPassword(password, user.password);

//     if (!isPasswordValid) {
//       return res.status(400).json({ error: "Invalid password" });
//     }

//     // Generate JWT
//     const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
//     return res.status(200).json({ message: "Login successful", token });
//   } catch (err) {
//     console.error("Error during login:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const normalizedEmail = normalizeEmail(email);

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, password, verified, email")
      .eq("email", normalizedEmail)
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = data[0];

    if (!user.verified) {
      // resend OTP on login attempt
      const otp = Math.floor(100000 + Math.random() * 900000);
      await supabase.from("users").update({ otp, created_at: new Date() }).eq("id", user.id);
      await sendOtpEmail(user.email, otp);
      // 403 to indicate “action required”, include a flag
      return res.status(403).json({ error: "User not verified", resent: true });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });
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
  const normalizedEmail = normalizeEmail(email);
  const otp = Math.floor(100000 + Math.random() * 900000);

  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("email", normalizedEmail);

  if (error || data.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  await supabase.from("users").update({ otp: otp }).eq("email", normalizedEmail);

  try {
    await sendOtpEmail(normalizedEmail, otp);
    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
      console.error("Error sending OTP email:", err);
      return res.status(500).json({ error: "Failed to send OTP email" });
  }
};

// const verifyResetOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   const normalizedEmail = normalizeEmail(email);

//   const { data, error } = await supabase
//     .from("users")
//     .select("otp")
//     .eq("email", normalizedEmail)
//     .eq("otp", otp);

//   if (error || data.length === 0) {
//     return res.status(400).json({ error: "Invalid OTP or user not found." });
//   }

//   return res
//     .status(200)
//     .json({ message: "OTP verified. You can reset your password now." });
// };

const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body || {};
  console.log("verifyResetOtp body:", req.body);
  const normalizedEmail = normalizeEmail(email || "");
  const cleanOtp = String(otp || "").trim();
  if (!normalizedEmail || !cleanOtp) {
    return res.status(400).json({ error: "Invalid OTP or user not found." });
  }

  // fetch by email only, then compare in JS to avoid type issues
  const { data, error } = await supabase
    .from("users")
    .select("otp")
    .eq("email", normalizedEmail)
    .single();

  if (error || !data) {
    return res.status(400).json({ error: "Invalid OTP or user not found." });
  }

  if (String(data.otp) !== cleanOtp) {
    return res.status(400).json({ error: "Invalid OTP or user not found." });
  }

  return res.status(200).json({ message: "OTP verified. You can reset your password now." });
};

const setNewPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email and new password are required." });
  }
  const normalizedEmail = normalizeEmail(email);
  try {
    const hashedPassword = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword, otp: null })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.error("Update Error:", updateError);
      return res.status(500).json({ error: "Failed to update password." });
    }

    console.log("Password reset successfully for:", normalizedEmail);
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
  checkEmailAvailability,
};
