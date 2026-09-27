import Joi from "joi";

export const objectIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid invoice id format",
    "string.length": "Invalid invoice id format",
  }),
});
