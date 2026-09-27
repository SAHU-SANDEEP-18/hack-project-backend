import Invoice from "../models/invoice.model.js";

const invoiceDao = {
  create: (data) => Invoice.create(data),

  findById: (id) => Invoice.findById(id),

  findByInvoiceNumber: (invoiceNumber) => Invoice.findOne({ invoiceNumber }),

  updateById: (id, update) =>
    Invoice.findByIdAndUpdate(id, update, { new: true, runValidators: true }),

  list: ({ status, page = 1, limit = 20 } = {}) => {
    const filter = status ? { status } : {};
    return Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  },

  count: (filter = {}) => Invoice.countDocuments(filter),

  deleteById: (id) => Invoice.findByIdAndDelete(id),
};

export default invoiceDao;
