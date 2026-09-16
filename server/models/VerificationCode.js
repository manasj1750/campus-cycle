import mongoose from "mongoose";

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, "Verification code is required"],
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index: MongoDB will automatically remove document when expiresAt timestamp arrives
    }
  },
  {
    timestamps: true
  }
);

export const VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);
