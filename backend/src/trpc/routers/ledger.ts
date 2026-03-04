import { z } from 'zod';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

export const ledgerRouter = createTRPCRouter({
  listByMaterial: authedProcedure
    .input(
      z.object({
        materialId: z.number().int(),
        warehouseId: z.number().int().optional().nullable(),
        departmentId: z.number().int().optional().nullable(),
        page: z.number().int().optional().default(1),
        pageSize: z.number().int().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 50;
      const offset = (page - 1) * pageSize;
      const where: string[] = ['l.material_id=?'];
      const params: any[] = [input.materialId];
      if (input.warehouseId) {
        where.push('l.warehouse_id=?');
        params.push(input.warehouseId);
      }
      if (input.departmentId) {
        where.push('l.department_id=?');
        params.push(input.departmentId);
      }
      const [rows] = await ctx.pool.query<any[]>(
        `SELECT l.*, d.doc_no, d.doc_type, d.status
         FROM stock_ledger l
         LEFT JOIN docs d ON d.id=l.doc_id
         WHERE ${where.join(' AND ')}
         ORDER BY l.id DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
      return { items: rows, page, pageSize };
    }),
});
