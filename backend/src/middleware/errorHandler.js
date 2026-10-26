class ApiError extends Error {
  constructor(status, message, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, "Resource not found", "NOT_FOUND"));
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: { message: err.message || "Internal server error", code } });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
