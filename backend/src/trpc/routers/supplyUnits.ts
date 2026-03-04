import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const supplyUnitsRouter = createTRPCRouter({
  list: authedProcedure
    .input(z.object({ type: z.enum(['supplier', 'customer', 'department']).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const type = input?.type;
      const [rows] = await ctx.pool.query<any[]>(
        type ? 'SELECT * FROM supply_units WHERE type=? ORDER BY id DESC' : 'SELECT * FROM supply_units ORDER BY id DESC',
        type ? [type] : []
      );
      return rows;
    }),

  listDepartments: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>(
      "SELECT * FROM supply_units WHERE type='department' ORDER BY id ASC"
    );
    return rows;
  }),

  createDepartment: authedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [res] = await ctx.pool.query<any>(
        "INSERT INTO supply_units (name, type) VALUES (?, 'department')",
        [input.name]
      );
      return { id: Number(res.insertId) };
    }),

  // Generic CRUD (supplier/customer/department)
  create: authedProcedure
    .input(
      z.object({
        type: z.enum(['supplier', 'customer', 'department']),
        name: z.string().min(1),
        contact: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [res] = await ctx.pool.query<any>(
        'INSERT INTO supply_units (name, type, contact, phone) VALUES (?, ?, ?, ?)',
        [input.name, input.type, input.contact ?? null, input.phone ?? null]
      );
      return { id: Number(res.insertId) };
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        type: z.enum(['supplier', 'customer', 'department']).optional(),
        name: z.string().min(1).optional(),
        contact: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patch: Record<string, any> = {};
      if (input.type) patch.type = input.type;
      if (input.name) patch.name = input.name;
      if (input.contact !== undefined) patch.contact = input.contact ?? null;
      if (input.phone !== undefined) patch.phone = input.phone ?? null;

      const keys = Object.keys(patch);
      if (keys.length === 0) return { ok: true };

      const setSql = keys.map((k) => `${k}=?`).join(', ');
      const values = keys.map((k) => patch[k]);
      await ctx.pool.query(`UPDATE supply_units SET ${setSql} WHERE id=?`, [...values, input.id]);
      return { ok: true };
    }),

  remove: authedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query('DELETE FROM supply_units WHERE id=?', [input.id]);
      return { ok: true };
    }),
});
