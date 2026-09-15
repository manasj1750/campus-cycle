import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { Product } from "./models/Product.js";
import { runSeed } from "./utils/seed.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// Setup Socket.IO
const CLIENT_ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_ORIGIN, "http://127.0.0.1:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

// Store io instance for route controllers
app.set("io", io);

// Socket.IO real-time event wiring
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`[Socket.IO] User ${userId} joined their personal notification/chat room`);
    }
  });

  socket.on("send_message", (data) => {
    if (data.receiverId) {
      io.to(String(data.receiverId)).emit("new_message", data);
    }
  });

  socket.on("typing", (data) => {
    if (data.receiverId) {
      io.to(String(data.receiverId)).emit("user_typing", data);
    }
  });

  socket.on("disconnect", () => {
    // client disconnected
  });
});

app.set("trust proxy", 1);

// Ensure synthetic socket object has remoteAddress in serverless environments
app.use((req, res, next) => {
  if (!req.socket) {
    req.socket = {};
  }
  if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "127.0.0.1";
  }
  if (typeof req.socket.destroy !== "function") {
    req.socket.destroy = () => {};
  }
  next();
});

// Security & Utility Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
  app.use(morgan("dev"));
}

// Gentle Rate Limiter for general endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  validate: false,
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
  },
  message: { success: false, message: "Too many requests from this IP, please try again later." }
});
app.use("/api", limiter);

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "CampusCycle API",
    tagline: "Give Your Things a Second Life",
    timestamp: new Date().toISOString()
  });
});

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Serve static client build (Single unified website)
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// For all non-API/uploads routes, send index.html (SPA client-side routing)
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// 404 & Error Handlers for unhandled API routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("[CampusCycle] Initializing complete seed dataset...");
      await runSeed(false);
    }

    httpServer.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 CampusCycle Server running on port ${PORT}`);
      console.log(`🌱 Tagline: Give Your Things a Second Life.`);
      console.log(`📡 REST API endpoint: http://localhost:${PORT}/api`);
      console.log(`💬 Socket.IO real-time engine active`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error("Fatal: Failed to start server:", error.message);
    process.exit(1);
  }
};

const isServerless =
  process.env.VERCEL === "1" ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.NOW_REGION ||
  !!process.env.VERCEL_ENV;

if (!isServerless && process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, httpServer };