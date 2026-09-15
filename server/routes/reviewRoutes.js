import express from "express";
import { createReview, getSellerReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/:sellerId", getSellerReviews);

export default router;