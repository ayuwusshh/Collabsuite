//  /routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const SALT_ROUNDS = 10;

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json("Enter the required fields !");
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json("User already exists!");
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" });
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(201).json({ error: "Enter all required fields" });
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });
    const token = jwt.sign({ userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before saving to database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with unhashed token
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    } catch (emailError) {
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error('Email send error:', emailError);
      return res.status(500).json({ error: "Error sending email. Please try again later." });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset Password - Verify token and update password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new JWT token for automatic login
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Password reset successful",
      token: jwtToken,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
