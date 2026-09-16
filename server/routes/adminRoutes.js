import express from "express";
import {
  getAdminStats,
  getAdminUsers,
  toggleSuspendUser,
  deleteUser,
  getAdminProducts,
  approveProduct,
  rejectProduct,
  toggleFeatureProduct,
  getAdminReports,
  updateReportStatus,
  updateAdminCredentials,
  autoCategorizeAllProducts
} from "../controllers/adminController.js";
import { deleteProduct } from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:id/suspend", toggleSuspendUser);
router.delete("/users/:id", deleteUser);

router.get("/products", getAdminProducts);
router.post("/products/auto-categorize-all", autoCategorizeAllProducts);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/approve", approveProduct);
router.patch("/products/:id/reject", rejectProduct);
router.patch("/products/:id/feature", toggleFeatureProduct);

router.get("/reports", getAdminReports);
router.patch("/reports/:id", updateReportStatus);
router.patch("/credentials", updateAdminCredentials);

export default router;