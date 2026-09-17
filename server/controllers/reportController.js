import { Report } from "../models/Report.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatReport, isUUID } from "../config/supabaseAdapter.js";

// @desc    Submit a community safety report
// @route   POST /api/reports
export const createReport = async (req, res, next) => {
  try {
    const { reportedProduct, reportedUser, reason, description } = req.body;
    const userId = String(req.user._id || req.user.id || "");

    if (!reason || !description) {
      return res.status(400).json({ success: false, message: "Please specify reason and description." });
    }

    if (isSupabaseConfigured && isUUID(userId)) {
      const targetType = reportedProduct ? "PRODUCT" : "USER";
      const targetId = reportedProduct || reportedUser || userId;

      const { data: report, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: userId,
          target_type: targetType,
          target_id: targetId,
          reason,
          details: description,
          status: "PENDING"
        })
        .select("*, reporter:users!reporter_id(id, name, email, college)")
        .single();

      if (!error && report) {
        // Notify admins
        const { data: admins } = await supabase
          .from("users")
          .select("id")
          .eq("role", "ADMIN");

        if (Array.isArray(admins)) {
          for (const admin of admins) {
            await supabase.from("notifications").insert({
              recipient_id: admin.id,
              sender_id: userId,
              type: "SYSTEM",
              title: "New Community Report",
              message: `Safety Report submitted for reason: "${reason}".`,
              link: `/admin/reports`
            });
          }
        }

        return res.status(201).json({
          success: true,
          message: "Report received. The campus safety and moderation team will review this shortly.",
          report: formatReport(report)
        });
      }
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedProduct: reportedProduct || undefined,
      reportedUser: reportedUser || undefined,
      reason,
      description
    });

    // Notify admins
    const admins = await User.find({ role: "ADMIN" });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: "SYSTEM",
        title: "New Community Report",
        message: `Safety Report submitted for reason: "${reason}".`,
        link: `/admin/reports`
      });
    }

    res.status(201).json({
      success: true,
      message: "Report received. The campus safety and moderation team will review this shortly.",
      report
    });
  } catch (error) {
    next(error);
  }
};