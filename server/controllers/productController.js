import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";
import { uploadImage } from "../services/imageService.js";

// @desc    Get all public products with rich filters, sorting, search, and pagination
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subcategory,
      condition,
      location,
      brand,
      minPrice,
      maxPrice,
      status,
      seller,
      featured,
      sort = "newest",
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // By default, public only sees APPROVED & AVAILABLE / RESERVED / SOLD
    // If specific status requested (e.g. from seller dashboard or admin), respect that
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ["APPROVED", "AVAILABLE", "RESERVED", "SOLD"] };
    }

    if (seller) {
      query.seller = seller;
      // If seller queries their own, allow all statuses
      if (req.user && String(req.user._id) === String(seller)) {
        delete query.status;
        if (status) query.status = status;
      }
    }

    if (category && category !== "All" && category !== "all") {
      query.category = new RegExp(`^${category}$`, "i");
    }

    if (subcategory) {
      query.subcategory = new RegExp(`^${subcategory}$`, "i");
    }

    if (condition) {
      query.condition = condition;
    }

    if (location && location !== "All") {
      query.location = location;
    }

    if (brand) {
      query.brand = new RegExp(brand, "i");
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search && search.trim() !== "") {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
        { brand: { $regex: s, $options: "i" } },
        { tags: { $in: [new RegExp(s, "i")] } },
        { category: { $regex: s, $options: "i" } },
        { subcategory: { $regex: s, $options: "i" } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };
    else if (sort === "popular") sortOption = { views: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("seller", "name college department year profilePhoto")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details with seller info and similar products
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name college department year profilePhoto bio createdAt isVerified"
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Increment views
    product.views += 1;
    await product.save();

    // Fetch seller reviews & stats
    const [sellerListingsCount, sellerReviews, similarProducts] = await Promise.all([
      Product.countDocuments({ seller: product.seller._id, status: { $in: ["AVAILABLE", "APPROVED"] } }),
      Review.find({ seller: product.seller._id }),
      Product.find({
        category: product.category,
        _id: { $ne: product._id },
        status: { $in: ["AVAILABLE", "APPROVED"] }
      })
        .limit(4)
        .populate("seller", "name college")
    ]);

    const avgRating = sellerReviews.length
      ? Number((sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length).toFixed(1))
      : 5.0;

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        seller: {
          ...product.seller.toObject(),
          listingCount: sellerListingsCount,
          totalReviews: sellerReviews.length,
          avgRating
        }
      },
      similarProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product listing (default status: PENDING_REVIEW)
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      condition,
      brand,
      model,
      purchaseYear,
      images,
      primaryImage,
      location,
      tags,
      isNegotiable,
      contactPreference
    } = req.body;

    if (!title || !description || price === undefined || !category || !condition) {
      return res.status(400).json({ success: false, message: "Please fill in all mandatory product details." });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required for the listing." });
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : "",
      condition,
      brand: brand ? brand.trim() : "",
      model: model ? model.trim() : "",
      purchaseYear: purchaseYear ? Number(purchaseYear) : undefined,
      images,
      primaryImage: primaryImage || images[0],
      seller: req.user._id,
      location: location || "Main Campus",
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t => t.trim()) : []),
      isNegotiable: isNegotiable !== undefined ? isNegotiable : true,
      contactPreference: contactPreference || "In-App Chat",
      status: req.user.role === "ADMIN" ? "AVAILABLE" : "PENDING_REVIEW"
    });

    // Notify admins if pending review
    if (product.status === "PENDING_REVIEW") {
      const admins = await User.find({ role: "ADMIN" });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          sender: req.user._id,
          type: "SYSTEM",
          title: "New Product Awaiting Review",
          message: `${req.user.name} submitted "${product.title}" for campus marketplace review.`,
          link: `/admin/products`
        });
      }
    }

    res.status(201).json({
      success: true,
      message: product.status === "AVAILABLE"
        ? "Listing published immediately (Admin bypass)."
        : "Listing submitted for campus verification! It will appear publicly once approved by moderation.",
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product listing
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (String(product.seller) !== String(req.user._id) && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized to update this listing." });
    }

    const fields = [
      "title", "description", "price", "originalPrice", "category",
      "subcategory", "condition", "brand", "model", "purchaseYear",
      "images", "primaryImage", "location", "tags", "isNegotiable", "contactPreference"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      success: true,
      message: "Listing updated successfully.",
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (String(product.seller) !== String(req.user._id) && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this listing." });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product listing deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product status (AVAILABLE, RESERVED, SOLD)
// @route   PATCH /api/products/:id/status
export const updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["AVAILABLE", "RESERVED", "SOLD", "PENDING_REVIEW"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status option." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (String(product.seller) !== String(req.user._id) && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized to change listing status." });
    }

    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: `Product marked as ${status}.`,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple product images
// @route   POST /api/products/upload-images
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided." });
    }

    const uploadPromises = req.files.map((file) => uploadImage(file, "campuscycle/products"));
    const imageUrls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: "Images uploaded successfully.",
      urls: imageUrls
    });
  } catch (error) {
    next(error);
  }
};