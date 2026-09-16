import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadImages,
  classifyProductEndpoint
} from "../controllers/productController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getProducts);
router.post("/classify", classifyProductEndpoint);
router.get("/:id", optionalAuth, getProductById);
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);
router.patch("/:id/status", protect, updateProductStatus);
router.post("/upload-images", protect, upload.array("images", 5), uploadImages);

export default router;