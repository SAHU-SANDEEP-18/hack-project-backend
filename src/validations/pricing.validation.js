import Joi from "joi";

export const createServiceSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Service name is required",
    "string.empty": "Service name cannot be empty",
  }),
  price: Joi.number().min(0).required().messages({
    "any.required": "Price is required",
    "number.min": "Price must be a non-negative number",
  }),
  unit: Joi.string().trim().allow("", null).default("each"),
  category: Joi.string().trim().allow("", null).default(null),
  aliases: Joi.array().items(Joi.string().trim()).default([]),
});

export const updateServiceSchema = Joi.object({
  name: Joi.string().trim(),
  price: Joi.number().min(0),
  unit: Joi.string().trim().allow("", null),
  category: Joi.string().trim().allow("", null),
  aliases: Joi.array().items(Joi.string().trim()),
}).min(1);
