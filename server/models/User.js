import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    college: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
      default: "Campus Institute of Technology"
    },
    studentId: {
      type: String,
      trim: true,
      default: ""
    },
    department: {
      type: String,
      trim: true,
      default: "Computer Science"
    },
    year: {
      type: String,
      trim: true,
      default: "3rd Year"
    },
    profilePhoto: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: ""
    },
    location: {
      type: String,
      default: "Main Campus"
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    suspensionReason: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);