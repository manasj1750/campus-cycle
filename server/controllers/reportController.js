import { Report } from "../models/Report.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

// @desc    Submit a community safety report
// @route   POST /api/reports
export const createReport = async (req, res, next) => {
  try {
    const { reportedProduct, reportedUser, reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ success: false, message: "Please specify reason and description." });
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