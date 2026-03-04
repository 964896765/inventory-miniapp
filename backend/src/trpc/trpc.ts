import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function requirePermission(key: string) {
  return authedProcedure.use(({ ctx, next }) => {
    const perms = ctx.user?.permissions || {};
    const allowed = Boolean((perms as any)[key]) || ctx.user?.role === 'admin';
    if (!allowed) throw new TRPCError({ code: 'FORBIDDEN' });
    return next();
  });
}
