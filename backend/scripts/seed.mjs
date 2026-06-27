import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Example: DATABASE_URL=postgres://user:pass@host:5432/db node backend/scripts/seed.mjs");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

try {
  const schema = await readFile(resolve(root, "backend/db/schema.sql"), "utf8");
  const seed = await readFile(resolve(root, "backend/db/seed.sql"), "utf8");
  await pool.query(schema);
  await pool.query(seed);
  console.log("Seeded AI Procurement Copilot backend data successfully.");
} finally {
  await pool.end();
}