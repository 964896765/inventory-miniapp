import { createTRPCRouter, authedProcedure } from '../trpc.js';

const DEFAULT_PERMS = [
  { key: 'warehouses.manage', name: '仓库管理', description: '新增/编辑/删除仓库' },
  { key: 'materials.manage', name: '材料管理', description: '新增/编辑/删除材料' },
  { key: 'docs.create', name: '单据创建', description: '创建入库/出库/调拨/盘点等单据' },
  { key: 'docs.approve', name: '审批作业', description: '通过/驳回审批' },
  { key: 'team.manage', name: '成员管理', description: '邀请成员与配置权限' },
  { key: 'approval.config', name: '审批配置', description: '设置审批开关与审批人' },
];

export const permissionsRouter = createTRPCRouter({
  list: authedProcedure.query(async ({ ctx }) => {
    for (const p of DEFAULT_PERMS) {
      await ctx.pool.query(
        'INSERT INTO permissions (`key`, name, description) VALUES (?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)',
        [p.key, p.name, p.description]
      );
    }
    const [rows] = await ctx.pool.query<any[]>('SELECT * FROM permissions ORDER BY id ASC');
    return rows;
  }),
});
