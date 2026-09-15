import { app } from "../server/server.js";
import { connectDB } from "../server/config/db.js";

let isConnected = false;

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("[Vercel] DB connect error:", err.message);
  }

  // If Vercel stripped /api from req.url, add it back so Express route handlers match
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }

  return app(req, res);
}
