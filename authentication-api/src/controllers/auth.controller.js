
import User from "../models/user.model.js";

import jwt from "jsonwebtoken";

// Health check
export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication API is healthy"
  });
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email"
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    // Create user (bcrypt hashes password in pre-save hook)
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password
    });

    // Return safe user details
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // Handle duplicate email race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user and explicitly include password hash
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password using bcrypt
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Generate JWT
    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
};