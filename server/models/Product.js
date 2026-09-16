import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"]
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Original price cannot be negative"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    subcategory: {
      type: String,
      default: "",
      trim: true
    },
    condition: {
      type: String,
      enum: ["Like New", "Excellent", "Good", "Fair", "Needs Repair"],
      required: [true, "Condition is required"]
    },
    brand: {
      type: String,
      default: "",
      trim: true
    },
    model: {
      type: String,
      default: "",
      trim: true
    },
    purchaseYear: {
      type: Number
    },
    images: {
      type: [String],
      validate: [val => val.length > 0, "At least one product image is required"]
    },
    primaryImage: {
      type: String,
      default: ""
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    location: {
      type: String,
      enum: ["Hostel", "Main Campus", "Library", "Department", "Student Center", "Club Office", "Cafeteria", "Sports Complex", "Other"],
      default: "Main Campus"
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isNegotiable: {
      type: Boolean,
      default: true
    },
    contactPreference: {
      type: String,
      default: "In-App Chat"
    },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "AVAILABLE", "RESERVED", "SOLD"],
      default: "AVAILABLE"
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    autoFiltered: {
      type: Boolean,
      default: false
    },
    originalCategory: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Search indexes
productSchema.index({
  title: "text",
  description: "text",
  brand: "text",
  tags: "text",
  category: "text",
  subcategory: "text"
});

productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ createdAt: -1 });

// Ensure primaryImage is always set
productSchema.pre("save", function (next) {
  if (!this.primaryImage && this.images && this.images.length > 0) {
    this.primaryImage = this.images[0];
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);