import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatUser, formatProduct, formatMessage, formatConversation } from "../config/supabaseAdapter.js";

// @desc    Get all conversations for logged in user
// @route   GET /api/messages/conversations
export const getConversations = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", req.user._id);

      if (participations && participations.length > 0) {
        const convoIds = participations.map((p) => p.conversation_id);

        const { data: convos } = await supabase
          .from("conversations")
          .select("*, product:products(*, seller:users(*))")
          .in("id", convoIds)
          .order("updated_at", { ascending: false });

        if (Array.isArray(convos)) {
          const { data: allParts } = await supabase
            .from("conversation_participants")
            .select("conversation_id, user:users(*)")
            .in("conversation_id", convoIds);

          const partsMap = {};
          if (Array.isArray(allParts)) {
            allParts.forEach((ap) => {
              if (!partsMap[ap.conversation_id]) partsMap[ap.conversation_id] = [];
              if (ap.user) partsMap[ap.conversation_id].push(formatUser(ap.user));
            });
          }

          const { data: unreadMsgs } = await supabase
            .from("messages")
            .select("conversation_id")
            .in("conversation_id", convoIds)
            .eq("receiver_id", req.user._id)
            .eq("is_read", false);

          const unreadMap = {};
          if (Array.isArray(unreadMsgs)) {
            unreadMsgs.forEach((um) => {
              unreadMap[um.conversation_id] = (unreadMap[um.conversation_id] || 0) + 1;
            });
          }

          const enriched = convos.map((c) =>
            formatConversation({
              ...c,
              participants: partsMap[c.id] || [],
              unread_count: unreadMap[c.id] || 0
            })
          );

          return res.json({
            success: true,
            conversations: enriched
          });
        }
      } else if (participations && participations.length === 0) {
        return res.json({ success: true, conversations: [] });
      }
    }

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

    if (isSupabaseConfigured) {
      // Verify conversation exists and user is participant
      const { data: part } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", req.user._id)
        .single();

      if (part) {
        // Mark as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .eq("receiver_id", req.user._id)
          .eq("is_read", false);

        // Fetch messages with sender
        const { data: msgs } = await supabase
          .from("messages")
          .select("*, sender:users(*)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        return res.json({
          success: true,
          messages: Array.isArray(msgs) ? msgs.map(formatMessage) : []
        });
      }
    }

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

    if (isSupabaseConfigured) {
      let finalConvoId = conversationId;
      if (!finalConvoId && productId && receiverId) {
        const { data: existingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("product_id", productId)
          .limit(1)
          .single();

        if (existingConvo) {
          finalConvoId = existingConvo.id;
        } else {
          const { data: newConvo } = await supabase
            .from("conversations")
            .insert({ product_id: productId, last_message_text: text.trim() })
            .select("id")
            .single();

          if (newConvo) {
            finalConvoId = newConvo.id;
            await supabase.from("conversation_participants").insert([
              { conversation_id: finalConvoId, user_id: req.user._id },
              { conversation_id: finalConvoId, user_id: receiverId }
            ]);
          }
        }
      }

      if (finalConvoId) {
        let targetReceiver = receiverId;
        if (!targetReceiver) {
          const { data: parts } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", finalConvoId)
            .neq("user_id", req.user._id)
            .single();
          targetReceiver = parts?.user_id;
        }

        const { data: newMsg, error: msgErr } = await supabase
          .from("messages")
          .insert({
            conversation_id: finalConvoId,
            sender_id: req.user._id,
            receiver_id: targetReceiver,
            text: text.trim()
          })
          .select("*, sender:users(*)")
          .single();

        if (msgErr) throw new Error(msgErr.message);

        // Update conversation last message & timestamp
        await supabase
          .from("conversations")
          .update({
            last_message_text: text.trim(),
            last_message_sender_id: req.user._id,
            last_message_at: new Date(),
            updated_at: new Date()
          })
          .eq("id", finalConvoId);

        // Emit via Socket.io if running
        const io = req.app.get("io");
        if (io && targetReceiver) {
          io.to(String(targetReceiver)).emit("new_message", {
            message: formatMessage(newMsg),
            conversationId: finalConvoId
          });
        }

        return res.status(201).json({
          success: true,
          message: formatMessage(newMsg)
        });
      }
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

    if (isSupabaseConfigured) {
      const { data: product } = await supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("id", productId)
        .single();

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      if (String(product.seller_id) === String(req.user._id)) {
        return res.status(400).json({ success: false, message: "You cannot message yourself as the seller." });
      }

      let convoId = null;
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .eq("product_id", productId)
        .limit(1)
        .single();

      if (existingConvo) {
        convoId = existingConvo.id;
      } else {
        const { data: newConvo } = await supabase
          .from("conversations")
          .insert({ product_id: productId })
          .select("id")
          .single();

        if (newConvo) {
          convoId = newConvo.id;
          await supabase.from("conversation_participants").insert([
            { conversation_id: convoId, user_id: req.user._id },
            { conversation_id: convoId, user_id: product.seller_id }
          ]);
        }
      }

      return res.json({
        success: true,
        conversation: {
          _id: convoId,
          id: convoId,
          product: formatProduct(product)
        }
      });
    }

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