import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary if credentials are provided
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("[Storage] Cloudinary configured successfully.");
} else {
  console.log("[Storage] Cloudinary credentials not detected; using local static storage fallback.");
}

export const uploadImage = async (file, folder = "campuscycle") => {
  if (hasCloudinary && file.path) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: "auto"
      });
      // remove temp local file if created
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (err) {
      console.warn("[Cloudinary] Upload failed, falling back to local file:", err.message);
    }
  }

  // Fallback: If no Cloudinary, read the file into a base64 data URI
  // This ensures images persist reliably on serverless (Vercel) and don't break
  if (file.path && fs.existsSync(file.path)) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || "image/jpeg";
      const base64 = fileBuffer.toString("base64");
      // Clean up temp file
      try {
        fs.unlinkSync(file.path);
      } catch (cleanErr) {}
      return `data:${mimeType};base64,${base64}`;
    } catch (err) {
      console.error("[Storage] Error converting file to base64:", err.message);
    }
  }

  // Fallback if filename exists and SERVER_URL is defined
  if (file.filename && process.env.SERVER_URL) {
    return `${process.env.SERVER_URL}/uploads/${file.filename}`;
  }

  return "";
};