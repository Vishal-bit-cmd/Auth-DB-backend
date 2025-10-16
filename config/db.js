// import pg from "pg";
// import dotenv from "dotenv";

// dotenv.config();
// const { Pool } = pg;

// const isRailway = !!process.env.DATABASE_URL;

// const pool = new Pool(
//     isRailway
//         ? {
//             connectionString: process.env.DATABASE_URL,
//             ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
//         }
//         : {
//             user: process.env.DB_USER,
//             host: process.env.DB_HOST,
//             database: process.env.DB_NAME,
//             password: String(process.env.DB_PASSWORD),
//             port: process.env.DB_PORT,
//             options: "-c search_path=seed",
//         }
// );

// pool
//     .connect()
//     .then(() => console.log("✅ PostgreSQL connected successfully"))
//     .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// export default pool;

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

let pool;

function createPool() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL client error:", err.message);
  });

  
  return pool;
}

// Initialize immediately
createPool();

async function query(sql, params) {
  if (!pool) createPool();

  let client;
  try {
    client = await pool.connect();
    const res = await client.query(sql, params);
    console.log("✅ PostgreSQL pool created");
    return res;
  } catch (err) {
    console.error("❌ Database query error:", err.message);

    // If the connection is lost or idle timeout, reinitialize the pool
    if (
      err.message.includes("terminated") ||
      err.message.includes("ECONNRESET") ||
      err.message.includes("Connection terminated unexpectedly")
    ) {
      console.warn("⚠️ Reinitializing PostgreSQL pool...");
      createPool();
    }

    throw err;
  } finally {
    if (client) client.release();
  }
}

export default {query} ;
