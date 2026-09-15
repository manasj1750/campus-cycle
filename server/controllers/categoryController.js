import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

// @desc    Get all categories with dynamic live product counts
// @route   GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    // Aggregate counts of available/approved products per category
    const counts = await Product.aggregate([
      { $match: { status: { $in: ["AVAILABLE", "APPROVED"] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id.toLowerCase()] = c.count;
      }
    });

    const enriched = categories.map((cat) => {
      const liveCount = countMap[cat.name.toLowerCase()] || 0;
      return {
        ...cat.toObject(),
        productCount: liveCount
      };
    });

    res.json({
      success: true,
      categories: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create category
// @route   POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, subcategories } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists." });
    }

    const category = await Category.create({
      name,
      slug,
      icon: icon || "Package",
      description: description || "",
      subcategories: Array.isArray(subcategories) ? subcategories : []
    });

    res.status(201).json({ success: true, message: "Category created.", category });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update category
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, description, subcategories, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }
    if (icon) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (subcategories !== undefined) category.subcategories = subcategories;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({ success: true, message: "Category updated.", category });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted." });
  } catch (error) {
    next(error);
  }
};