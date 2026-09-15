import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Offer must be greater than zero"]
    },
    counterAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Countered", "Expired"],
      default: "Pending"
    },
    message: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

offerSchema.index({ product: 1, buyer: 1 });
offerSchema.index({ seller: 1 });

export const Offer = mongoose.model("Offer", offerSchema);