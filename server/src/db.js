import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("[wadaq-api] DATABASE_URL غير معرّف");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});
