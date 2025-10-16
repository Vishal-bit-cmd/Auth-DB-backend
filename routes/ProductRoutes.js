// backend/routes/products.js
import express from "express";
import db from "../config/db.js";
import path from "path";
import multer from "multer";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Serve image URLs from uploads folder
const BASE_URL = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/uploads/`
  : "http://localhost:5000/uploads/";

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* -------------------------------------------------------------------------- */
/* 🟢 GET Products (view only) - admin, editor, viewer                        */
/* -------------------------------------------------------------------------- */
// Example: /api/products?search=phone&category=Electronics
router.get("/", verifyToken, authorizeRoles("admin", "editor", "viewer"), async (req, res) => {
  const { search = "", category = "" } = req.query;

  try {
    let query = `
      SELECT p.id, p.name, p.price, p.image_url, c.name AS category, p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.name ILIKE $1
    `;
    const params = [`%${search}%`];

    if (category) {
      query += ` AND p.category_id = $${params.length + 1}`;
      params.push(category);
    }

    query += " ORDER BY p.id ASC";
    const result = await db.query(query, params);

    const products = result.rows.map((p) => ({
      ...p,
      image_url: p.image_url ? `${BASE_URL}${p.image_url}` : null,
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 GET Categories (for dropdown) - all authenticated roles                 */
/* -------------------------------------------------------------------------- */
router.get("/categories", verifyToken, authorizeRoles("admin", "editor", "viewer"), async (req, res) => {
  try {
    const result = await db.query("SELECT id, name FROM categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟡 POST Add New Product - only admin, editor                               */
/* -------------------------------------------------------------------------- */
router.post("/", verifyToken, authorizeRoles("admin", "editor"), upload.single("image"), async (req, res) => {
  const { name, price, category_id } = req.body;
  const imageUrl = req.file ? req.file.filename : null;

  try {
    const result = await db.query(
      `INSERT INTO products (name, price, category_id, image_url) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, price, category_id, imageUrl]
    );

    const product = result.rows[0];
    product.image_url = product.image_url ? `${BASE_URL}${product.image_url}` : null;

    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟠 PUT Update Product - only admin, editor                                 */
/* -------------------------------------------------------------------------- */
router.put("/:id", verifyToken, authorizeRoles("admin", "editor"), upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;
  const imageUrl = req.file ? req.file.filename : null;

  try {
    let query, params;

    if (imageUrl) {
      query = `
        UPDATE products
        SET name = $1, price = $2, category_id = $3, image_url = $4
        WHERE id = $5 RETURNING *`;
      params = [name, price, category_id, imageUrl, id];
    } else {
      query = `
        UPDATE products
        SET name = $1, price = $2, category_id = $3
        WHERE id = $4 RETURNING *`;
      params = [name, price, category_id, id];
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];
    product.image_url = product.image_url ? `${BASE_URL}${product.image_url}` : null;

    res.json(product);
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE Product - only admin                                             */
/* -------------------------------------------------------------------------- */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully", product: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
