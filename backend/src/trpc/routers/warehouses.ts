import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

const WarehouseInput = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.string().default('normal'),
  parentId: z.number().int().nullable().optional(),
  departmentId: z.number().int().nullable().optional(),
  sort: z.number().int().default(0),
});

const DEFAULT_WAREHOUSES = [
  { name: '主材仓', code: 'MAIN', type: 'main', sort: 1 },
  { name: '车间仓(虚)', code: 'WORKSHOP', type: 'workshop', sort: 2 },
  { name: 'PACK仓', code: 'PACK', type: 'pack', sort: 3 },
  { name: '辅料仓', code: 'AUX', type: 'auxiliary', sort: 4 },
  { name: '待处理', code: 'HOLD', type: 'pending', sort: 5 },
];

export const warehousesRouter = createTRPCRouter({
  ensureDefaults: authedProcedure.mutation(async ({ ctx }) => {
    for (const w of DEFAULT_WAREHOUSES) {
      await ctx.pool.query(
        'INSERT INTO warehouses (name, code, type, sort) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), sort=VALUES(sort)',
        [w.name, w.code, w.type, w.sort]
      );
    }
    return { ok: true };
  }),

  listTop: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>(
      'SELECT * FROM warehouses WHERE parent_id IS NULL ORDER BY sort ASC, id ASC'
    );
    return rows;
  }),

  list: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>(
      'SELECT * FROM warehouses ORDER BY parent_id IS NULL DESC, sort ASC, id ASC'
    );
    return rows;
  }),

  get: authedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM warehouses WHERE id=? LIMIT 1', [input.id]);
    return rows[0] || null;
  }),

  create: authedProcedure.input(WarehouseInput).mutation(async ({ ctx, input }) => {
    const [res] = await ctx.pool.query<any>(
      'INSERT INTO warehouses (name, code, type, parent_id, department_id, sort) VALUES (?,?,?,?,?,?)',
      [input.name, input.code, input.type, input.parentId ?? null, input.departmentId ?? null, input.sort]
    );
    return { id: Number(res.insertId) };
  }),

  update: authedProcedure
    .input(WarehouseInput.extend({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query(
        'UPDATE warehouses SET name=?, code=?, type=?, parent_id=?, department_id=?, sort=? WHERE id=?',
        [
          input.name,
          input.code,
          input.type,
          input.parentId ?? null,
          input.departmentId ?? null,
          input.sort,
          input.id,
        ]
      );
      return { ok: true };
    }),

  delete: authedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.pool.query('DELETE FROM warehouses WHERE id=?', [input.id]);
    return { ok: true };
  }),
});
