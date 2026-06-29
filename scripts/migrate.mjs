// Runs scripts/001-schema.sql against Aurora DSQL, one DDL statement per
// transaction (DSQL does not allow multiple DDL statements in one tx).
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { pool, exec } from "./db.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const sql = readFileSync(join(__dirname, "001-schema.sql"), "utf8")
  // Split into statements on COMMIT; markers. Each chunk is a single DDL.
  const chunks = sql
    .split(/;\s*COMMIT;/i)
    .map((c) =>
      c
        .split("\n")
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((c) => c.length > 0)

  for (const stmt of chunks) {
    const label = stmt.split("\n")[0].slice(0, 70)
    try {
      await exec(stmt)
      console.log("[migrate] ok:", label)
    } catch (err) {
      console.error("[migrate] FAILED:", label, "->", err.message)
      throw err
    }
  }

  console.log("[migrate] schema applied successfully.")
  await pool.end()
}

main().catch((err) => {
  console.error("[migrate] error:", err)
  process.exit(1)
})
