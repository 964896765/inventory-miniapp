import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const bomsRouter = createTRPCRouter({
  list: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM boms ORDER BY id DESC');
    return rows;
  }),

  get: authedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM boms WHERE id=? LIMIT 1', [input.id]);
    return rows[0] || null;
  }),

  create: authedProcedure
    .input(z.object({ code: z.string().min(1), name: z.string().min(1), remark: z.string().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const [res] = await ctx.pool.query<any>(
        'INSERT INTO boms (code, name, remark, created_by) VALUES (?,?,?,?)',
        [input.code, input.name, input.remark ?? null, ctx.user!.id]
      );
      return { id: Number(res.insertId) };
    }),

  update: authedProcedure
    .input(
      z.object({ id: z.number().int(), code: z.string().min(1), name: z.string().min(1), remark: z.string().optional().nullable() })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query('UPDATE boms SET code=?, name=?, remark=? WHERE id=?', [input.code, input.name, input.remark ?? null, input.id]);
      return { ok: true };
    }),

  delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('DELETE FROM bom_items WHERE bom_id=?', [input.id]);
    await ctx.pool.query('DELETE FROM boms WHERE id=?', [input.id]);
    return { ok: true };
  }),

  items: createTRPCRouter({
    list: authedProcedure.input(z.object({ bomId: z.number().int() })).query(async ({ ctx, input }) => {
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT bi.*, m.code as material_code, m.name as material_name, m.unit as material_unit
         FROM bom_items bi
         LEFT JOIN materials m ON m.id = bi.material_id
         WHERE bi.bom_id=? ORDER BY bi.id ASC`,
        [input.bomId]
      );
      return rows;
    }),

    upsert: authedProcedure
      .input(
        z.object({
          id: z.number().int().optional(),
          bomId: z.number().int(),
          materialId: z.number().int(),
          quantity: z.number().positive(),
          remark: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (input.id) {
          await ctx.pool.query('UPDATE bom_items SET material_id=?, quantity=?, remark=? WHERE id=?', [
            input.materialId,
            input.quantity,
            input.remark ?? null,
            input.id,
          ]);
          return { id: input.id };
        }
        const [res] = await ctx.pool.query<any>(
          'INSERT INTO bom_items (bom_id, material_id, quantity, remark) VALUES (?,?,?,?)',
          [input.bomId, input.materialId, input.quantity, input.remark ?? null]
        );
        return { id: Number(res.insertId) };
      }),

    delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
      await ctx.pool.query('DELETE FROM bom_items WHERE id=?', [input.id]);
      return { ok: true };
    }),
  }),
});
