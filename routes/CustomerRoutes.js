// backend/routes/customers.js
import express from "express";
import db from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🟢 GET Customers - all roles (admin, editor, viewer)                        */
/* -------------------------------------------------------------------------- */
router.get("/", verifyToken, authorizeRoles("admin", "editor", "viewer"), async (req, res) => {
    const { search = "" } = req.query;

    try {
        const result = await db.query(
            `SELECT id, name, email, phone, created_at
       FROM customers
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY id ASC`,
            [`%${search}%`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error fetching customers:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🟡 POST Add New Customer - only admin, editor                              */
/* -------------------------------------------------------------------------- */
router.post("/", verifyToken, authorizeRoles("admin", "editor"), async (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const result = await db.query(
            `INSERT INTO customers (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [name, email, phone]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ Error adding customer:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🟠 PUT Update Customer - only admin                                        */
/* -------------------------------------------------------------------------- */
router.put("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    try {
        const result = await db.query(
            `UPDATE customers
       SET name=$1, email=$2, phone=$3
       WHERE id=$4
       RETURNING *`,
            [name, email, phone, id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Customer not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Error updating customer:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE Customer - only admin                                            */
/* -------------------------------------------------------------------------- */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query("DELETE FROM customers WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Customer not found" });

        res.json({ message: "Customer deleted successfully", customer: result.rows[0] });
    } catch (err) {
        console.error("❌ Error deleting customer:", err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
