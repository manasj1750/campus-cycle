import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatProduct, isUUID } from "../config/supabaseAdapter.js";

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
export const getWishlist = async (req, res, next) => {
  try {
    const userId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(userId)) {
      const { data: items, error } = await supabase
        .from("wishlists")
        .select("*, product:products(*, seller:users(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(items)) {
        const validItems = items
          .filter((item) => item.product !== null)
          .map((item) => ({
            _id: item.id,
            id: item.id,
            user: item.user_id,
            product: formatProduct(item.product),
            createdAt: item.created_at
          }));

        return res.json({
          success: true,
          count: validItems.length,
          wishlist: validItems
        });
      }
    }

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
    const userId = String(req.user._id || req.user.id || "");

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required." });
    }

    if (isSupabaseConfigured && isUUID(productId) && isUUID(userId)) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const { data: existing } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ success: false, message: "Item is already saved in your wishlist." });
      }

      const { data: item, error: insErr } = await supabase
        .from("wishlists")
        .insert({
          user_id: userId,
          product_id: productId
        })
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);

      return res.status(201).json({
        success: true,
        message: "Added to wishlist!",
        item: {
          _id: item.id,
          id: item.id,
          user: item.user_id,
          product: item.product_id,
          createdAt: item.created_at
        }
      });
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
    const userId = String(req.user._id || req.user.id || "");

    if (isSupabaseConfigured && isUUID(productId) && isUUID(userId)) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      return res.json({
        success: true,
        message: "Removed from wishlist."
      });
    }

    await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

    res.json({
      success: true,
      message: "Removed from wishlist."
    });
  } catch (error) {
    next(error);
  }
};