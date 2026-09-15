import express from "express";
import {
  getUserProfile,
  getDashboardSummary,
  getMyListings
} from "../controllers/userController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard/summary", protect, getDashboardSummary);
router.get("/my-listings", protect, getMyListings);
router.get("/:id", optionalAuth, getUserProfile);

export default router;