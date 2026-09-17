import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatUser, isUUID } from "../config/supabaseAdapter.js";

// @desc    Add review for a seller
// @route   POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { sellerId, productId, rating, comment } = req.body;
    const userId = String(req.user._id || req.user.id || "");

    if (!sellerId || !productId || !rating) {
      return res.status(400).json({ success: false, message: "Seller, product, and rating (1-5) are required." });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars." });
    }

    // Cannot review yourself
    if (String(sellerId) === String(userId)) {
      return res.status(400).json({ success: false, message: "You cannot review yourself." });
    }

    if (isSupabaseConfigured && isUUID(sellerId) && isUUID(userId)) {
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", userId)
        .eq("reviewed_user_id", sellerId)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ success: false, message: "You have already submitted a review for this transaction." });
      }

      const { data: review, error } = await supabase
        .from("reviews")
        .insert({
          reviewer_id: userId,
          reviewed_user_id: sellerId,
          rating: Number(rating),
          comment: comment || ""
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("notifications").insert({
        recipient_id: sellerId,
        sender_id: userId,
        type: "SYSTEM",
        title: "New Review Received",
        message: `${req.user.name} rated you ${rating} stars!`,
        link: `/profile/${sellerId}`
      });

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully.",
        review: {
          _id: review.id,
          id: review.id,
          seller: review.reviewed_user_id,
          buyer: userId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at
        }
      });
    }

    const existing = await Review.findOne({
      seller: sellerId,
      buyer: req.user._id,
      product: productId
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "You have already submitted a review for this transaction." });
    }

    const review = await Review.create({
      seller: sellerId,
      buyer: req.user._id,
      product: productId,
      rating: Number(rating),
      comment: comment || ""
    });

    await Notification.create({
      recipient: sellerId,
      sender: req.user._id,
      type: "SYSTEM",
      title: "New Review Received",
      message: `${req.user.name} rated you ${rating} stars!`,
      link: `/profile/${sellerId}`
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a seller
// @route   GET /api/reviews/:sellerId
export const getSellerReviews = async (req, res, next) => {
  try {
    const targetId = req.params.sellerId;

    if (isSupabaseConfigured && isUUID(targetId)) {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*, buyer:users!reviewer_id(id, name, profile_photo, college)")
        .eq("reviewed_user_id", targetId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(reviews)) {
        const formatted = reviews.map((r) => ({
          _id: r.id,
          id: r.id,
          seller: r.reviewed_user_id,
          buyer: r.buyer ? formatUser(r.buyer) : r.reviewer_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at
        }));

        const avgRating = formatted.length
          ? Number((formatted.reduce((acc, r) => acc + r.rating, 0) / formatted.length).toFixed(1))
          : 5.0;

        return res.json({
          success: true,
          count: formatted.length,
          avgRating,
          reviews: formatted
        });
      }
    }

    const reviews = await Review.find({ seller: targetId })
      .populate("buyer", "name profilePhoto college")
      .populate("product", "title primaryImage")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    res.json({
      success: true,
      count: reviews.length,
      avgRating,
      reviews
    });
  } catch (error) {
    next(error);
  }
};