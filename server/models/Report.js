import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reportedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reason: {
      type: String,
      enum: [
        "Scam",
        "Fake Product",
        "Inappropriate Content",
        "Wrong Category",
        "Prohibited Product",
        "Duplicate Listing",
        "Suspicious Activity",
        "Other"
      ],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ["Pending", "Investigating", "Resolved", "Dismissed"],
      default: "Pending"
    },
    adminNotes: {
      type: String,
      default: ""
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);