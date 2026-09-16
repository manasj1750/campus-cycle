import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Offer } from "../models/Offer.js";
import { Wishlist } from "../models/Wishlist.js";
import { Notification } from "../models/Notification.js";
import { Conversation } from "../models/Conversation.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatUser, formatProduct } from "../config/supabaseAdapter.js";

// @desc    Get public user profile
// @route   GET /api/users/:id
export const getUserProfile = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (isSupabaseConfigured) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (userData) {
        const [activeRes, soldRes, reviewsRes] = await Promise.all([
          supabase
            .from("products")
            .select("*, seller:users(*)")
            .eq("seller_id", targetId)
            .in("status", ["AVAILABLE", "APPROVED"])
            .order("created_at", { ascending: false }),
          supabase
            .from("products")
            .select("*, seller:users(*)")
            .eq("seller_id", targetId)
            .eq("status", "SOLD")
            .order("created_at", { ascending: false }),
          supabase
            .from("reviews")
            .select("*, buyer:users(id, name, profile_photo)")
            .eq("seller_id", targetId)
            .order("created_at", { ascending: false })
        ]);

        const activeProducts = (activeRes.data || []).map(formatProduct);
        const soldProducts = (soldRes.data || []).map(formatProduct);
        const reviews = (reviewsRes.data || []).map((r) => ({
          _id: r.id,
          id: r.id,
          seller: r.seller_id,
          buyer: r.buyer ? formatUser(r.buyer) : r.buyer_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at
        }));

        const avgRating = reviews.length
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : 5.0;

        const formattedUser = formatUser(userData);

        return res.json({
          success: true,
          user: {
            ...formattedUser,
            stats: {
              activeCount: activeProducts.length,
              soldCount: soldProducts.length,
              reviewsCount: reviews.length,
              avgRating
            }
          },
          activeProducts,
          soldProducts,
          reviews
        });
      }
    }

    const user = await User.findById(targetId).select(
      "name college studentId department year profilePhoto bio location createdAt isVerified"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [activeProducts, soldProducts, reviews] = await Promise.all([
      Product.find({ seller: user._id, status: { $in: ["AVAILABLE", "APPROVED"] } }).sort({ createdAt: -1 }),
      Product.find({ seller: user._id, status: "SOLD" }).sort({ createdAt: -1 }),
      Review.find({ seller: user._id }).populate("buyer", "name profilePhoto").sort({ createdAt: -1 })
    ]);

    const avgRating = reviews.length
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          activeCount: activeProducts.length,
          soldCount: soldProducts.length,
          reviewsCount: reviews.length,
          avgRating
        }
      },
      activeProducts,
      soldProducts,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's dashboard statistics
// @route   GET /api/users/dashboard/summary
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured) {
      const [
        activeRes,
        pendingRes,
        soldRes,
        rejectedRes,
        wishlistRes,
        notifRes,
        offersRecRes,
        offersSentRes,
        convoRes
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .in("status", ["AVAILABLE", "APPROVED"]),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "PENDING_REVIEW"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "SOLD"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "REJECTED"),
        supabase
          .from("wishlists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .eq("is_read", false),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "Pending"),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", userId)
          .eq("status", "Pending"),
        supabase
          .from("conversation_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
      ]);

      return res.json({
        success: true,
        summary: {
          activeListings: activeRes.count || 0,
          pendingListings: pendingRes.count || 0,
          soldItems: soldRes.count || 0,
          rejectedListings: rejectedRes.count || 0,
          wishlistCount: wishlistRes.count || 0,
          unreadNotifications: notifRes.count || 0,
          offersReceived: offersRecRes.count || 0,
          offersSent: offersSentRes.count || 0,
          conversationsCount: convoRes.count || 0
        }
      });
    }

    const [
      activeListings,
      pendingListings,
      soldItems,
      rejectedListings,
      wishlistCount,
      unreadNotifications,
      offersReceived,
      offersSent,
      conversationsCount
    ] = await Promise.all([
      Product.countDocuments({ seller: userId, status: { $in: ["AVAILABLE", "APPROVED"] } }),
      Product.countDocuments({ seller: userId, status: "PENDING_REVIEW" }),
      Product.countDocuments({ seller: userId, status: "SOLD" }),
      Product.countDocuments({ seller: userId, status: "REJECTED" }),
      Wishlist.countDocuments({ user: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
      Offer.countDocuments({ seller: userId, status: "Pending" }),
      Offer.countDocuments({ buyer: userId, status: "Pending" }),
      Conversation.countDocuments({ participants: userId })
    ]);

    res.json({
      success: true,
      summary: {
        activeListings,
        pendingListings,
        soldItems,
        rejectedListings,
        wishlistCount,
        unreadNotifications,
        offersReceived,
        offersSent,
        conversationsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's listings with status filters
// @route   GET /api/users/my-listings
export const getMyListings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured) {
      let query = supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (status && status !== "ALL") {
        if (status === "ACTIVE") {
          query = query.in("status", ["AVAILABLE", "APPROVED"]);
        } else {
          query = query.eq("status", status);
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        const listings = data.map(formatProduct);
        return res.json({
          success: true,
          count: listings.length,
          listings
        });
      }
    }

    const query = { seller: userId };

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        query.status = { $in: ["AVAILABLE", "APPROVED"] };
      } else {
        query.status = status;
      }
    }

    const listings = await Product.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete logged in user's own account and cascade associated data
// @route   DELETE /api/users/me
export const deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // Prevent admin account accidental deletion from student route
    if (req.user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted from student settings."
      });
    }

    if (isSupabaseConfigured) {
      await supabase.from("products").delete().eq("seller_id", userId);
      await supabase.from("wishlists").delete().eq("user_id", userId);
      await supabase.from("offers").delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      await supabase.from("notifications").delete().eq("recipient_id", userId);
      await supabase.from("users").delete().eq("id", userId);

      res.clearCookie("token");
      return res.json({
        success: true,
        message: "Your account and all associated data have been permanently deleted."
      });
    }

    // Delete all products listed by this user
    await Product.deleteMany({ seller: userId });

    // Delete all wishlist entries for this user
    await Wishlist.deleteMany({ user: userId });

    // Delete offers sent or received by this user
    await Offer.deleteMany({ $or: [{ buyer: userId }, { seller: userId }] });

    // Delete notifications received by this user
    await Notification.deleteMany({ recipient: userId });

    // Delete the user record
    await User.findByIdAndDelete(userId);

    // Clear authentication cookie if present
    res.clearCookie("token");

    res.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted."
    });
  } catch (error) {
    next(error);
  }
};