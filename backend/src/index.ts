import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { createPool } from "./db/mysql.js";
import { mountAuth } from "./routes/auth.js";
import { mountShare } from "./routes/share.js";
import { mountDocs } from "./routes/docs.js";
import { createContextFactory } from "./trpc/context.js";
import { appRouter } from "./trpc/routers/_app.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

const pool = createPool();

// tRPC (used by mobile app)
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createContextFactory(pool),
  })
);

const api = express.Router();
mountAuth(api, pool);
mountShare(api, pool);
mountDocs(api, pool);

app.use("/api", api);

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`✅ API listening on http://127.0.0.1:${port}`);
});
