import mongoose from "mongoose";
import { INVOICE_STATUS, ITEM_MATCH_STATUS } from "../constants/status.constants.js";

const lineItemSchema = new mongoose.Schema(
  {
    requestedText: { type: String, required: true },     // what customer wrote
    matchedService: { type: String, default: null },      // exact catalog name, if any
    quantity: { type: Number, default: 1, min: 1 },
    unitPricePaise: { type: Number, default: null },       // null until matched/edited
    lineTotalPaise: { type: Number, default: 0 },
    matchStatus: {
      type: String,
      enum: Object.values(ITEM_MATCH_STATUS),
      default: ITEM_MATCH_STATUS.NOT_FOUND,
    },
    candidates: [{ type: String }], // suggested names when ambiguous
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.DRAFT,
    },

    rawMessage: { type: String, required: true },
    aiProviderUsed: { type: String, default: null }, // "mistral" | "groq"

    customer: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
    },

    items: [lineItemSchema],
    notes: { type: String, default: null },

    subtotalPaise: { type: Number, default: 0 },
    taxRatePercent: { type: Number, default: 18 },
    taxAmountPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, default: 0 },

    warnings: [{ type: String }], // e.g. "Customer email missing", "2 items need review"

    approvedAt: { type: Date, default: null },
    exportedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
