import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* 🟢 VIEW USERS — Admin only */
router.get("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { search = "", role = "" } = req.query;

  try {
    let query = `
      SELECT id, username, email, role, created_at
      FROM users
      WHERE (username ILIKE $1 OR email ILIKE $1)
    `;
    const params = [`%${search}%`];

    if (role) {
      query += " AND role = $2";
      params.push(role);
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* 🟡 CREATE USER — Admin only */
router.post("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at",
      [username, email, hashed, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* 🟠 UPDATE USER — Admin only */
router.put("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET username=$1, email=$2, role=$3 WHERE id=$4 RETURNING id, username, email, role, created_at",
      [username, email, role, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* 🔴 DELETE USER — Admin only */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
