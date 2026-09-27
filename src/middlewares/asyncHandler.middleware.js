// Wraps an async controller fn so rejected promises are forwarded to errorHandler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
