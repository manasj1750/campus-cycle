import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage);
router.post("/start", protect, startConversation);

export default router;