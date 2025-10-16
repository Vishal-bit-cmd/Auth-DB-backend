// backend/routes/KPIRoutes.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Total sales of delivered
router.get("/total-sales", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT COALESCE(SUM(oi.quantity * oi.price),0) AS total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'delivered'
    `);
        res.json({ total_sales: parseFloat(result.rows[0].total_sales) });
    } catch (err) {
        console.error("Error fetching total sales:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Total orders
router.get("/total-orders", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT COUNT(*) AS total_orders
      FROM orders
    `);
        res.json({ total_orders: parseInt(result.rows[0].total_orders) });
    } catch (err) {
        console.error("Error fetching total orders:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Total customers
router.get("/total-customers", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT COUNT(*) AS total_customers
      FROM customers
    `);
        res.json({ total_customers: parseInt(result.rows[0].total_customers) });
    } catch (err) {
        console.error("Error fetching total customers:", err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
