// backend/routes/orders.js
import express from "express";
import db from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();   

/* -------------------------------------------------------------------------- */
/* 🟢 GET Orders - all authenticated users (admin, editor, viewer)            */
/* -------------------------------------------------------------------------- */
router.get("/", verifyToken, authorizeRoles("admin", "editor", "viewer"), async (req, res) => {
    const { search = "", status = "" } = req.query;

    try {
        let baseQuery = `
            SELECT o.order_id, o.status, o.created_at,
                   c.name AS customer_name, c.email AS customer_email,
                   COALESCE(SUM(oi.quantity * oi.price), 0) AS total
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            WHERE 1=1
        `;
        const params = [];

        // Search filter
        if (search) {
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            baseQuery += ` AND (
                CAST(o.order_id AS TEXT) ILIKE $${params.length - 2} OR
                c.name ILIKE $${params.length - 1} OR
                c.email ILIKE $${params.length}
            )`;
        }

        // Status filter
        if (status) {
            params.push(status);
            baseQuery += ` AND o.status = $${params.length}`;
        }

        baseQuery += ` GROUP BY o.order_id, c.name, c.email ORDER BY o.created_at DESC`;

        const result = await db.query(baseQuery, params);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🟡 POST Create Order - only admin, editor                                  */
/* -------------------------------------------------------------------------- */
router.post("/", verifyToken, authorizeRoles("admin", "editor"), async (req, res) => {
    const { customer_id, status, total } = req.body;

    if (!customer_id || !status || !total)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const result = await db.query(
            `INSERT INTO orders (customer_id, status, total, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [customer_id, status, total]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ Error creating order:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🟠 PUT Update Order - only admin, editor                                   */
/* -------------------------------------------------------------------------- */
router.put("/:id", verifyToken, authorizeRoles("admin", "editor"), async (req, res) => {
    const { id } = req.params;
    const { status, total } = req.body;

    try {
        const result = await db.query(
            `UPDATE orders 
       SET status = $1, total = $2 
       WHERE order_id = $3 
       RETURNING *`,
            [status, total, id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Order not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Error updating order:", err);
        res.status(500).json({ error: "Database error" });
    }
});

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE Order - only admin                                               */
/* -------------------------------------------------------------------------- */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query("DELETE FROM orders WHERE order_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Order not found" });

        res.json({ message: "Order deleted successfully", order: result.rows[0] });
    } catch (err) {
        console.error("❌ Error deleting order:", err);
        res.status(500).json({ error: "Database error" });
    }
});

router

export default router;
