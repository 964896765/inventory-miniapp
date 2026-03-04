import type { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { ok } from "./_helpers.js";
import type { DBPool } from "../db/mysql.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function mountAuth(router: Router, pool: DBPool) {
  router.post("/auth/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ code: 400, message: "username/password required" });

    const [rows] = await pool.query<any[]>("SELECT * FROM users WHERE username=?", [username]);
    if (!rows.length) return res.status(401).json({ code: 401, message: "用户名或密码错误" });

    const u = rows[0];
    if (u.password_hash !== sha256(password)) return res.status(401).json({ code: 401, message: "用户名或密码错误" });

    const secret = process.env.JWT_SECRET || "change_me";
    const token = jwt.sign({ id: u.id, username: u.username, role: u.role }, secret, { expiresIn: "30d" });

    return ok(res, {
      token,
      user: {
        id: u.id,
        username: u.username,
        name: u.name,
        phone: u.phone,
        email: u.email,
        avatarUrl: u.avatar_url,
        gender: u.gender,
        department: u.department,
        position: u.position,
        role: u.role,
      },
    });
  });

  router.post("/auth/logout", authRequired, async (_req, res) => ok(res, true));

  router.get("/auth/me", authRequired, async (req: AuthedRequest, res) => {
    const [rows] = await pool.query<any[]>("SELECT * FROM users WHERE id=?", [req.user!.id]);
    const u = rows[0];
    return ok(res, {
      id: u.id,
      username: u.username,
      name: u.name,
      phone: u.phone,
      email: u.email,
      avatarUrl: u.avatar_url,
      gender: u.gender,
      department: u.department,
      position: u.position,
      role: u.role,
    });
  });

  router.put("/users/me", authRequired, async (req: AuthedRequest, res) => {
    const { name, phone, email, gender, department, position, avatarUrl } = req.body || {};
    await pool.query(
      "UPDATE users SET name=?, phone=?, email=?, gender=?, department=?, position=?, avatar_url=? WHERE id=?",
      [name || "", phone || "", email || "", gender || "other", department || "", position || "", avatarUrl || null, req.user!.id]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM users WHERE id=?", [req.user!.id]);
    const u = rows[0];
    return ok(res, {
      id: u.id,
      username: u.username,
      name: u.name,
      phone: u.phone,
      email: u.email,
      avatarUrl: u.avatar_url,
      gender: u.gender,
      department: u.department,
      position: u.position,
      role: u.role,
    });
  });
}
