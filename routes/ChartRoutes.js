import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Top Products by Sales
router.get("/sales-by-product", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT p.name AS product_name,
             SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.name
      ORDER BY total_sales DESC
      LIMIT 5
    `);
        res.json(result.rows);
    } catch (err) {
        console.error("Sales by product error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Sales by Category (Pie Chart)
router.get("/sales-by-category", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.name AS category_name,
             SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.name
      ORDER BY total_sales DESC
    `);
        res.json(result.rows);
    } catch (err) {
        console.error("Sales by category error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Top Customers by Spending
router.get("/top-customers", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT cu.name AS customer_name,
             SUM(oi.quantity * oi.price) AS total_spent
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN customers cu ON cu.id = o.customer_id
      GROUP BY cu.name
      ORDER BY total_spent DESC
      LIMIT 5
    `);
        res.json(result.rows);
    } catch (err) {
        console.error("Top customers error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
