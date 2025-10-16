import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

app.use(cors({
    origin: ["http://localhost:5173","https://auth-db-frontend.netlify.app"],
    credentials: true,
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

import AuthRoutes from "./routes/AuthRoutes.js";
import KpiRoutes from "./routes/KpiRoutes.js";
import ChartRoutes from "./routes/ChartRoutes.js";
import OrderRoutes from "./routes/OrderRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import CustomerRoutes from "./routes/CustomerRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";

// API Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/kpis", KpiRoutes);
app.use("/api/charts", ChartRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/products", ProductRoutes);
app.use("/api/customers", CustomerRoutes);
app.use("/api/users", UserRoutes);

// Serve frontend
const __dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

app.get("/", (req, res) => {
    res.send("✅ API is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

