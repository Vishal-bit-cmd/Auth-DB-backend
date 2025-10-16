import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const isRailway = !!process.env.DATABASE_URL;

const pool = new Pool(
    isRailway
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: String(process.env.DB_PASSWORD),
            port: process.env.DB_PORT,
            options: "-c search_path=seed",
        }
);

// Test connection
pool
    .connect()
    .then(() => console.log("✅ PostgreSQL connected successfully"))
    .catch((err) => console.error("❌ PostgreSQL connection error:", err));

export default pool;
