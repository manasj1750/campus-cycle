import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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
    agreedPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Completed", "Cancelled"],
      default: "Completed"
    },
    exchangeLocation: {
      type: String,
      default: "Main Campus"
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);