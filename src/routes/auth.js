import express from "express";
import User from "../models/User.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";

const router = express.Router();

// -------------------- SIGNUP -------------------- //
// POST /auth/signup → Only create user
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------- LOGIN -------------------- //
// POST /auth/login → Validate credentials and generate tokens
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken; // save refresh token to DB
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------- REFRESH -------------------- //
// POST /auth/refresh → issue new access + refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    // Verify refresh token
    try {
      verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Expired or invalid refresh token" });
    }

    // Generate new tokens (rotation)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Save new refresh token in DB (invalidate old)
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
