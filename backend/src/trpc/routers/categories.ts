import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const categoriesRouter = createTRPCRouter({
  list: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM categories ORDER BY sort ASC, id ASC');
    return rows;
  }),

  create: authedProcedure.input(z.object({ name: z.string().min(1), sort: z.number().int().optional() })).mutation(async ({ ctx, input }) => {
    const [res] = await ctx.pool.query<any>('INSERT INTO categories (name, sort) VALUES (?,?)', [input.name, input.sort ?? 0]);
    return { id: Number(res.insertId) };
  }),

  update: authedProcedure.input(z.object({ id: z.number().int(), name: z.string().min(1), sort: z.number().int().optional() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('UPDATE categories SET name=?, sort=? WHERE id=?', [input.name, input.sort ?? 0, input.id]);
    return { ok: true };
  }),

  delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('DELETE FROM categories WHERE id=?', [input.id]);
    return { ok: true };
  }),
});
