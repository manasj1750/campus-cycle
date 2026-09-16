import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";

// @desc    Get all conversations for logged in user
// @route   GET /api/messages/conversations
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate("participants", "name email profilePhoto college department")
      .populate("product", "title price originalPrice primaryImage images status seller")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 })
      .lean();

    // Aggregate unread message counts for current user per conversation
    const userObjId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? new mongoose.Types.ObjectId(String(req.user._id))
      : req.user._id;

    const convoIds = conversations.map((c) =>
      mongoose.Types.ObjectId.isValid(c._id) ? new mongoose.Types.ObjectId(String(c._id)) : c._id
    );

    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversation: { $in: convoIds },
          receiver: userObjId,
          isRead: false
        }
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = {};
    unreadAgg.forEach((u) => {
      unreadMap[String(u._id)] = u.count;
    });

    const enrichedConversations = conversations.map((c) => ({
      ...c,
      unreadCount: unreadMap[String(c._id)] || 0
    }));

    res.json({
      success: true,
      conversations: enrichedConversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Mark messages sent to this user as read
    await Message.updateMany(
      { conversation: conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    // Also mark related notifications from other participant as read
    const otherParticipant = conversation.participants.find(
      (p) => String(p) !== String(req.user._id)
    );
    if (otherParticipant) {
      await Notification.updateMany(
        { recipient: req.user._id, sender: otherParticipant, type: "MESSAGE", isRead: false },
        { isRead: true }
      );
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name profilePhoto")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message (REST + Socket trigger)
// @route   POST /api/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, productId, receiverId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty." });
    }

    let convo;
    if (conversationId) {
      convo = await Conversation.findById(conversationId);
    } else if (productId && receiverId) {
      // Find or create conversation
      convo = await Conversation.findOne({
        participants: { $all: [req.user._id, receiverId] },
        product: productId
      });

      if (!convo) {
        convo = await Conversation.create({
          participants: [req.user._id, receiverId],
          product: productId
        });
      }
    }

    if (!convo) {
      return res.status(400).json({ success: false, message: "Could not identify conversation." });
    }

    // Identify recipient
    const recipientId = convo.participants.find((p) => String(p) !== String(req.user._id));

    const message = await Message.create({
      conversation: convo._id,
      sender: req.user._id,
      receiver: recipientId,
      text: text.trim()
    });

    convo.lastMessage = {
      text: text.trim(),
      sender: req.user._id,
      createdAt: new Date()
    };
    convo.updatedAt = new Date();
    await convo.save();

    // Create Notification
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: "MESSAGE",
      title: "New Message Received",
      message: `${req.user.name}: "${text.trim().substring(0, 45)}..."`,
      link: `/messages`
    });

    // Broadcast via global socket.io instance if available
    const io = req.app.get("io");
    if (io) {
      io.to(String(recipientId)).emit("new_message", {
        message: await message.populate("sender", "name profilePhoto"),
        conversationId: convo._id
      });
    }

    res.status(201).json({
      success: true,
      message: await message.populate("sender", "name profilePhoto"),
      conversation: convo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or find conversation for a product
// @route   POST /api/messages/start
export const startConversation = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (String(product.seller) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot message yourself as the seller." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, product.seller] },
      product: product._id
    })
      .populate("participants", "name email profilePhoto college department")
      .populate("product", "title price primaryImage status seller");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, product.seller],
        product: product._id
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "name email profilePhoto college department")
        .populate("product", "title price primaryImage status seller");
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};