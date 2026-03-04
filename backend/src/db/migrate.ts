import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createPool } from "./mysql.js";

async function main() {
  const pool = createPool();
  const sqlPath = path.join(process.cwd(), "src", "db", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await pool.query(sql);
  await pool.end();
  console.log("✅ schema migrated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
