import { app } from "../server/server.js";
import { connectDB } from "../server/config/db.js";

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error("[Vercel] DB connect error:", err.message);
    }
  }
  return app(req, res);
}
