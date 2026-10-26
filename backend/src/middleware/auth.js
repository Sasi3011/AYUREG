const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Authentication required", "UNAUTHENTICATED"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token", "UNAUTHENTICATED"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required", "UNAUTHENTICATED"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN"));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
