import { User } from "../models/User.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { Product } from "../models/Product.js";
import { Wishlist } from "../models/Wishlist.js";
import { Review } from "../models/Review.js";

// @desc    Register a new student/user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, college, studentId, department, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email address already exists." });
    }

    // First registered account can automatically be ADMIN if none exists
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college || "Campus Institute of Technology",
      studentId: studentId || "",
      department: department || "General Studies",
      year: year || "1st Year",
      role,
      isVerified: true
    });

    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax"
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide an email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account is suspended. Reason: ${user.suspensionReason || "Violation of campus marketplace terms."}`
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax"
    });

    res.json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: "Logged out successfully." });
};

// @desc    Get current user profile & statistics
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [activeListings, soldItems, wishlistCount, reviews] = await Promise.all([
      Product.countDocuments({ seller: user._id, status: { $in: ["AVAILABLE", "APPROVED"] } }),
      Product.countDocuments({ seller: user._id, status: "SOLD" }),
      Wishlist.countDocuments({ user: user._id }),
      Review.find({ seller: user._id })
    ]);

    const avgRating = reviews.length
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified,
        stats: {
          activeListings,
          soldItems,
          wishlistCount,
          totalReviews: reviews.length,
          avgRating
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, college, department, year, location, profilePhoto } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio;
    if (college) user.college = college.trim();
    if (department) user.department = department.trim();
    if (year) user.year = year.trim();
    if (location) user.location = location.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mock password reset request
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide an email address." });
  }
  res.json({
    success: true,
    message: "If that email exists in our campus records, a password reset link has been dispatched."
  });
};

// @desc    Mock password reset fulfillment
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  res.json({
    success: true,
    message: "Password has been successfully updated. You may now log in."
  });
};