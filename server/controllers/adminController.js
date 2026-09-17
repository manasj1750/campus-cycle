import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Transaction } from "../models/Transaction.js";
import { Report } from "../models/Report.js";
import { Notification } from "../models/Notification.js";
import { AdminAction } from "../models/ExtraModels.js";
import { classifyProduct } from "../utils/categoryClassifier.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import {
  formatUser,
  formatProduct,
  formatReport,
  formatNotification,
  isUUID
} from "../config/supabaseAdapter.js";

// @desc    Get overall admin stats & analytics for Recharts
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const [
        usersRes,
        activeRes,
        pendingRes,
        soldRes,
        rejectedRes,
        reportsRes,
        allSoldRes,
        allProductsRes
      ] = await Promise.all([
        supabase.from("users").select("id, created_at, role").eq("role", "USER"),
        supabase.from("products").select("id", { count: "exact", head: true }).in("status", ["AVAILABLE", "APPROVED"]),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "PENDING_REVIEW"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "SOLD"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "REJECTED"),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("products").select("price, original_price, category").eq("status", "SOLD"),
        supabase.from("products").select("category, condition, created_at")
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const activeListings = activeRes.count || 0;
      const pendingListings = pendingRes.count || 0;
      const soldProducts = soldRes.count || 0;
      const rejectedListings = rejectedRes.count || 0;
      const totalReports = reportsRes.count || 0;
      const allSoldProducts = allSoldRes.data || [];
      const allProducts = allProductsRes.data || [];

      // Calculate Sustainability & Savings
      const itemsReused = soldProducts || allSoldProducts.length;
      let studentSavings = 0;
      allSoldProducts.forEach((p) => {
        const price = Number(p.price) || 0;
        const orig = Number(p.original_price) || 0;
        if (orig && orig > price) {
          studentSavings += orig - price;
        } else {
          studentSavings += price * 0.45;
        }
      });

      if (studentSavings < 50000 && itemsReused > 0) {
        studentSavings = itemsReused * 1250;
      }

      const wasteAvoidedKg = Math.round(itemsReused * 3.4);

      // Categories breakdown
      const catCountMap = {};
      const condCountMap = {};
      allProducts.forEach((p) => {
        const cat = p.category || "Other";
        catCountMap[cat] = (catCountMap[cat] || 0) + 1;

        const cond = p.condition || "Unknown";
        condCountMap[cond] = (condCountMap[cond] || 0) + 1;
      });

      const categoryStats = Object.entries(catCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const conditionStats = Object.entries(condCountMap)
        .map(([name, count]) => ({ name, count }));

      // 7-day timeline trends
      const now = new Date();
      const timeline = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const uCount = (usersRes.data || []).filter((u) => {
          const t = new Date(u.created_at);
          return t >= dayStart && t <= dayEnd;
        }).length;

        const pCount = allProducts.filter((p) => {
          const t = new Date(p.created_at);
          return t >= dayStart && t <= dayEnd;
        }).length;

        timeline.push({
          name: dayName,
          date: dayStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          users: uCount,
          listings: pCount,
          transactions: 0
        });
      }

      return res.json({
        success: true,
        stats: {
          totalUsers,
          activeListings,
          pendingListings,
          soldProducts,
          rejectedListings,
          totalTransactions: soldProducts,
          totalReports,
          itemsReused,
          estimatedSavings: Math.round(studentSavings),
          wasteAvoidedKg
        },
        categoryStats,
        conditionStats,
        timeline
      });
    }

    const [
      totalUsers,
      activeListings,
      pendingListings,
      soldProducts,
      rejectedListings,
      totalTransactions,
      totalReports,
      allSoldProducts
    ] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      Product.countDocuments({ status: { $in: ["AVAILABLE", "APPROVED"] } }),
      Product.countDocuments({ status: "PENDING_REVIEW" }),
      Product.countDocuments({ status: "SOLD" }),
      Product.countDocuments({ status: "REJECTED" }),
      Transaction.countDocuments({ status: "Completed" }),
      Report.countDocuments(),
      Product.find({ status: "SOLD" }).select("price originalPrice category")
    ]);

    // Calculate Sustainability & Savings
    const itemsReused = soldProducts || allSoldProducts.length;

    let studentSavings = 0;
    allSoldProducts.forEach((p) => {
      if (p.originalPrice && p.originalPrice > p.price) {
        studentSavings += (p.originalPrice - p.price);
      } else {
        studentSavings += p.price * 0.45; // estimated ~45% campus resale saving
      }
    });
    // Fallback baseline for demo realism if few sold
    if (studentSavings < 50000 && itemsReused > 0) {
      studentSavings = itemsReused * 1250;
    }

    // Waste avoided estimate: ~3.2 kg average material/e-waste diverted per reused college item
    const wasteAvoidedKg = Math.round(itemsReused * 3.4);

    // Categories breakdown
    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Conditions breakdown
    const conditionStats = await Product.aggregate([
      { $group: { _id: "$condition", count: { $sum: 1 } } }
    ]);

    // 7-day timeline trends
    const now = new Date();
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const [uCount, pCount, tCount] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Product.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Transaction.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);

      timeline.push({
        name: dayName,
        date: dayStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        users: uCount,
        listings: pCount,
        transactions: tCount
      });
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeListings,
        pendingListings,
        soldProducts,
        rejectedListings,
        totalTransactions: totalTransactions || soldProducts,
        totalReports,
        itemsReused,
        estimatedSavings: Math.round(studentSavings),
        wasteAvoidedKg
      },
      categoryStats: categoryStats.map((c) => ({ name: c._id || "Other", count: c.count })),
      conditionStats: conditionStats.map((c) => ({ name: c._id || "Unknown", count: c.count })),
      timeline
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List & search users
// @route   GET /api/admin/users
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;

    if (isSupabaseConfigured) {
      let q = supabase.from("users").select("*").order("created_at", { ascending: false });

      if (role && role !== "ALL") {
        q = q.eq("role", role);
      }
      if (status === "SUSPENDED") {
        q = q.eq("is_suspended", true);
      }
      if (status === "ACTIVE") {
        q = q.eq("is_suspended", false);
      }
      if (search && search.trim()) {
        const s = search.trim();
        q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,student_id.ilike.%${s}%,college.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        const users = data.map(formatUser);
        return res.json({
          success: true,
          count: users.length,
          users
        });
      }
    }

    // Fallback to MongoDB
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } }
      ];
    }

    if (role && role !== "ALL") query.role = role;
    if (status === "SUSPENDED") query.isSuspended = true;
    if (status === "ACTIVE") query.isSuspended = false;

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Suspend or unsuspend user
// @route   PATCH /api/admin/users/:id/suspend
export const toggleSuspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (user.role === "ADMIN") {
        return res.status(400).json({ success: false, message: "Cannot suspend administrator accounts." });
      }

      const newSuspended = !user.is_suspended;
      const newReason = newSuspended ? (reason || "Violation of campus rules") : "";

      const { data: updated, error } = await supabase
        .from("users")
        .update({
          is_suspended: newSuspended,
          suspension_reason: newReason
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return res.json({
        success: true,
        message: newSuspended ? "User account suspended." : "User account unsuspended.",
        user: formatUser(updated)
      });
    }

    // Fallback to MongoDB
    const user = await User.findById(targetId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ success: false, message: "Cannot suspend administrator accounts." });
    }

    user.isSuspended = !user.isSuspended;
    user.suspensionReason = user.isSuspended ? (reason || "Violation of campus rules") : "";
    await user.save();

    await AdminAction.create({
      admin: req.user._id,
      actionType: user.isSuspended ? "SUSPEND_USER" : "UNSUSPEND_USER",
      targetType: "User",
      targetId: user._id.toString(),
      details: user.suspensionReason
    });

    res.json({
      success: true,
      message: user.isSuspended ? "User account suspended." : "User account unsuspended.",
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (user.role === "ADMIN") {
        return res.status(400).json({ success: false, message: "Cannot delete administrator accounts." });
      }

      await supabase.from("products").delete().eq("seller_id", targetId);
      await supabase.from("wishlists").delete().eq("user_id", targetId);
      await supabase.from("offers").delete().or(`buyer_id.eq.${targetId},seller_id.eq.${targetId}`);
      await supabase.from("notifications").delete().eq("recipient_id", targetId);
      await supabase.from("users").delete().eq("id", targetId);

      return res.json({ success: true, message: "User and associated listings deleted." });
    }

    // Fallback to MongoDB
    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ success: false, message: "Cannot delete administrator accounts." });
    }

    await User.findByIdAndDelete(targetId);
    await Product.deleteMany({ seller: targetId });

    res.json({ success: true, message: "User and associated listings deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all listings for moderation
// @route   GET /api/admin/products
export const getAdminProducts = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    if (isSupabaseConfigured) {
      let q = supabase
        .from("products")
        .select("*, seller:users(*)")
        .order("created_at", { ascending: false });

      if (status && status !== "ALL") {
        q = q.eq("status", status);
      }

      if (search && search.trim()) {
        const s = search.trim();
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,brand.ilike.%${s}%,category.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        const products = data.map(formatProduct);
        return res.json({
          success: true,
          count: products.length,
          products
        });
      }
    }

    // Fallback to MongoDB
    const query = {};

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(query)
      .populate("seller", "name email college studentId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Approve listing
// @route   PATCH /api/admin/products/:id/approve
export const approveProduct = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: product } = await supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("id", targetId)
        .maybeSingle();

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const { data: updated, error } = await supabase
        .from("products")
        .update({
          status: "AVAILABLE",
          rejection_reason: ""
        })
        .eq("id", targetId)
        .select("*, seller:users(*)")
        .single();

      if (error) throw new Error(error.message);

      if (product.seller_id) {
        await supabase.from("notifications").insert({
          recipient_id: product.seller_id,
          type: "LISTING_APPROVED",
          title: "Listing Approved! 🎉",
          message: `Your listing "${product.title}" has been verified and is now live on the CampusCycle marketplace.`,
          link: `/products/${product.id}`
        });
      }

      return res.json({
        success: true,
        message: "Listing approved and published to the marketplace!",
        product: formatProduct(updated)
      });
    }

    // Fallback to MongoDB
    const product = await Product.findById(targetId).populate("seller", "name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    product.status = "AVAILABLE";
    product.rejectionReason = "";
    await product.save();

    await Notification.create({
      recipient: product.seller._id,
      type: "LISTING_APPROVED",
      title: "Listing Approved! 🎉",
      message: `Your listing "${product.title}" has been verified and is now live on the CampusCycle marketplace.`,
      link: `/products/${product._id}`
    });

    res.json({
      success: true,
      message: "Listing approved and published to the marketplace!",
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reject listing
// @route   PATCH /api/admin/products/:id/reject
export const rejectProduct = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: product } = await supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("id", targetId)
        .maybeSingle();

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const rejectionReason = reason || "Listing does not adhere to campus marketplace criteria.";

      const { data: updated, error } = await supabase
        .from("products")
        .update({
          status: "REJECTED",
          rejection_reason: rejectionReason
        })
        .eq("id", targetId)
        .select("*, seller:users(*)")
        .single();

      if (error) throw new Error(error.message);

      if (product.seller_id) {
        await supabase.from("notifications").insert({
          recipient_id: product.seller_id,
          type: "LISTING_REJECTED",
          title: "Listing Requires Attention",
          message: `Your listing "${product.title}" was not approved. Reason: ${rejectionReason}`,
          link: `/dashboard`
        });
      }

      return res.json({
        success: true,
        message: "Listing rejected with student feedback.",
        product: formatProduct(updated)
      });
    }

    // Fallback to MongoDB
    const product = await Product.findById(targetId).populate("seller", "name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    product.status = "REJECTED";
    product.rejectionReason = reason || "Listing does not adhere to campus marketplace criteria.";
    await product.save();

    await Notification.create({
      recipient: product.seller._id,
      type: "LISTING_REJECTED",
      title: "Listing Requires Attention",
      message: `Your listing "${product.title}" was not approved. Reason: ${product.rejectionReason}`,
      link: `/dashboard`
    });

    res.json({
      success: true,
      message: "Listing rejected with student feedback.",
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle featured listing
// @route   PATCH /api/admin/products/:id/feature
export const toggleFeatureProduct = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: product } = await supabase
        .from("products")
        .select("id, is_featured")
        .eq("id", targetId)
        .maybeSingle();

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const newFeatured = !product.is_featured;
      await supabase.from("products").update({ is_featured: newFeatured }).eq("id", targetId);

      return res.json({
        success: true,
        message: newFeatured ? "Listing marked as featured." : "Listing removed from featured.",
        isFeatured: newFeatured
      });
    }

    // Fallback to MongoDB
    const product = await Product.findById(targetId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({
      success: true,
      message: product.isFeatured ? "Listing marked as featured." : "Listing removed from featured.",
      isFeatured: product.isFeatured
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List reports
// @route   GET /api/admin/reports
export const getAdminReports = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const { data: reports, error } = await supabase
        .from("reports")
        .select("*, reporter:users!reporter_id(id, name, email, college)")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(reports)) {
        const formatted = reports.map(formatReport);
        return res.json({
          success: true,
          count: formatted.length,
          reports: formatted
        });
      }
    }

    // Fallback to MongoDB
    const reports = await Report.find()
      .populate("reporter", "name email college")
      .populate("reportedUser", "name email")
      .populate("reportedProduct", "title price primaryImage status seller")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update report status
// @route   PATCH /api/admin/reports/:id
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const targetId = req.params.id;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const updates = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.details = adminNotes;

      const { data: updated, error } = await supabase
        .from("reports")
        .update(updates)
        .eq("id", targetId)
        .select("*, reporter:users!reporter_id(id, name, email, college)")
        .single();

      if (error) throw new Error(error.message);

      return res.json({
        success: true,
        message: "Report status updated.",
        report: formatReport(updated)
      });
    }

    // Fallback to MongoDB
    const report = await Report.findById(targetId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    report.resolvedBy = req.user._id;
    await report.save();

    res.json({
      success: true,
      message: "Report status updated.",
      report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update admin email & password
// @route   PATCH /api/admin/credentials
export const updateAdminCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const adminId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(adminId)) {
      const updates = {};

      if (email && email.trim().toLowerCase() !== req.user.email) {
        const emailLower = email.trim().toLowerCase();
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("email", emailLower)
          .neq("id", adminId)
          .maybeSingle();

        if (existing) {
          return res.status(400).json({ success: false, message: "This email address is already taken by another user." });
        }
        updates.email = emailLower;
      }

      if (password && password.trim()) {
        if (password.trim().length < 6) {
          return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }
        updates.password = await bcrypt.hash(password.trim(), 10);
      }

      if (Object.keys(updates).length > 0) {
        const { data: updated, error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", adminId)
          .select()
          .single();

        if (error) throw new Error(error.message);

        return res.json({
          success: true,
          message: "Admin credentials successfully updated.",
          admin: {
            _id: updated.id,
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role
          }
        });
      }

      return res.json({
        success: true,
        message: "No credential changes provided.",
        admin: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      });
    }

    // Fallback to MongoDB
    const admin = await User.findById(req.user._id).select("+password");
    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (email && email.trim().toLowerCase() !== admin.email) {
      const emailLower = email.trim().toLowerCase();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: admin._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "This email address is already taken by another user." });
      }
      admin.email = emailLower;
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
      }
      admin.password = password.trim();
    }

    await admin.save();

    res.json({
      success: true,
      message: "Admin credentials successfully updated.",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Run automatic category filter on all products in database
// @route   POST /api/admin/products/auto-categorize-all
export const autoCategorizeAllProducts = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const { data: products } = await supabase.from("products").select("*");
      let updatedCount = 0;
      const reclassifiedItems = [];

      for (const p of products || []) {
        const classification = classifyProduct({
          title: p.title,
          description: p.description,
          brand: p.brand,
          tags: p.tags,
          currentCategory: p.category
        });

        if (classification.isMismatch && classification.confidence >= 0.35 && classification.category) {
          const oldCat = p.category;
          const updates = {
            category: classification.category,
            subcategory: classification.subcategory || p.subcategory || ""
          };

          await supabase.from("products").update(updates).eq("id", p.id);
          updatedCount++;
          reclassifiedItems.push({
            id: p.id,
            title: p.title,
            fromCategory: oldCat,
            toCategory: classification.category,
            subcategory: classification.subcategory,
            confidence: classification.confidence
          });
        }
      }

      return res.json({
        success: true,
        message: `Automatic category filter completed. ${updatedCount} out of ${(products || []).length} products reclassified.`,
        totalScanned: (products || []).length,
        updatedCount,
        reclassifiedItems
      });
    }

    // Fallback to MongoDB
    const products = await Product.find({});
    let updatedCount = 0;
    const reclassifiedItems = [];

    for (const p of products) {
      const classification = classifyProduct({
        title: p.title,
        description: p.description,
        brand: p.brand,
        tags: p.tags,
        currentCategory: p.category
      });

      if (classification.isMismatch && classification.confidence >= 0.35 && classification.category) {
        const oldCat = p.category;
        p.originalCategory = oldCat;
        p.category = classification.category;
        if (classification.subcategory) {
          p.subcategory = classification.subcategory;
        }
        p.autoFiltered = true;
        await p.save();

        updatedCount++;
        reclassifiedItems.push({
          id: p._id,
          title: p.title,
          fromCategory: oldCat,
          toCategory: classification.category,
          subcategory: classification.subcategory,
          confidence: classification.confidence
        });
      }
    }

    res.json({
      success: true,
      message: `Automatic category filter completed. ${updatedCount} out of ${products.length} products reclassified.`,
      totalScanned: products.length,
      updatedCount,
      reclassifiedItems
    });
  } catch (error) {
    next(error);
  }
};