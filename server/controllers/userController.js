import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Offer } from "../models/Offer.js";
import { Wishlist } from "../models/Wishlist.js";
import { Notification } from "../models/Notification.js";
import { Conversation } from "../models/Conversation.js";

// @desc    Get public user profile
// @route   GET /api/users/:id
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
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
    const userId = req.user._id;

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
    const query = { seller: req.user._id };

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
    const userId = req.user._id;

    // Prevent admin account accidental deletion from student route
    if (req.user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted from student settings."
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