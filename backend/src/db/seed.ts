import "dotenv/config";
import crypto from "node:crypto";
import { createPool } from "./mysql.js";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function main() {
  const pool = createPool();

  // default admin
  const username = "admin";
  // Demo default password (mobile app): admin / 123456
  const password = "123456";
  const passwordHash = sha256(password);

  const [rows] = await pool.query<any[]>("SELECT id FROM users WHERE username=?", [username]);
  if (!rows.length) {
    await pool.query(
      "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)",
      [username, passwordHash, "管理员", "admin"]
    );
    console.log("✅ admin created: admin / 123456");
  } else {
    console.log("ℹ admin exists");
  }

  // ensure default warehouses
  const defaults = [
    { name: '主材仓', code: 'MAIN', type: 'main', sort: 1 },
    { name: '车间仓(虚)', code: 'WORKSHOP', type: 'workshop', sort: 2 },
    { name: 'PACK仓', code: 'PACK', type: 'pack', sort: 3 },
    { name: '辅料仓', code: 'AUX', type: 'auxiliary', sort: 4 },
    { name: '待处理', code: 'HOLD', type: 'pending', sort: 5 },
  ];
  for (const w of defaults) {
    await pool.query(
      'INSERT INTO warehouses (name, code, type, sort) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), sort=VALUES(sort)',
      [w.name, w.code, w.type, w.sort]
    );
  }

  // ensure approval config row
  const [cfg] = await pool.query<any[]>('SELECT id FROM approval_config LIMIT 1');
  if (!cfg.length) {
    await pool.query('INSERT INTO approval_config (enabled, level, exempt_self) VALUES (0,1,1)');
  }

  // ensure admin is in team_members
  const [adminRow] = await pool.query<any[]>('SELECT id FROM users WHERE username=? LIMIT 1', [username]);
  const adminId = adminRow?.[0]?.id;
  if (adminId) {
    await pool.query(
      'INSERT INTO team_members (user_id, role, permissions_json) VALUES (?,?,JSON_OBJECT()) ON DUPLICATE KEY UPDATE user_id=user_id',
      [adminId, 'admin']
    );
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
