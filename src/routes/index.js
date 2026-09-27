import { Router } from "express";
import invoiceRoutes from "./invoice.routes.js";
import pricingRoutes from "./pricing.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/pricing", pricingRoutes);

export default router;
