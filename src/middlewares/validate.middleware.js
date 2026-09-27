import ApiError from "../utils/ApiError.js";

/**
 * @param {import('joi').Schema} schema
 * @param {"body"|"params"|"query"} source
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    return next(new ApiError(400, "Validation failed", details));
  }

  req[source] = value;
  next();
};

export default validate;
