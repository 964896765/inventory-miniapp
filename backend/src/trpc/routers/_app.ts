import { createTRPCRouter } from '../trpc.js';
import { warehousesRouter } from './warehouses.js';
import { categoriesRouter } from './categories.js';
import { materialsRouter } from './materials.js';
import { supplyUnitsRouter } from './supplyUnits.js';
import { bomsRouter } from './boms.js';
import { inventoryRouter } from './inventory.js';
import { ledgerRouter } from './ledger.js';
import { docsRouter } from './docs.js';
import { approvalRouter } from './approval.js';
import { teamRouter } from './team.js';
import { permissionsRouter } from './permissions.js';

export const appRouter = createTRPCRouter({
  warehouses: warehousesRouter,
  categories: categoriesRouter,
  materials: materialsRouter,
  supplyUnits: supplyUnitsRouter,
  boms: bomsRouter,
  inventory: inventoryRouter,
  ledger: ledgerRouter,
  docs: docsRouter,
  approval: approvalRouter,
  team: teamRouter,
  permissions: permissionsRouter,
});

export type AppRouter = typeof appRouter;
