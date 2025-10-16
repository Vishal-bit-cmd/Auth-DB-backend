// routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "visjwt@96";

/* ----------------------------- LOGIN ----------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (userResult.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = userResult.rows[0];

    if (!user.password_hash)
      return res
        .status(500)
        .json({ error: "User has no password set. Contact admin." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const payload = { id: user.id, role: user.role };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true in production (HTTPS)
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------- REGISTER ----------------------------- */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'viewer') RETURNING id, username, email, role",
      [username, email, hashed]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------- PROFILE (from cookie) ----------------------------- */
router.get("/profile", async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "No access token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id=$1",
      [decoded.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Profile error:", err);

    // Handle expired token — try to refresh automatically
    if (err.name === "TokenExpiredError") {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        return res.status(401).json({ error: "Session expired, please log in again" });

      try {
        const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET);
        const newAccessToken = jwt.sign(
          { id: decodedRefresh.id, role: decodedRefresh.role },
          JWT_SECRET,
          { expiresIn: "15m" }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 15 * 60 * 1000,
        });

        const result = await pool.query(
          "SELECT id, username, email, role, created_at FROM users WHERE id=$1",
          [decodedRefresh.id]
        );

        return res.json(result.rows[0]);
      } catch (refreshErr) {
        return res.status(403).json({ error: "Invalid refresh token" });
      }
    }

    res.status(403).json({ error: "Invalid or expired token" });
  }
});

/* ----------------------------- REFRESH ----------------------------- */
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error("❌ Refresh token error:", err);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

/* ----------------------------- LOGOUT ----------------------------- */
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

export default router;
