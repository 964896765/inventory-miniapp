import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import type { Pool } from 'mysql2/promise';

export type UserInContext = {
  id: number;
  username: string;
  role: string;
  permissions?: Record<string, boolean>;
};

async function getUserPermissions(pool: Pool, userId: number) {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT permissions_json FROM team_members WHERE user_id=? LIMIT 1',
      [userId]
    );
    if (!rows?.length) return {};
    const json = rows[0].permissions_json;
    if (!json) return {};
    return typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    return {};
  }
}

export function createContextFactory(pool: Pool) {
  return async function createContext({ req }: CreateExpressContextOptions) {
    const header = (req.headers.authorization as string) || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    let user: UserInContext | undefined;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'change_me';
        const payload = jwt.verify(token, secret) as any;
        const perms = await getUserPermissions(pool, payload.id);
        user = {
          id: Number(payload.id),
          username: String(payload.username || ''),
          role: String(payload.role || 'user'),
          permissions: perms,
        };
      } catch {
        user = undefined;
      }
    }

    return { pool, user };
  };
}

export type Context = inferAsyncReturnType<ReturnType<typeof createContextFactory>>;
