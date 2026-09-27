import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: null, index: true },
    phone: { type: String, default: null },
    invoiceCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
