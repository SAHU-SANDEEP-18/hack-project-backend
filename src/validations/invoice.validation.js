import Joi from "joi";

export const generateInvoiceSchema = Joi.object({
  message: Joi.string().min(5).max(3000).required().messages({
    "string.min": "Message is too short to extract invoice details from",
    "any.required": "Customer message is required",
  }),
});

const lineItemUpdateSchema = Joi.object({
  _id: Joi.string().hex().length(24).optional(),
  requestedText: Joi.string().required(),
  matchedService: Joi.string().allow(null),
  quantity: Joi.number().integer().min(1).required(),
  unitPricePaise: Joi.number().integer().min(0).allow(null),
  matchStatus: Joi.string().valid("matched", "ambiguous", "not_found"),
  candidates: Joi.array().items(Joi.string()),
});

export const updateInvoiceSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().allow(null, ""),
    email: Joi.string().email({ tlds: false }).allow(null, ""),
    phone: Joi.string().allow(null, ""),
  }),
  items: Joi.array().items(lineItemUpdateSchema).min(1),
  notes: Joi.string().allow(null, ""),
  taxRatePercent: Joi.number().min(0).max(100),
}).min(1);
