#!/bin/bash
# 导出数据库结构和迁移文件

mkdir -p database-export

# 复制所有迁移文件
cp -r drizzle/*.sql database-export/ 2>/dev/null || true
cp -r drizzle/meta database-export/ 2>/dev/null || true

# 复制schema文件
cp drizzle/schema.ts database-export/

# 创建README
cat > database-export/README.md << 'DBEOF'
# 数据库文件说明

## 文件列表

1. **schema.ts** - 数据库表结构定义（Drizzle ORM）
2. **0001_*.sql ~ 0006_*.sql** - 数据库迁移文件（按顺序执行）
3. **meta/** - Drizzle Kit元数据

## 数据库表结构（14张表）

### 基础数据表（6张）
- users - 用户表
- warehouses - 仓库表（二级结构）
- categories - 材料分类表（二级结构）
- materials - 材料表
- supply_units - 供需单位表
- boms - BOM表

### 业务明细表（2张）
- bom_items - BOM材料清单表
- inventory - 库存结存表

### 单据系统表（3张）
- docs - 单据主表（8种单据类型）
- doc_items - 单据明细表
- stock_ledger - 库存流水表

### BOM发料管理表（1张）
- bom_reservations - BOM预扣/已发/退回/平账表

### 审批系统表（2张）
- approval_config - 审批配置表
- approval_logs - 审批记录表

## 初始化步骤

1. 创建MySQL数据库：
   ```sql
   CREATE DATABASE inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. 配置环境变量（.env文件）：
   ```
   DATABASE_URL=mysql://user:password@localhost:3306/inventory_db
   ```

3. 执行迁移：
   ```bash
   pnpm db:push
   ```

4. 初始化五大仓库：
   ```bash
   # 启动服务器后，调用API：
   # POST /api/warehouses.ensureDefaults
   ```

## 核心业务表说明

### bom_reservations（BOM发料管理）
- reserved: 预扣数量（预留功能）
- issued: 已发数量（按BOM发料累加）
- returned: 退回数量（退仓累加）
- adjusted: 平账数量（平账累加，正数=补扣，负数=退回）
- **结存 = issued - returned + adjusted**

### stock_ledger（库存流水）
- direction: IN（入库）/ OUT（出库）
- balance: 操作后的结存数量
- 可追溯每笔库存变动

### docs（单据主表）
支持8种单据类型：
- stock_in（入库）
- stock_out（出库）
- transfer（调拨）
- inventory_check（盘点）
- bom_issue（BOM发料）
- return（退仓）
- exchange（换料）
- adjustment（平账）

状态流转：
draft → submitted → approved/rejected → posted
DBEOF

echo "数据库文件导出完成！"
ls -lh database-export/
