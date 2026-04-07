const express = require("express");
const router = express.Router();
const {
  signUpUser,
  verifyOtp,
  loginUser,
  requestResetPassword,
  verifyResetOtp,
  setNewPassword,
  getUserProfile,
  checkEmailAvailability,  
} = require("../controllers/authController");

router.post("/signup", signUpUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/request-reset-password", requestResetPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/set-new-password", setNewPassword);
router.get("/user-profile", getUserProfile);  
router.get("/check-email", checkEmailAvailability);
module.exports = router;
