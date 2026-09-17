import { Notification } from "../models/Notification.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatNotification, isUUID } from "../config/supabaseAdapter.js";

// @desc    Get current user's notifications
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(userId)) {
      const [{ data: notifs }, { count: unreadCount }] = await Promise.all([
        supabase
          .from("notifications")
          .select("*, sender:users!sender_id(id, name, profile_photo)")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .eq("is_read", false)
      ]);

      const notifications = (notifs || []).map(formatNotification);
      return res.json({
        success: true,
        unreadCount: unreadCount || 0,
        notifications
      });
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profilePhoto")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notifId = req.params.id;
    const userId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(notifId) && isUUID(userId)) {
      const { data: updated } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId)
        .eq("recipient_id", userId)
        .select()
        .maybeSingle();

      if (!updated) {
        return res.status(404).json({ success: false, message: "Notification not found." });
      }

      return res.json({ success: true, notification: formatNotification(updated) });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(userId)) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);

      return res.json({ success: true, message: "All notifications marked as read." });
    }

    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
};