
import express from "express";

import {
  healthCheck,
  registerUser,
  loginUser,
  getCurrentUser
} from "../controllers/auth.controller.js";

import {
  protect,
  authorizeRoles
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/health", healthCheck);

router.post("/auth/register", registerUser);

router.post("/auth/login", loginUser);

router.get("/auth/me", protect, getCurrentUser);

router.get(
  "/admin/test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome, Admin!"
    });
  }
);

export default router;