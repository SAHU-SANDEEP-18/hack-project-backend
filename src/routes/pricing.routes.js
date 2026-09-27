import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../validations/common.validation.js";
import { createServiceSchema, updateServiceSchema } from "../validations/pricing.validation.js";
import {
  syncPricing,
  getCatalog,
  createService,
  updateService,
  deleteService,
} from "../controllers/pricing.controller.js";

const router = Router();

// Read current catalog (DB-backed, includes manual UI edits)
router.get("/", getCatalog);

// Explicitly re-import from Google Sheet / CSV — OVERWRITES manual edits, use with care
router.post("/sync", syncPricing);

// Manual catalog management from the frontend "Manage Prices" UI
router.post("/services", validate(createServiceSchema), createService);
router.patch(
  "/services/:id",
  validate(objectIdParamSchema, "params"),
  validate(updateServiceSchema),
  updateService
);
router.delete("/services/:id", validate(objectIdParamSchema, "params"), deleteService);

export default router;
