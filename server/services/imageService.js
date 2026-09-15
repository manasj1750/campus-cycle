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

  // Fallback: return accessible server URL for static uploads
  if (file.filename) {
    const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${baseUrl}/uploads/${file.filename}`;
  }

  return "";
};