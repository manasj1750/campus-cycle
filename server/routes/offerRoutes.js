import express from "express";
import {
  getOffers,
  createOffer,
  updateOfferStatus
} from "../controllers/offerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getOffers);
router.post("/", protect, createOffer);
router.patch("/:id", protect, updateOfferStatus);

export default router;