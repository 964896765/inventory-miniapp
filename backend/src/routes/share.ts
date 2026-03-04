import type { Router } from "express";
import crypto from "node:crypto";
import { ok } from "./_helpers.js";
import type { DBPool } from "../db/mysql.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

export function mountShare(router: Router, pool: DBPool) {
  router.post("/share-links", authRequired, async (req: AuthedRequest, res) => {
    const { scene } = req.body || {};
    const shareId = crypto.randomBytes(12).toString("hex");
    const base = process.env.DESKTOP_URL || "https://example.com";
    const url = `${base}?shareId=${shareId}`;
    await pool.query(
      "INSERT INTO share_links (share_id, user_id, url, scene) VALUES (?,?,?,?)",
      [shareId, req.user!.id, url, String(scene || "unknown")]
    );
    return ok(res, { shareId, url });
  });

  router.post("/share-logs", authRequired, async (req: AuthedRequest, res) => {
    const { shareId, platform, result, errorMsg } = req.body || {};
    if (!shareId) return res.status(400).json({ code: 400, message: "shareId required" });
    await pool.query(
      "INSERT INTO share_logs (share_id, user_id, platform, result, error_msg) VALUES (?,?,?,?,?)",
      [String(shareId), req.user!.id, String(platform || ""), String(result || ""), errorMsg ? String(errorMsg) : null]
    );
    return ok(res, true);
  });
}
