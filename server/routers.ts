// Re-export backend tRPC AppRouter type for the Expo client.
// This keeps the frontend import stable: import type { AppRouter } from "@/server/routers";
export type { AppRouter } from "../backend/src/trpc/routers/_app";
