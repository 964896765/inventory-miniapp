import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

function genDocNo(prefix: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}${ts}${Math.floor(Math.random() * 90 + 10)}`;
}

async function getDeptWarehouseId(pool: any, departmentId: number) {
  const [rows] = await pool.query<any[]>('SELECT id FROM warehouses WHERE department_id=? LIMIT 1', [departmentId]);
  return rows[0]?.id ? Number(rows[0].id) : null;
}

async function upsertInventory(pool: any, warehouseId: number, materialId: number, delta: number) {
  // UPSERT then update quantity
  await pool.query(
    'INSERT INTO inventory (warehouse_id, material_id, quantity) VALUES (?,?,0) ON DUPLICATE KEY UPDATE warehouse_id=warehouse_id',
    [warehouseId, materialId]
  );
  await pool.query('UPDATE inventory SET quantity = quantity + ? WHERE warehouse_id=? AND material_id=?', [delta, warehouseId, materialId]);
}

export const docsRouter = createTRPCRouter({
  createDraft: authedProcedure
    .input(
      z.object({
        docType: z.string().min(1),
        fromWarehouseId: z.number().int().nullable().optional(),
        toWarehouseId: z.number().int().nullable().optional(),
        departmentId: z.number().int().nullable().optional(),
        notes: z.string().optional().nullable(),
        items: z
          .array(
            z.object({
              materialId: z.number().int(),
              materialName: z.string().optional().default(''),
              quantity: z.number().positive(),
              unitPrice: z.number().optional().nullable(),
              batchNo: z.string().optional().nullable(),
              remark: z.string().optional().nullable(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const docNo = genDocNo(`${input.docType}-`);
      const [res] = await ctx.pool.query<any>(
        'INSERT INTO docs (doc_no, doc_type, status, from_warehouse_id, to_warehouse_id, department_id, created_by, notes) VALUES (?,?,?,?,?,?,?,?)',
        [
          docNo,
          input.docType,
          'draft',
          input.fromWarehouseId ?? null,
          input.toWarehouseId ?? null,
          input.departmentId ?? null,
          ctx.user!.id,
          input.notes ?? null,
        ]
      );
      const docId = Number(res.insertId);
      for (const it of input.items) {
        await ctx.pool.query(
          'INSERT INTO doc_items (doc_id, material_id, material_name, quantity, unit_price, batch_no, remark) VALUES (?,?,?,?,?,?,?)',
          [docId, it.materialId, it.materialName ?? '', it.quantity, it.unitPrice ?? null, it.batchNo ?? null, it.remark ?? null]
        );
      }
      await ctx.pool.query('INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)', [docId, 'submit', 'draft', ctx.user!.id]);
      return { id: docId, docNo };
    }),

  list: authedProcedure
    .input(
      z
        .object({
          docType: z.string().optional(),
          status: z.string().optional(),
          page: z.number().int().optional().default(1),
          pageSize: z.number().int().optional().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 50;
      const offset = (page - 1) * pageSize;
      const where: string[] = [];
      const params: any[] = [];
      if (input?.docType) {
        where.push('doc_type=?');
        params.push(input.docType);
      }
      if (input?.status) {
        where.push('status=?');
        params.push(input.status);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT * FROM docs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
      return { items: rows, page, pageSize };
    }),

  getDetail: authedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const [docs] = await ctx.pool.query<any[]>('SELECT * FROM docs WHERE id=? LIMIT 1', [input.id]);
    const doc = docs[0];
    if (!doc) return null;
    const [items] = await ctx.pool.query<any[]>('SELECT * FROM doc_items WHERE doc_id=? ORDER BY id ASC', [input.id]);
    return { ...doc, items };
  }),

  submit: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM docs WHERE id=? LIMIT 1', [input.id]);
    const doc = rows[0];
    if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });
    if (doc.status !== 'draft') return { ok: true };

    // approval enabled?
    const [cfgRows] = await ctx.pool.query<any[]>('SELECT * FROM approval_config ORDER BY id DESC LIMIT 1');
    const cfg = cfgRows[0];
    const approvalEnabled = cfg?.enabled === 1 || cfg?.enabled === true;

    const nextStatus = approvalEnabled ? 'pending' : 'approved';
    await ctx.pool.query('UPDATE docs SET status=?, submitted_at=NOW() WHERE id=?', [nextStatus, input.id]);
    await ctx.pool.query('INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)', [input.id, 'submit', null, ctx.user!.id]);

    if (!approvalEnabled) {
      // auto post
      await postDoc(ctx.pool, input.id, ctx.user!.id);
    }

    return { ok: true, status: nextStatus };
  }),

  post: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await postDoc(ctx.pool, input.id, ctx.user!.id);
    return { ok: true };
  }),

  delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('DELETE FROM doc_items WHERE doc_id=?', [input.id]);
    await ctx.pool.query('DELETE FROM approval_logs WHERE doc_id=?', [input.id]);
    await ctx.pool.query('DELETE FROM docs WHERE id=?', [input.id]);
    return { ok: true };
  }),
});

async function postDoc(pool: any, docId: number, actorId: number) {
  const [docs] = await pool.query<any[]>('SELECT * FROM docs WHERE id=? LIMIT 1', [docId]);
  const doc = docs[0];
  if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });
  if (doc.posted_at) return;

  const [items] = await pool.query<any[]>('SELECT * FROM doc_items WHERE doc_id=?', [docId]);
  if (!items.length) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No items' });

  const docType = String(doc.doc_type);
  const fromWh = doc.from_warehouse_id ? Number(doc.from_warehouse_id) : null;
  const toWh = doc.to_warehouse_id ? Number(doc.to_warehouse_id) : null;
  const departmentId = doc.department_id ? Number(doc.department_id) : null;

  // Core rule: OUT to workshop requires department, and generates IN to department warehouse.
  const [workshopRows] = await pool.query<any[]>('SELECT id FROM warehouses WHERE code=? LIMIT 1', ['WORKSHOP']);
  const workshopId = workshopRows[0]?.id ? Number(workshopRows[0].id) : null;

  for (const it of items) {
    const materialId = Number(it.material_id);
    const qty = Number(it.quantity);

    if (docType === 'IN') {
      if (!toWh) throw new TRPCError({ code: 'BAD_REQUEST', message: 'toWarehouseId required' });
      await pool.query(
        'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
        [docId, materialId, toWh, departmentId, 'IN', qty]
      );
      await upsertInventory(pool, toWh, materialId, qty);
      continue;
    }

    if (docType === 'OUT' || docType === 'BOM_ISSUE') {
      if (!fromWh) throw new TRPCError({ code: 'BAD_REQUEST', message: 'fromWarehouseId required' });
      if (!toWh) throw new TRPCError({ code: 'BAD_REQUEST', message: 'toWarehouseId required' });

      // OUT from source
      await pool.query(
        'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
        [docId, materialId, fromWh, departmentId, 'OUT', qty]
      );
      await upsertInventory(pool, fromWh, materialId, -qty);

      // If target is workshop => IN to department warehouse
      if (workshopId && toWh === workshopId) {
        if (!departmentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'departmentId required when toWarehouse=WORKSHOP' });
        }
        const deptWh = await getDeptWarehouseId(pool, departmentId);
        if (!deptWh) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'department warehouse missing, run inventory.syncWorkshopDepartments' });
        }
        await pool.query(
          'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
          [docId, materialId, deptWh, departmentId, 'IN', qty]
        );
        await upsertInventory(pool, deptWh, materialId, qty);
      } else {
        // normal OUT to other warehouse => IN to target
        await pool.query(
          'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
          [docId, materialId, toWh, departmentId, 'IN', qty]
        );
        await upsertInventory(pool, toWh, materialId, qty);
      }
      continue;
    }

    if (docType === 'TRANSFER') {
      if (!fromWh || !toWh) throw new TRPCError({ code: 'BAD_REQUEST', message: 'from/to required' });
      await pool.query(
        'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
        [docId, materialId, fromWh, departmentId, 'OUT', qty]
      );
      await upsertInventory(pool, fromWh, materialId, -qty);
      await pool.query(
        'INSERT INTO stock_ledger (doc_id, material_id, warehouse_id, department_id, direction, quantity) VALUES (?,?,?,?,?,?)',
        [docId, materialId, toWh, departmentId, 'IN', qty]
      );
      await upsertInventory(pool, toWh, materialId, qty);
      continue;
    }

    // fallback: do nothing
  }

  await pool.query('UPDATE docs SET status=?, posted_at=NOW() WHERE id=?', ['posted', docId]);
  await pool.query('INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)', [docId, 'post', null, actorId]);
}
