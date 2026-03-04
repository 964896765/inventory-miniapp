import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthedRequest = Request & { user?: { id: number; username: string; role: string } };

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ code: 401, message: "Unauthorized" });

  try {
    const secret = process.env.JWT_SECRET || "change_me";
    const payload = jwt.verify(token, secret) as any;
    req.user = { id: payload.id, username: payload.username, role: payload.role || "user" };
    next();
  } catch {
    return res.status(401).json({ code: 401, message: "Unauthorized" });
  }
}
