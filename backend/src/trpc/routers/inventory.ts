import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

async function getWorkshopId(pool: any): Promise<number | null> {
  const [rows] = await pool.query<any[]>('SELECT id FROM warehouses WHERE code=? LIMIT 1', ['WORKSHOP']);
  return rows[0]?.id ? Number(rows[0].id) : null;
}

async function getDepartmentWarehouseId(pool: any, departmentId: number): Promise<number | null> {
  const [rows] = await pool.query<any[]>(
    'SELECT id FROM warehouses WHERE department_id=? LIMIT 1',
    [departmentId]
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

export const inventoryRouter = createTRPCRouter({
  syncWorkshopDepartments: authedProcedure.mutation(async ({ ctx }) => {
    const workshopId = await getWorkshopId(ctx.pool);
    if (!workshopId) return { ok: false, message: 'WORKSHOP warehouse missing' };

    const [deps] = await ctx.pool.query<any[]>("SELECT id, name FROM supply_units WHERE type='department'");
    for (const d of deps) {
      const code = `DEPT_${d.id}`;
      await ctx.pool.query(
        'INSERT INTO warehouses (name, code, type, parent_id, department_id, sort) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), parent_id=VALUES(parent_id), department_id=VALUES(department_id)',
        [d.name, code, 'department', workshopId, d.id, 1000 + Number(d.id)]
      );
    }
    return { ok: true };
  }),

  getByWarehouse: authedProcedure
    .input(z.object({ warehouseId: z.number().int(), keyword: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 50;
      const offset = (page - 1) * pageSize;
      const keyword = (input.keyword ?? '').trim();
      const params: any[] = [input.warehouseId];
      let kwSql = '';
      if (keyword) {
        kwSql = ' AND (m.code LIKE ? OR m.name LIKE ? OR m.spec LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT i.warehouse_id, i.material_id, i.quantity, m.code, m.name, m.spec, m.unit
         FROM inventory i
         LEFT JOIN materials m ON m.id=i.material_id
         WHERE i.warehouse_id=? ${kwSql}
         ORDER BY m.code ASC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
      return { items: rows, page, pageSize };
    }),

  getByDepartment: authedProcedure
    .input(z.object({ departmentId: z.number().int(), keyword: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const whId = await getDepartmentWarehouseId(ctx.pool, input.departmentId);
      if (!whId) {
        return { items: [], page: input.page ?? 1, pageSize: input.pageSize ?? 50, warehouseId: null };
      }
      const data = await (async () => {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 50;
        const offset = (page - 1) * pageSize;
        const keyword = (input.keyword ?? '').trim();
        const params: any[] = [whId];
        let kwSql = '';
        if (keyword) {
          kwSql = ' AND (m.code LIKE ? OR m.name LIKE ? OR m.spec LIKE ?)';
          params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }
        const [rows] = await ctx.pool.query<any[]>(
          `SELECT i.warehouse_id, i.material_id, i.quantity, m.code, m.name, m.spec, m.unit
           FROM inventory i
           LEFT JOIN materials m ON m.id=i.material_id
           WHERE i.warehouse_id=? ${kwSql}
           ORDER BY m.code ASC
           LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );
        return { items: rows, page, pageSize };
      })();
      return { ...data, warehouseId: whId };
    }),
});
