import mongoose from "mongoose";

// Review Model
const reviewSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: ""
    }
  },
  { timestamps: true }
);
reviewSchema.index({ seller: 1, buyer: 1, product: 1 }, { unique: true });
export const Review = mongoose.model("Review", reviewSchema);