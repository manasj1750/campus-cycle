import mongoose from "mongoose";

// ProductView
const productViewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: { type: String, default: "" },
    viewedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
export const ProductView = mongoose.model("ProductView", productViewSchema);

// SearchHistory
const searchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    query: { type: String, required: true },
    category: { type: String, default: "" }
  },
  { timestamps: true }
);
export const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);

// AdminAction
const adminActionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actionType: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    details: { type: String, default: "" }
  },
  { timestamps: true }
);
export const AdminAction = mongoose.model("AdminAction", adminActionSchema);