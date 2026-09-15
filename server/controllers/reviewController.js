import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";

// @desc    Add review for a seller
// @route   POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { sellerId, productId, rating, comment } = req.body;

    if (!sellerId || !productId || !rating) {
      return res.status(400).json({ success: false, message: "Seller, product, and rating (1-5) are required." });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars." });
    }

    // Cannot review yourself
    if (String(sellerId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot review yourself." });
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
    const reviews = await Review.find({ seller: req.params.sellerId })
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