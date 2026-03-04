import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// 仓库表（二级结构：一级仓库和子仓库）
// ============================================================================
export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: int("parentId"), // NULL表示一级仓库，非NULL表示子仓库
  departmentId: int("departmentId"), // 关联supply_units表的部门ID（用于车间仓子仓库）
  sort: int("sort").default(0), // 排序字段，用于五大仓库排序
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 材料分类表（二级结构：一级分类和子分类）
// ============================================================================
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: int("parentId"), // NULL表示一级分类，非NULL表示子分类
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 材料表
// ============================================================================
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: int("categoryId").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  specification: varchar("specification", { length: 255 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  barcode: varchar("barcode", { length: 255 }),
  inboundPrice: varchar("inboundPrice", { length: 50 }),
  outboundPrice: varchar("outboundPrice", { length: 50 }),
  stockAlert: int("stockAlert"), // 库存预警数量
  expiryDate: varchar("expiryDate", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 供需单位表（客户、供应商、其它）
// ============================================================================
export const supplyUnits = mysqlTable("supply_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["customer", "supplier", "department", "other"]).notNull(),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// BOM表（物料清单）
// ============================================================================
export const boms = mysqlTable("boms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// BOM材料清单表（BOM中的材料明细）
// ============================================================================
export const bomItems = mysqlTable("bom_items", {
  id: int("id").autoincrement().primaryKey(),
  bomId: int("bomId").notNull(),
  materialId: int("materialId").notNull(),
  quantity: varchar("quantity", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 库存表（材料在各仓库的库存数量）
// ============================================================================
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  warehouseId: int("warehouseId").notNull(),
  quantity: varchar("quantity", { length: 50 }).notNull().default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 类型导出
// ============================================================================
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = typeof warehouses.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export type SupplyUnit = typeof supplyUnits.$inferSelect;
export type InsertSupplyUnit = typeof supplyUnits.$inferInsert;

export type BOM = typeof boms.$inferSelect;
export type InsertBOM = typeof boms.$inferInsert;

export type BOMItem = typeof bomItems.$inferSelect;
export type InsertBOMItem = typeof bomItems.$inferInsert;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

// ============================================================================
// 单据主表（docs）
// ============================================================================
export const docs = mysqlTable("docs", {
  id: int("id").autoincrement().primaryKey(),
  docType: mysqlEnum("docType", [
    "stock_in",      // 入库
    "stock_out",     // 出库
    "transfer",      // 调拨
    "inventory_check", // 盘点
    "bom_issue",     // BOM发料
    "return",        // 退仓
    "exchange",      // 换料
    "adjustment",    // 平账
  ]).notNull(),
  docNo: varchar("docNo", { length: 100 }).notNull().unique(), // 单据编号
  status: mysqlEnum("status", [
    "draft",         // 草稿
    "submitted",     // 已提交
    "approved",      // 已审批
    "rejected",      // 已驳回
    "posted",        // 已过账
  ]).default("draft").notNull(),
  warehouseId: int("warehouseId"), // 仓库ID（入库/出库/调拨源仓库）
  toWarehouseId: int("toWarehouseId"), // 目标仓库ID（调拨/出库到车间仓）
  departmentId: int("departmentId"), // 部门ID（出库到车间仓时必填）
  bomId: int("bomId"), // BOM ID（BOM发料时使用）
  createdBy: int("createdBy"), // 创建人 ID
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"), // 提交时间
  approvedAt: timestamp("approvedAt"), // 审批时间
  postedAt: timestamp("postedAt"), // 过账时间
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Doc = typeof docs.$inferSelect;
export type InsertDoc = typeof docs.$inferInsert;

// ============================================================================
// 单据明细表（doc_items）
// ============================================================================
export const docItems = mysqlTable("doc_items", {
  id: int("id").autoincrement().primaryKey(),
  docId: int("docId").notNull(), // 关联单据主表
  materialId: int("materialId").notNull(), // 材料ID
  quantity: varchar("quantity", { length: 50 }).notNull(), // 数量
  unitPrice: varchar("unitPrice", { length: 50 }), // 单价
  batchNo: varchar("batchNo", { length: 100 }), // 批次号
  remark: text("remark"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocItem = typeof docItems.$inferSelect;
export type InsertDocItem = typeof docItems.$inferInsert;

// ============================================================================
// 库存流水表（stock_ledger）
// ============================================================================
export const stockLedger = mysqlTable("stock_ledger", {
  id: int("id").autoincrement().primaryKey(),
  docId: int("docId").notNull(), // 关联单据主表
  materialId: int("materialId").notNull(), // 材料ID
  warehouseId: int("warehouseId").notNull(), // 仓库ID
  departmentId: int("departmentId"), // 部门ID（车间仓子仓库）
  direction: mysqlEnum("direction", ["IN", "OUT"]).notNull(), // 方向：IN=入库, OUT=出库
  quantity: varchar("quantity", { length: 50 }).notNull(), // 数量
  balance: varchar("balance", { length: 50 }).notNull(), // 结存数量
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockLedger = typeof stockLedger.$inferSelect;
export type InsertStockLedger = typeof stockLedger.$inferInsert;

// ============================================================================
// 审批配置表（approval_config）
// ============================================================================
export const approvalConfig = mysqlTable("approval_config", {
  id: int("id").autoincrement().primaryKey(),
  enabled: int("enabled").default(0).notNull(), // 是否启用审批（0=否，1=是）
  level: int("level").default(1).notNull(), // 审批级别（1或2）
  exemptSelf: int("exemptSelf").default(0).notNull(), // 自己提交的单据是否免审（0=否，1=是）
  approver1Id: int("approver1Id"), // 一级审批人 ID
  approver2Id: int("approver2Id"), // 二级审批人 ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalConfig = typeof approvalConfig.$inferSelect;
export type InsertApprovalConfig = typeof approvalConfig.$inferInsert;

// ============================================================================
// 审批记录表（approval_logs）
// ============================================================================
export const approvalLogs = mysqlTable("approval_logs", {
  id: int("id").autoincrement().primaryKey(),
  docId: int("docId").notNull(), // 单据 ID
  actorId: int("actorId").notNull(), // 审批人 ID
  action: varchar("action", { length: 20 }).notNull(), // 操作：approve/reject
  reason: text("reason"), // 审批意见/驳回原因
  level: int("level").notNull(), // 审批级别（1或2）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApprovalLog = typeof approvalLogs.$inferSelect;
export type InsertApprovalLog = typeof approvalLogs.$inferInsert;

// ============================================================================
// BOM预扣/发料/退回/平账表（bom_reservations）
// ============================================================================
export const bomReservations = mysqlTable("bom_reservations", {
  id: int("id").autoincrement().primaryKey(),
  bomId: int("bomId").notNull(), // BOM ID
  departmentId: int("departmentId").notNull(), // 部门ID（车间）
  materialId: int("materialId").notNull(), // 材料ID
  reserved: varchar("reserved", { length: 50 }).default("0").notNull(), // 预扣数量
  issued: varchar("issued", { length: 50 }).default("0").notNull(), // 已发数量
  returned: varchar("returned", { length: 50 }).default("0").notNull(), // 退回数量
  adjusted: varchar("adjusted", { length: 50 }).default("0").notNull(), // 平账数量
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BOMReservation = typeof bomReservations.$inferSelect;
export type InsertBOMReservation = typeof bomReservations.$inferInsert;
