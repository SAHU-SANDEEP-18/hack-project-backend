import logger from "../utils/logger.js";
import ApiError from "../utils/ApiError.js";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || "Internal Server Error");
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${error.message}\n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${error.message}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    details: error.details || undefined,
  });
};

export default errorHandler;
