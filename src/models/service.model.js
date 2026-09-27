import mongoose from "mongoose";

// This collection is a synced CACHE of the pricing source (Google Sheet / CSV).
// It is not hand-edited; pricing.service.js overwrites it on each sync.
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    aliases: [{ type: String }], // alt names to help fuzzy matching
    unitPricePaise: { type: Number, required: true },
    unit: { type: String, default: "each" }, // e.g. "each", "hour", "page"
    category: { type: String, default: null },
    sourceRow: { type: Number, default: null }, // row number in sheet, for traceability
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
