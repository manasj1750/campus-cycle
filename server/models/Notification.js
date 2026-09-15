import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    type: {
      type: String,
      enum: [
        "MESSAGE",
        "OFFER",
        "OFFER_ACCEPTED",
        "OFFER_REJECTED",
        "OFFER_COUNTERED",
        "LISTING_APPROVED",
        "LISTING_REJECTED",
        "PRODUCT_SOLD",
        "REPORT_UPDATE",
        "SYSTEM"
      ],
      default: "SYSTEM"
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: ""
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
export const Notification = mongoose.model("Notification", notificationSchema);