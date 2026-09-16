import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";
import { uploadImage } from "../services/imageService.js";
import { classifyProduct } from "../utils/categoryClassifier.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatProduct } from "../config/supabaseAdapter.js";

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

    if (isSupabaseConfigured) {
      let sbQuery = supabase
        .from("products")
        .select("*, seller:users(*)", { count: "exact" });

      if (status) {
        sbQuery = sbQuery.eq("status", status);
      } else if (!seller) {
        sbQuery = sbQuery.in("status", ["AVAILABLE", "APPROVED", "RESERVED", "SOLD", "PENDING_REVIEW"]);
      }

      if (seller) {
        sbQuery = sbQuery.eq("seller_id", seller);
      }

      if (category && category !== "All" && category !== "all") {
        sbQuery = sbQuery.ilike("category", category.trim());
      }

      if (subcategory) {
        sbQuery = sbQuery.ilike("subcategory", subcategory.trim());
      }

      if (condition) {
        sbQuery = sbQuery.eq("condition", condition);
      }

      if (location && location !== "All") {
        sbQuery = sbQuery.eq("location", location);
      }

      if (brand) {
        sbQuery = sbQuery.ilike("brand", `%${brand.trim()}%`);
      }

      if (minPrice) {
        sbQuery = sbQuery.gte("price", Number(minPrice));
      }

      if (maxPrice) {
        sbQuery = sbQuery.lte("price", Number(maxPrice));
      }

      if (search && search.trim() !== "") {
        const s = search.trim();
        sbQuery = sbQuery.or(`title.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%,brand.ilike.%${s}%`);
      }

      if (sort === "oldest") {
        sbQuery = sbQuery.order("created_at", { ascending: true });
      } else if (sort === "price-asc") {
        sbQuery = sbQuery.order("price", { ascending: true });
      } else if (sort === "price-desc") {
        sbQuery = sbQuery.order("price", { ascending: false });
      } else if (sort === "popular") {
        sbQuery = sbQuery.order("views_count", { ascending: false });
      } else {
        sbQuery = sbQuery.order("created_at", { ascending: false });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 12;
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      sbQuery = sbQuery.range(from, to);

      const { data, count, error } = await sbQuery;

      if (!error && Array.isArray(data)) {
        const formatted = data.map(formatProduct);
        const totalCount = count !== null ? count : formatted.length;
        return res.json({
          success: true,
          products: formatted,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum) || 1,
          total: totalCount
        });
      }
    }

    const query = {};

    // By default, public only sees APPROVED & AVAILABLE / RESERVED / SOLD
    // If specific status requested (e.g. from seller dashboard or admin), respect that
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ["AVAILABLE", "APPROVED", "RESERVED", "SOLD", "PENDING_REVIEW"] };
    }

    if (seller) {
      query.seller = seller;
      // If seller queries their own, allow all statuses
      if (req.user && String(req.user._id) === String(seller)) {
        delete query.status;
        if (status) query.status = status;
      }
    }

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "");

    if (category && category !== "All" && category !== "all") {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    if (subcategory) {
      query.subcategory = new RegExp(`^${escapeRegex(subcategory.trim())}$`, "i");
    }

    if (condition) {
      query.condition = condition;
    }

    if (location && location !== "All") {
      query.location = location;
    }

    if (brand) {
      query.brand = new RegExp(escapeRegex(brand.trim()), "i");
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
    if (isSupabaseConfigured) {
      const { data: p, error } = await supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("id", req.params.id)
        .single();

      if (!error && p) {
        // Increment views safely in background
        supabase
          .from("products")
          .update({ views_count: (p.views_count || 0) + 1 })
          .eq("id", p.id)
          .then();

        // Get similar products
        const { data: similar } = await supabase
          .from("products")
          .select("*, seller:users(id, name, college)")
          .eq("category", p.category)
          .neq("id", p.id)
          .in("status", ["AVAILABLE", "APPROVED"])
          .limit(4);

        const formatted = formatProduct(p);
        formatted.views = formatted.viewsCount + 1;
        if (formatted.seller && typeof formatted.seller === "object") {
          formatted.seller.listingCount = 1;
          formatted.seller.totalReviews = 1;
          formatted.seller.avgRating = 5.0;
        }

        return res.json({
          success: true,
          product: formatted,
          similarProducts: Array.isArray(similar) ? similar.map(formatProduct) : []
        });
      }
    }

    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name college department year profilePhoto bio createdAt isVerified"
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Increment views safely without triggering full document schema validation
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

    // Fetch seller reviews & stats safely
    const sellerId = product.seller?._id || product.seller;
    const [sellerListingsCount, sellerReviews, similarProducts] = await Promise.all([
      sellerId
        ? Product.countDocuments({ seller: sellerId, status: { $in: ["AVAILABLE", "APPROVED"] } })
        : 0,
      sellerId
        ? Review.find({ seller: sellerId })
        : [],
      Product.find({
        category: product.category,
        _id: { $ne: product._id },
        status: { $in: ["AVAILABLE", "APPROVED"] }
      })
        .limit(4)
        .populate("seller", "name college")
    ]);

    const avgRating = sellerReviews && sellerReviews.length
      ? Number((sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length).toFixed(1))
      : 5.0;

    const sellerObj = product.seller
      ? {
          ...(typeof product.seller.toObject === "function" ? product.seller.toObject() : product.seller),
          listingCount: sellerListingsCount,
          totalReviews: (sellerReviews && sellerReviews.length) || 0,
          avgRating
        }
      : {
          _id: null,
          name: "Campus Student",
          college: "Campus",
          department: "Student",
          year: "",
          profilePhoto: "",
          listingCount: 0,
          totalReviews: 0,
          avgRating: 5.0
        };

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        views: (product.views || 0) + 1,
        seller: sellerObj
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

    // Automatic Category Filter: verify and correct if wrong category was selected
    let finalCategory = category.trim();
    let finalSubcategory = subcategory ? subcategory.trim() : "";
    let wasAutoFiltered = false;
    let origCategory = "";

    const { forceCategory } = req.body;
    if (!forceCategory) {
      const classification = classifyProduct({
        title,
        description,
        brand,
        tags,
        currentCategory: category
      });

      if (classification.isMismatch && classification.confidence >= 0.35 && classification.category) {
        origCategory = finalCategory;
        finalCategory = classification.category;
        finalSubcategory = classification.subcategory || finalSubcategory;
        wasAutoFiltered = true;
      }
    }

    if (isSupabaseConfigured) {
      const { data: inserted, error: insertErr } = await supabase
        .from("products")
        .insert({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          original_price: originalPrice ? Number(originalPrice) : 0,
          category: finalCategory,
          subcategory: finalSubcategory,
          condition,
          brand: brand ? brand.trim() : "",
          model: model ? model.trim() : "",
          purchase_year: purchaseYear ? Number(purchaseYear) : null,
          images,
          primary_image: primaryImage || images[0],
          seller_id: req.user._id,
          location: location || "Main Campus",
          tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map((t) => t.trim()) : []),
          is_negotiable: isNegotiable !== undefined ? isNegotiable : true,
          contact_preference: contactPreference || "In-App Chat",
          status: "AVAILABLE"
        })
        .select("*, seller:users(*)")
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      let statusMsg = "Listing published immediately.";
      if (wasAutoFiltered) {
        statusMsg += ` (Auto-Filtered category to "${finalCategory}")`;
      }

      return res.status(201).json({
        success: true,
        message: statusMsg,
        autoFiltered: wasAutoFiltered,
        product: formatProduct(inserted)
      });
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category: finalCategory,
      subcategory: finalSubcategory,
      autoFiltered: wasAutoFiltered,
      originalCategory: origCategory,
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
      status: "AVAILABLE"
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

    let statusMsg = product.status === "AVAILABLE"
      ? "Listing published immediately."
      : "Listing submitted for campus verification! It will appear publicly once approved by moderation.";
    if (wasAutoFiltered) {
      statusMsg += ` (Auto-Filtered category to "${finalCategory}")`;
    }

    res.status(201).json({
      success: true,
      message: statusMsg,
      autoFiltered: wasAutoFiltered,
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
    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from("products")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (existing) {
        if (String(existing.seller_id) !== String(req.user._id) && req.user.role !== "ADMIN") {
          return res.status(403).json({ success: false, message: "Not authorized to update this listing." });
        }

        let finalCat = req.body.category ? req.body.category.trim() : existing.category;
        let finalSub = req.body.subcategory !== undefined ? req.body.subcategory.trim() : existing.subcategory;
        let wasAutoFiltered = false;

        if (!req.body.forceCategory && (req.body.title || req.body.description || req.body.category)) {
          const classification = classifyProduct({
            title: req.body.title || existing.title,
            description: req.body.description || existing.description,
            brand: req.body.brand || existing.brand,
            tags: req.body.tags || existing.tags,
            currentCategory: finalCat
          });
          if (classification.isMismatch && classification.confidence >= 0.35 && classification.category) {
            finalCat = classification.category;
            if (classification.subcategory) finalSub = classification.subcategory;
            wasAutoFiltered = true;
          }
        }

        const updatePayload = {
          updated_at: new Date()
        };
        if (req.body.title) updatePayload.title = req.body.title.trim();
        if (req.body.description) updatePayload.description = req.body.description.trim();
        if (req.body.price !== undefined) updatePayload.price = Number(req.body.price);
        if (req.body.originalPrice !== undefined) updatePayload.original_price = Number(req.body.originalPrice);
        updatePayload.category = finalCat;
        updatePayload.subcategory = finalSub;
        if (req.body.condition) updatePayload.condition = req.body.condition;
        if (req.body.brand !== undefined) updatePayload.brand = req.body.brand.trim();
        if (req.body.model !== undefined) updatePayload.model = req.body.model.trim();
        if (req.body.purchaseYear !== undefined) updatePayload.purchase_year = Number(req.body.purchaseYear) || null;
        if (req.body.images) updatePayload.images = req.body.images;
        if (req.body.primaryImage) updatePayload.primary_image = req.body.primaryImage;
        if (req.body.location) updatePayload.location = req.body.location;
        if (req.body.tags) updatePayload.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        if (req.body.isNegotiable !== undefined) updatePayload.is_negotiable = Boolean(req.body.isNegotiable);
        if (req.body.contactPreference) updatePayload.contact_preference = req.body.contactPreference;
        if (req.body.status) updatePayload.status = req.body.status;

        const { data: updated, error: updateErr } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", req.params.id)
          .select("*, seller:users(*)")
          .single();

        if (updateErr) throw new Error(updateErr.message);

        let updateMsg = "Listing updated successfully.";
        if (wasAutoFiltered) {
          updateMsg += ` (Auto-Filtered category to "${finalCat}")`;
        }

        return res.json({
          success: true,
          message: updateMsg,
          autoFiltered: wasAutoFiltered,
          product: formatProduct(updated)
        });
      }
    }

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

    // Automatic Category Filter check on update if title/description changed and not forced
    let wasAutoFiltered = false;
    if (!req.body.forceCategory && (req.body.title || req.body.description || req.body.category)) {
      const classification = classifyProduct({
        title: product.title,
        description: product.description,
        brand: product.brand,
        tags: product.tags,
        currentCategory: product.category
      });
      if (classification.isMismatch && classification.confidence >= 0.35 && classification.category) {
        product.originalCategory = product.category;
        product.category = classification.category;
        if (classification.subcategory) product.subcategory = classification.subcategory;
        product.autoFiltered = true;
        wasAutoFiltered = true;
      }
    }

    await product.save();

    let updateMsg = "Listing updated successfully.";
    if (wasAutoFiltered) {
      updateMsg += ` (Auto-Filtered category to "${product.category}")`;
    }

    res.json({
      success: true,
      message: updateMsg,
      autoFiltered: wasAutoFiltered,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Classify product text for real-time category detection
// @route   POST /api/products/classify
export const classifyProductEndpoint = async (req, res, next) => {
  try {
    const { title, description, brand, tags, currentCategory } = req.body;
    const result = classifyProduct({
      title: title || "",
      description: description || "",
      brand: brand || "",
      tags: tags || [],
      currentCategory: currentCategory || ""
    });
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from("products")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (existing) {
        if (String(existing.seller_id) !== String(req.user._id) && req.user.role !== "ADMIN") {
          return res.status(403).json({ success: false, message: "Not authorized to delete this listing." });
        }

        await supabase.from("products").delete().eq("id", req.params.id);
        return res.json({
          success: true,
          message: "Product listing deleted successfully."
        });
      }
    }

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

    if (isSupabaseConfigured) {
      const { data: existing } = await supabase
        .from("products")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (existing) {
        if (String(existing.seller_id) !== String(req.user._id) && req.user.role !== "ADMIN") {
          return res.status(403).json({ success: false, message: "Not authorized to change listing status." });
        }

        const { data: updated, error: updateErr } = await supabase
          .from("products")
          .update({ status, updated_at: new Date() })
          .eq("id", req.params.id)
          .select("*, seller:users(*)")
          .single();

        if (updateErr) throw new Error(updateErr.message);

        return res.json({
          success: true,
          message: `Product marked as ${status}.`,
          product: formatProduct(updated)
        });
      }
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