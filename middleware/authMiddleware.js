// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "visjwt@96";

/* -------------------------------------------------------------------------- */
/* 🟢 VERIFY TOKEN (reads from cookie instead of header)                       */
/* -------------------------------------------------------------------------- */
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: "Access token missing. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to req
    next();
  } catch (err) {
    console.error("❌ Token verification error:", err);

    // Handle expired tokens separately
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired" });
    }

    res.status(403).json({ error: "Invalid token" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🔒 ROLE AUTHORIZATION                                                      */
/* -------------------------------------------------------------------------- */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient privileges." });
    }
    next();
  };
};
