import Service from "../models/service.model.js";

const serviceDao = {
  findAll: () => Service.find({}),

  findByName: (name) =>
    Service.findOne({ name: new RegExp(`^${name}$`, "i") }),

  findById: (id) => Service.findById(id),

  create: (data) => Service.create(data),

  updateById: (id, data) =>
    Service.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: (id) => Service.findByIdAndDelete(id),

  /**
   * Replaces the entire catalog with fresh rows from the pricing source.
   * Used by pricing.service.js after fetching the Google Sheet / CSV.
   */
  bulkReplace: async (rows) => {
    await Service.deleteMany({});
    if (!rows.length) return [];
    return Service.insertMany(rows);
  },

  countAll: () => Service.countDocuments({}),
};

export default serviceDao;
