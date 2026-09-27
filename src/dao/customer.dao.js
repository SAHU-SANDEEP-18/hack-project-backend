import Customer from "../models/customer.model.js";

const customerDao = {
  findByEmail: (email) => (email ? Customer.findOne({ email }) : null),

  upsertByEmail: async ({ name, email, phone }) => {
    if (!email) return null;
    return Customer.findOneAndUpdate(
      { email },
      { $set: { name, phone }, $inc: { invoiceCount: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },
};

export default customerDao;
