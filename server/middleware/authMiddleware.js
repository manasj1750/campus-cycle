import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { formatUser, isUUID } from "../config/supabaseAdapter.js";

const JWT_SECRET = process.env.JWT_SECRET || "campuscycle_super_secret_jwt_key_2026";

// Reliably resolve a user from Supabase (by UUID or email) with Mongo fallback
export const resolveUserFromToken = async (decodedId) => {
  let user = null;

  // 1. If decodedId is a valid UUID, look up directly in Supabase
  if (isSupabaseConfigured && isUUID(decodedId)) {
    const { data } = await supabase.from("users").select("*").eq("id", decodedId).maybeSingle();
    if (data) {
      user = formatUser(data);
    }
  }

  // 2. If not found or decodedId is a legacy MongoDB ObjectId (24 hex characters)
  if (!user) {
    try {
      const mongoUser = await User.findById(decodedId).select("-password");
      if (mongoUser) {
        // If Supabase is active, find the matching user in Supabase by email
        if (isSupabaseConfigured && mongoUser.email) {
          const { data: supaUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", mongoUser.email.toLowerCase().trim())
            .maybeSingle();

          if (supaUser) {
            user = formatUser(supaUser);
          } else {
            // Auto-migrate legacy user record into Supabase so future queries work seamlessly
            const { data: newSupa } = await supabase
              .from("users")
              .insert({
                name: mongoUser.name,
                email: mongoUser.email.toLowerCase().trim(),
                password: mongoUser.password || "$2a$10$defaultHashForLegacySync",
                college: mongoUser.college || "Asian School of Business",
                student_id: mongoUser.studentId || "",
                department: mongoUser.department || "BCA",
                year: mongoUser.year || "3rd Year",
                role: mongoUser.role || "USER",
                profile_photo: mongoUser.profilePhoto || "",
                bio: mongoUser.bio || "",
                location: mongoUser.location || "Main Campus",
                is_verified: mongoUser.isVerified !== undefined ? mongoUser.isVerified : true
              })
              .select()
              .maybeSingle();

            if (newSupa) {
              user = formatUser(newSupa);
            }
          }
        }

        if (!user) {
          user = mongoUser;
        }
      }
    } catch (e) {
      // Ignore if not a valid Mongo ObjectId
    }
  }

  return user;
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await resolveUserFromToken(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User account no longer exists." });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account is suspended. Reason: ${user.suspensionReason || "Violation of campus community guidelines"}`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await resolveUserFromToken(decoded.id);

      if (user && !user.isSuspended) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin privileges required." });
  }
  next();
};

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d"
  });
};