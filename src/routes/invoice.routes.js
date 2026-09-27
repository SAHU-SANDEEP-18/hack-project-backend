import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../validations/common.validation.js";
import { generateInvoiceSchema, updateInvoiceSchema } from "../validations/invoice.validation.js";
import {
  generateInvoice,
  getInvoice,
  updateInvoice,
  approveInvoiceHandler,
  downloadInvoicePdf,
  listInvoicesHandler,
} from "../controllers/invoice.controller.js";

const router = Router();

router.post("/generate", validate(generateInvoiceSchema), generateInvoice);
router.get("/", listInvoicesHandler);
router.get("/:id", validate(objectIdParamSchema, "params"), getInvoice);
router.patch(
  "/:id",
  validate(objectIdParamSchema, "params"),
  validate(updateInvoiceSchema),
  updateInvoice
);
router.post("/:id/approve", validate(objectIdParamSchema, "params"), approveInvoiceHandler);
router.get("/:id/pdf", validate(objectIdParamSchema, "params"), downloadInvoicePdf);

export default router;
