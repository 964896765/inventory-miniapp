import type { Router } from "express";
import { ok } from "./_helpers.js";
import type { DBPool } from "../db/mysql.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

function docTypeText(t: string) {
  const map: Record<string, string> = {
    stock_in: "入库",
    stock_out: "出库",
    transfer: "调拨",
    inventory_check: "盘点",
    bom_issue: "BOM发料",
    return: "退仓",
    exchange: "换料",
    adjustment: "平账",
  };
  return map[t] || t;
}

export function mountDocs(router: Router, pool: DBPool) {
  router.get("/docs", authRequired, async (req: AuthedRequest, res) => {
    const { type, mine } = req.query as any;
    const where: string[] = [];
    const params: any[] = [];
    if (type) { where.push("doc_type=?"); params.push(String(type)); }
    if (mine) { where.push("created_by=?"); params.push(req.user!.id); }

    const sql = `SELECT * FROM docs ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT 200`;
    const [rows] = await pool.query<any[]>(sql, params);

    return ok(res, {
      items: rows.map((d) => ({
        id: d.id,
        docNo: d.doc_no,
        docType: d.doc_type,
        docTypeText: docTypeText(d.doc_type),
        status: d.status,
        createdAt: d.created_at,
      })),
    });
  });

  router.get("/docs/:id", authRequired, async (req, res) => {
    const id = Number(req.params.id);
    const [docs] = await pool.query<any[]>("SELECT * FROM docs WHERE id=?", [id]);
    if (!docs.length) return res.status(404).json({ code: 404, message: "not found" });
    const d = docs[0];
    const [items] = await pool.query<any[]>("SELECT * FROM doc_items WHERE doc_id=? ORDER BY id ASC", [id]);

    return ok(res, {
      id: d.id,
      docNo: d.doc_no,
      docType: d.doc_type,
      docTypeText: docTypeText(d.doc_type),
      status: d.status,
      createdAt: d.created_at,
      items: items.map((it) => ({
        id: it.id,
        materialId: it.material_id,
        materialName: it.material_name,
        quantity: it.quantity,
        batchNo: it.batch_no,
        remark: it.remark,
      })),
    });
  });

  router.post("/docs/draft", authRequired, async (req: AuthedRequest, res) => {
    const { docType, notes, items } = req.body || {};
    const docNo = `D${Date.now()}`;
    const [r] = await pool.query<any>(
      "INSERT INTO docs (doc_no, doc_type, status, created_by, notes) VALUES (?,?,?,?,?)",
      [docNo, String(docType || "unknown"), "draft", req.user!.id, notes || null]
    );
    const docId = r.insertId as number;

    if (Array.isArray(items)) {
      for (const it of items) {
        await pool.query(
          "INSERT INTO doc_items (doc_id, material_id, material_name, quantity, unit_price, batch_no, remark) VALUES (?,?,?,?,?,?,?)",
          [
            docId,
            Number(it.materialId || 0),
            String(it.materialName || ""),
            Number(it.quantity || 0),
            it.unitPrice ?? null,
            it.batchNo ?? null,
            it.remark ?? null,
          ]
        );
      }
    }

    return ok(res, { id: docId, docNo });
  });

  router.post("/docs/submit", authRequired, async (req: AuthedRequest, res) => {
    const { docId } = req.body || {};
    const id = Number(docId);
    await pool.query("UPDATE docs SET status='submitted', submitted_at=NOW() WHERE id=?", [id]);

    // create notification for admins (simplified)
    const [admins] = await pool.query<any[]>("SELECT id FROM users WHERE role='admin'");
    for (const a of admins) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, title, content, related_doc_id) VALUES (?,?,?,?,?)",
        [a.id, "approval", "有新单据待审批", `单据ID：${id}`, id]
      );
    }

    await pool.query(
      "INSERT INTO approval_logs (doc_id, action, created_by) VALUES (?,?,?)",
      [id, "submit", req.user!.id]
    );

    return ok(res, true);
  });

  router.post("/docs/post", authRequired, async (req: AuthedRequest, res) => {
    const { docId } = req.body || {};
    const id = Number(docId);
    // 简化：仅允许已审批的单据过账（你可以按 config 做更复杂规则）
    const [docs] = await pool.query<any[]>("SELECT status FROM docs WHERE id=?", [id]);
    if (!docs.length) return res.status(404).json({ code: 404, message: "not found" });
    const status = docs[0].status;
    if (status !== "approved") return res.status(400).json({ code: 400, message: "未审批通过，不能过账" });

    await pool.query("UPDATE docs SET status='posted', posted_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO approval_logs (doc_id, action, created_by) VALUES (?,?,?)", [id, "post", req.user!.id]);

    return ok(res, true);
  });

  // approvals
  router.get("/approvals/pending", authRequired, async (_req, res) => {
    const [rows] = await pool.query<any[]>("SELECT * FROM docs WHERE status='submitted' ORDER BY id DESC LIMIT 200");
    return ok(res, {
      items: rows.map((d) => ({
        id: d.id,
        docNo: d.doc_no,
        docType: d.doc_type,
        docTypeText: docTypeText(d.doc_type),
        createdBy: d.created_by,
        createdAt: d.created_at,
      })),
    });
  });

  router.get("/approvals/logs", authRequired, async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      "SELECT l.*, d.doc_no FROM approval_logs l LEFT JOIN docs d ON d.id=l.doc_id ORDER BY l.id DESC LIMIT 200"
    );
    return ok(res, {
      items: rows.map((l) => ({
        id: l.id,
        docId: l.doc_id,
        docNo: l.doc_no,
        action: l.action,
        remark: l.remark,
        createdAt: l.created_at,
      })),
    });
  });

  router.post("/approvals/approve", authRequired, async (req: AuthedRequest, res) => {
    const { docId, remark } = req.body || {};
    const id = Number(docId);
    await pool.query("UPDATE docs SET status='approved', approved_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)", [id, "approve", remark || null, req.user!.id]);

    // notify creator
    const [docs] = await pool.query<any[]>("SELECT created_by FROM docs WHERE id=?", [id]);
    if (docs.length) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, title, content, related_doc_id) VALUES (?,?,?,?,?)",
        [docs[0].created_by, "approval", "单据已审批通过", `单据ID：${id}`, id]
      );
    }

    return ok(res, true);
  });

  router.post("/approvals/reject", authRequired, async (req: AuthedRequest, res) => {
    const { docId, remark } = req.body || {};
    const id = Number(docId);
    await pool.query("UPDATE docs SET status='rejected' WHERE id=?", [id]);
    await pool.query("INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)", [id, "reject", remark || null, req.user!.id]);

    const [docs] = await pool.query<any[]>("SELECT created_by FROM docs WHERE id=?", [id]);
    if (docs.length) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, title, content, related_doc_id) VALUES (?,?,?,?,?)",
        [docs[0].created_by, "approval", "单据已驳回", `单据ID：${id}`, id]
      );
    }

    return ok(res, true);
  });

  // notifications
  router.get("/notifications", authRequired, async (req: AuthedRequest, res) => {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 200",
      [req.user!.id]
    );
    const unread = rows.filter((r) => !r.is_read).length;
    return ok(res, {
      unreadCount: unread,
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        relatedDocId: n.related_doc_id,
        isRead: !!n.is_read,
        createdAt: n.created_at,
      })),
    });
  });

  router.post("/notifications/read", authRequired, async (req: AuthedRequest, res) => {
    const { ids } = req.body || {};
    const list = Array.isArray(ids) ? ids.map((x) => Number(x)) : [];
    if (!list.length) return ok(res, true);
    await pool.query(`UPDATE notifications SET is_read=1 WHERE user_id=? AND id IN (${list.map(() => "?").join(",")})`, [req.user!.id, ...list]);
    return ok(res, true);
  });

  // statistics summary (for Home)
  router.get("/statistics/summary", authRequired, async (_req, res) => {
    // Minimal: counts based on docs (posted today)
    const [inRows] = await pool.query<any[]>("SELECT COUNT(*) c FROM docs WHERE doc_type='stock_in' AND DATE(created_at)=CURDATE()");
    const [outRows] = await pool.query<any[]>("SELECT COUNT(*) c FROM docs WHERE doc_type='stock_out' AND DATE(created_at)=CURDATE()");
    const [pending] = await pool.query<any[]>("SELECT COUNT(*) c FROM docs WHERE status='submitted'");
    return ok(res, {
      todayInCount: inRows[0].c,
      todayInQty: 0,
      todayOutCount: outRows[0].c,
      todayOutQty: 0,
      pendingApprovals: pending[0].c,
      unreadNotifications: 0,
    });
  });

  // misc
  router.get("/misc/desktop-url", authRequired, async (_req, res) => ok(res, { url: process.env.DESKTOP_URL || "" }));
  router.get("/misc/support-url", authRequired, async (_req, res) => ok(res, { url: process.env.SUPPORT_URL || "" }));
}
