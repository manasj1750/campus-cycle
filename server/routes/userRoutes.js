import express from "express";
import {
  getUserProfile,
  getDashboardSummary,
  getMyListings,
  deleteMyAccount
} from "../controllers/userController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.delete("/me", protect, deleteMyAccount);
router.get("/dashboard/summary", protect, getDashboardSummary);
router.get("/my-listings", protect, getMyListings);
router.get("/:id", optionalAuth, getUserProfile);

export default router;