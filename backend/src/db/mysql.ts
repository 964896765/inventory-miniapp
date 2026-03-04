import mysql from "mysql2/promise";

export function createPool() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "inventory";

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true, // allow multiple queries in one request
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });
}

export type DBPool = ReturnType<typeof createPool>;
