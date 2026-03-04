import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const materialsRouter = createTRPCRouter({
  list: authedProcedure
    .input(
      z
        .object({
          categoryId: z.number().int().optional().nullable(),
          keyword: z.string().optional().default(''),
          page: z.number().int().optional().default(1),
          pageSize: z.number().int().optional().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 50;
      const offset = (page - 1) * pageSize;
      const keyword = (input?.keyword ?? '').trim();
      const params: any[] = [];
      const where: string[] = [];
      if (input?.categoryId) {
        where.push('category_id=?');
        params.push(input.categoryId);
      }
      if (keyword) {
        where.push('(code LIKE ? OR name LIKE ? OR spec LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT * FROM materials ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
      return { items: rows, page, pageSize };
    }),

  get: authedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM materials WHERE id=? LIMIT 1', [input.id]);
    return rows[0] || null;
  }),

  create: authedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        spec: z.string().optional().default(''),
        unit: z.string().optional().default(''),
        categoryId: z.number().int().nullable().optional(),
        remark: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [res] = await ctx.pool.query<any>(
        'INSERT INTO materials (code, name, spec, unit, category_id, remark) VALUES (?,?,?,?,?,?)',
        [input.code, input.name, input.spec ?? '', input.unit ?? '', input.categoryId ?? null, input.remark ?? null]
      );
      return { id: Number(res.insertId) };
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.number().int(),
        code: z.string().min(1),
        name: z.string().min(1),
        spec: z.string().optional().default(''),
        unit: z.string().optional().default(''),
        categoryId: z.number().int().nullable().optional(),
        remark: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query(
        'UPDATE materials SET code=?, name=?, spec=?, unit=?, category_id=?, remark=? WHERE id=?',
        [input.code, input.name, input.spec ?? '', input.unit ?? '', input.categoryId ?? null, input.remark ?? null, input.id]
      );
      return { ok: true };
    }),

  delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('DELETE FROM materials WHERE id=?', [input.id]);
    return { ok: true };
  }),
});
