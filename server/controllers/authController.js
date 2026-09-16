import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { VerificationCode } from "../models/VerificationCode.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { Product } from "../models/Product.js";
import { Wishlist } from "../models/Wishlist.js";
import { Review } from "../models/Review.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatUser } from "../config/supabaseAdapter.js";

// In-memory fallback for verification codes (ensures email verification works even without MongoDB)
const memoryCodes = new Map();

// @desc    Register a new student/user
// @desc    Generate and send a 6-digit email verification code for account registration
// @route   POST /api/auth/send-verification-code
export const sendVerificationCode = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email format is valid
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Check if already registered (Supabase & Mongo)
    if (isSupabaseConfigured) {
      const { data: supaUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (supaUser) {
        return res.status(400).json({
          success: false,
          message: "An account with this email address already exists. Please log in instead."
        });
      }
    } else {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "An account with this email address already exists. Please log in instead."
        });
      }
    }

    // Generate secure random 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in memory
    memoryCodes.set(cleanEmail, { code, expiresAt });

    // Also attempt MongoDB storage if available
    try {
      await VerificationCode.deleteMany({ email: cleanEmail });
      await VerificationCode.create({
        email: cleanEmail,
        code,
        expiresAt
      });
    } catch (e) {
      // ignore if Mongo is offline
    }

    // Send email dispatch
    const emailRes = await sendVerificationEmail({
      to: cleanEmail,
      name: name || "",
      code
    });

    if (!emailRes.sent) {
      memoryCodes.delete(cleanEmail);
      try {
        await VerificationCode.deleteMany({ email: cleanEmail });
      } catch (e) {}
      return res.status(500).json({
        success: false,
        message: emailRes.error || "Could not dispatch verification email. Please verify the email address or contact support."
      });
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
      expiresIn: "10 minutes"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new student/user with mandatory verification code
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, college, studentId, department, year, verificationCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    if (!verificationCode || !verificationCode.trim()) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit email verification code." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = verificationCode.trim();

    // Verify code: check memoryCodes first, then Mongo
    let isValidCode = false;
    const memRecord = memoryCodes.get(cleanEmail);
    if (memRecord && memRecord.code === cleanCode) {
      if (new Date() <= new Date(memRecord.expiresAt)) {
        isValidCode = true;
      }
    }

    if (!isValidCode) {
      try {
        const record = await VerificationCode.findOne({
          email: cleanEmail,
          code: cleanCode
        });
        if (record && new Date() <= new Date(record.expiresAt)) {
          isValidCode = true;
        }
      } catch (e) {}
    }

    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new code."
      });
    }

    // Clean up used code
    memoryCodes.delete(cleanEmail);
    try {
      await VerificationCode.deleteMany({ email: cleanEmail });
    } catch (e) {}

    // Supabase Path
    if (isSupabaseConfigured) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, message: "A user with this email address already exists." });
      }

      // Count users to determine role
      const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
      const role = count === 0 ? "ADMIN" : "USER";

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            college: college || "Asian School of Business",
            student_id: studentId || "",
            department: department || "",
            year: year || "1st Year",
            role,
            is_verified: true
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const formatted = formatUser(newUser);
      const token = generateToken(formatted._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax"
      });

      return res.status(201).json({
        success: true,
        message: "Account created and verified successfully.",
        token,
        user: formatted
      });
    }

    // Fallback to MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email address already exists." });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      college: college || "Asian School of Business",
      studentId: studentId || "",
      department: department || "",
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
      message: "Account created and verified successfully.",
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

    const cleanEmail = email.toLowerCase().trim();

    // Supabase Path
    if (isSupabaseConfigured) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (userRecord) {
        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        if (userRecord.is_suspended) {
          return res.status(403).json({
            success: false,
            message: `Account is suspended. Reason: ${userRecord.suspension_reason || "Violation of campus marketplace terms."}`
          });
        }

        const formatted = formatUser(userRecord);
        const token = generateToken(formatted._id);

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: "lax"
        });

        return res.json({
          success: true,
          message: "Logged in successfully.",
          token,
          user: formatted
        });
      }
    }

    // Fallback to MongoDB
    const user = await User.findOne({ email: cleanEmail }).select("+password");

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
    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (user) {
        const [activeRes, soldRes, wishlistRes, reviewsRes] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", userId).in("status", ["AVAILABLE", "APPROVED"]),
          supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", userId).eq("status", "SOLD"),
          supabase.from("wishlists").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("reviews").select("rating").eq("seller_id", userId)
        ]);

        const activeListings = activeRes.count || 0;
        const soldItems = soldRes.count || 0;
        const wishlistCount = wishlistRes.count || 0;
        const reviews = reviewsRes.data || [];

        const avgRating = reviews.length
          ? Number((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1))
          : 5.0;

        const formatted = formatUser(user);
        return res.json({
          success: true,
          user: {
            ...formatted,
            stats: {
              activeListings,
              soldItems,
              wishlistCount,
              totalReviews: reviews.length,
              avgRating
            }
          }
        });
      }
    }

    const user = await User.findById(userId);
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
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1))
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
    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured) {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (bio !== undefined) updateData.bio = bio;
      if (college !== undefined) updateData.college = college.trim();
      if (department !== undefined) updateData.department = department.trim();
      if (year !== undefined) updateData.year = year.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (profilePhoto !== undefined) updateData.profile_photo = profilePhoto;
      updateData.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (!error && updated) {
        return res.json({
          success: true,
          message: "Profile updated successfully.",
          user: formatUser(updated)
        });
      }
    }

    const user = await User.findById(userId);
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

// @desc    Change / edit account password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide both current and new passwords." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    const userId = req.user._id || req.user.id;

    if (isSupabaseConfigured) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (user) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: "Incorrect current password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error } = await supabase
          .from("users")
          .update({ password: hashedPassword, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (error) {
          throw new Error(error.message);
        }

        return res.json({
          success: true,
          message: "Password updated successfully!"
        });
      }
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully!"
    });
  } catch (error) {
    next(error);
  }
};