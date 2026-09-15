import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
export const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate({
        path: "product",
        populate: {
          path: "seller",
          select: "name college profilePhoto"
        }
      })
      .sort({ createdAt: -1 });

    // Filter out null products if deleted
    const validItems = items.filter((item) => item.product !== null);

    res.json({
      success: true,
      count: validItems.length,
      wishlist: validItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const existing = await Wishlist.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Item is already saved in your wishlist." });
    }

    const item = await Wishlist.create({
      user: req.user._id,
      product: productId
    });

    res.status(201).json({
      success: true,
      message: "Added to wishlist!",
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

    res.json({
      success: true,
      message: "Removed from wishlist."
    });
  } catch (error) {
    next(error);
  }
};