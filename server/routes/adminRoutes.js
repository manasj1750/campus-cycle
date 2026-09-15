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
  updateReportStatus
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:id/suspend", toggleSuspendUser);
router.delete("/users/:id", deleteUser);

router.get("/products", getAdminProducts);
router.patch("/products/:id/approve", approveProduct);
router.patch("/products/:id/reject", rejectProduct);
router.patch("/products/:id/feature", toggleFeatureProduct);

router.get("/reports", getAdminReports);
router.patch("/reports/:id", updateReportStatus);

export default router;