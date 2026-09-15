import { app } from "../server/server.js";
import { connectDB } from "../server/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("[Vercel DB Connection Error]:", err.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please try again shortly."
    });
  }

  // If Vercel stripped /api from req.url, add it back so Express route handlers match
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }

  return new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", reject);
    app(req, res);
  });
}
