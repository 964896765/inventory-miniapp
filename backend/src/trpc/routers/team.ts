import { z } from 'zod';
import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, authedProcedure } from '../trpc.js';

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export const teamRouter = createTRPCRouter({
  listMembers: authedProcedure.query(async ({ ctx }) => {
    const [rows] = await ctx.pool.query<any[]>(
      `SELECT tm.id as member_id, tm.role as member_role, tm.permissions_json,
              u.id as user_id, u.username, u.name, u.email, u.phone, u.role
       FROM team_members tm
       LEFT JOIN users u ON u.id=tm.user_id
       ORDER BY tm.id ASC`
    );
    return rows;
  }),

  getMember: authedProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>(
      `SELECT tm.id as member_id, tm.role as member_role, tm.permissions_json,
              u.id as user_id, u.username, u.name, u.email, u.phone, u.role
       FROM team_members tm
       LEFT JOIN users u ON u.id=tm.user_id
       WHERE tm.id=? LIMIT 1`,
      [input.id]
    );
    return rows[0] || null;
  }),

  inviteMember: authedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const username = input.email.toLowerCase();
      const tempPwd = '123456';
      const pwdHash = sha256(tempPwd);

      const [urows] = await ctx.pool.query<any[]>('SELECT id FROM users WHERE username=? LIMIT 1', [username]);
      let userId: number;
      if (urows.length) {
        userId = Number(urows[0].id);
      } else {
        const [res] = await ctx.pool.query<any>(
          'INSERT INTO users (username, password_hash, name, email, role) VALUES (?,?,?,?,?)',
          [username, pwdHash, username.split('@')[0], input.email, 'user']
        );
        userId = Number(res.insertId);
      }

      await ctx.pool.query(
        'INSERT INTO team_members (user_id, role, permissions_json) VALUES (?,?,JSON_OBJECT()) ON DUPLICATE KEY UPDATE user_id=user_id',
        [userId, 'member']
      );

      return { ok: true, userId, tempPassword: tempPwd };
    }),

  updateMemberPermissions: authedProcedure
    .input(z.object({ memberId: z.number().int(), permissions: z.record(z.boolean()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query('UPDATE team_members SET permissions_json=? WHERE id=?', [JSON.stringify(input.permissions), input.memberId]);
      return { ok: true };
    }),

  removeMember: authedProcedure.input(z.object({ memberId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const [rows] = await ctx.pool.query<any[]>('SELECT user_id FROM team_members WHERE id=?', [input.memberId]);
    if (!rows.length) throw new TRPCError({ code: 'NOT_FOUND' });
    await ctx.pool.query('DELETE FROM team_members WHERE id=?', [input.memberId]);
    return { ok: true };
  }),
});
