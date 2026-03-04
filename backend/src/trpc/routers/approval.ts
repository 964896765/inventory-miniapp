import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const approvalRouter = createTRPCRouter({
  getConfig: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM approval_config ORDER BY id DESC LIMIT 1');
    return (
      rows[0] || {
        enabled: 0,
        level: 1,
        exempt_self: 1,
        approver1_id: null,
        approver2_id: null,
      }
    );
  }),

  setConfig: authedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        level: z.number().int().min(1).max(2),
        exemptSelf: z.boolean().default(true),
        approver1Id: z.number().int().nullable().optional(),
        approver2Id: z.number().int().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [rows] = await ctx.pool.query<any[]>('SELECT id FROM approval_config ORDER BY id DESC LIMIT 1');
      if (!rows.length) {
        await ctx.pool.query(
          'INSERT INTO approval_config (enabled, level, exempt_self, approver1_id, approver2_id) VALUES (?,?,?,?,?)',
          [input.enabled ? 1 : 0, input.level, input.exemptSelf ? 1 : 0, input.approver1Id ?? null, input.approver2Id ?? null]
        );
      } else {
        await ctx.pool.query(
          'UPDATE approval_config SET enabled=?, level=?, exempt_self=?, approver1_id=?, approver2_id=? WHERE id=?',
          [input.enabled ? 1 : 0, input.level, input.exemptSelf ? 1 : 0, input.approver1Id ?? null, input.approver2Id ?? null, rows[0].id]
        );
      }
      return { ok: true };
    }),

  listTasks: authedProcedure
    .input(
      z.object({
        tab: z.enum(['pending', 'approved', 'rejected']).default('pending'),
        filters: z
          .object({
            docType: z.string().optional(),
            warehouseId: z.number().int().optional(),
            actorId: z.number().int().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const status = input.tab === 'pending' ? 'pending' : input.tab === 'approved' ? 'approved' : 'rejected';
      const where: string[] = ['d.status=?'];
      const params: any[] = [status];
      if (input.filters?.docType) {
        where.push('d.doc_type=?');
        params.push(input.filters.docType);
      }
      if (input.filters?.warehouseId) {
        where.push('(d.from_warehouse_id=? OR d.to_warehouse_id=?)');
        params.push(input.filters.warehouseId, input.filters.warehouseId);
      }
      if (input.filters?.actorId) {
        where.push('d.created_by=?');
        params.push(input.filters.actorId);
      }
      if (input.filters?.dateFrom) {
        where.push('d.created_at>=?');
        params.push(input.filters.dateFrom);
      }
      if (input.filters?.dateTo) {
        where.push('d.created_at<=?');
        params.push(input.filters.dateTo);
      }

      const [rows] = await ctx.pool.query<any[]>(
        `SELECT d.* FROM docs d WHERE ${where.join(' AND ')} ORDER BY d.id DESC LIMIT 200`,
        params
      );
      return rows;
    }),

  approve: authedProcedure
    .input(z.object({ docId: z.number().int(), comment: z.string().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const [rows] = await ctx.pool.query<any[]>('SELECT * FROM docs WHERE id=? LIMIT 1', [input.docId]);
      const doc = rows[0];
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });
      if (doc.status !== 'pending') return { ok: true };

      await ctx.pool.query('UPDATE docs SET status=?, approved_at=NOW() WHERE id=?', ['approved', input.docId]);
      await ctx.pool.query('INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)', [input.docId, 'approve', input.comment ?? null, ctx.user!.id]);
      return { ok: true };
    }),

  reject: authedProcedure
    .input(z.object({ docId: z.number().int(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [rows] = await ctx.pool.query<any[]>('SELECT * FROM docs WHERE id=? LIMIT 1', [input.docId]);
      const doc = rows[0];
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });
      if (doc.status !== 'pending') return { ok: true };

      await ctx.pool.query('UPDATE docs SET status=? WHERE id=?', ['rejected', input.docId]);
      await ctx.pool.query('INSERT INTO approval_logs (doc_id, action, remark, created_by) VALUES (?,?,?,?)', [input.docId, 'reject', input.reason, ctx.user!.id]);
      return { ok: true };
    }),

  listLogs: authedProcedure
    .input(
      z
        .object({
          docId: z.number().int().optional(),
          status: z.string().optional(),
          actorId: z.number().int().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: string[] = [];
      const params: any[] = [];
      if (input?.docId) {
        where.push('l.doc_id=?');
        params.push(input.docId);
      }
      if (input?.actorId) {
        where.push('l.created_by=?');
        params.push(input.actorId);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT l.*, u.username, u.name FROM approval_logs l LEFT JOIN users u ON u.id=l.created_by ${whereSql} ORDER BY l.id DESC LIMIT 500`,
        params
      );
      return rows;
    }),
});
