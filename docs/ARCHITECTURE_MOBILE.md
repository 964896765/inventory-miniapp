# 移动端架构文档

> 项目基线扫描结果 - Phase 0
> 生成时间：2026-02-27
> 技术栈：Expo Router + React Native + tRPC + Drizzle + MySQL

---

## 1. 项目概述

**项目名称**：inventory-miniapp-taro（库存管理工具）

**定位**：移动端仓储ERP系统

**技术栈**：
- 前端：React Native 0.81 + Expo SDK 54 + Expo Router 6
- 样式：NativeWind 4 (Tailwind CSS)
- 状态管理：React Query + tRPC
- 后端：Express + tRPC
- 数据库：MySQL + Drizzle ORM
- 类型安全：TypeScript 5.9

---

## 2. 当前路由结构

### 2.1 底部导航（Tabs）

```
app/(tabs)/
├── _layout.tsx          # Tab导航配置
├── index.tsx            # 首页（Home）
├── workspace.tsx        # 工作台（Workspace）
└── profile.tsx          # 我的（Profile）
```

**Tabs说明**：
- **首页**：总览与入口（✅ 不改UI，只补数据和跳转）
- **工作台**：当前为基础页面（⚠️ 需要重构为五仓联动）
- **我的**：个人信息、基础资料入口（⚠️ 需要添加成员管理、权限配置、审批配置）

### 2.2 功能模块路由

#### 基础资料模块
```
app/
├── warehouses/          # 仓库管理
│   ├── index.tsx        # 仓库列表
│   ├── add.tsx          # 添加仓库
│   └── edit.tsx         # 编辑仓库
├── categories/          # 材料分类
│   ├── index.tsx        # 分类列表
│   ├── add.tsx          # 添加分类
│   └── edit.tsx         # 编辑分类
├── materials/           # 材料管理
│   ├── index.tsx        # 材料列表
│   ├── add.tsx          # 添加材料
│   ├── edit.tsx         # 编辑材料
│   └── detail.tsx       # 材料详情
├── supply-units/        # 供需单位
│   ├── index.tsx        # 供需单位列表
│   ├── add.tsx          # 添加供需单位
│   ├── edit.tsx         # 编辑供需单位
│   └── detail.tsx       # 供需单位详情
├── bom/                 # BOM管理
│   ├── index.tsx        # BOM列表
│   ├── add.tsx          # 添加BOM
│   ├── edit.tsx         # 编辑BOM
│   └── detail.tsx       # BOM详情
└── units/               # 单位管理
    ├── index.tsx        # 单位列表
    ├── add.tsx          # 添加单位
    └── edit.tsx         # 编辑单位
```

#### 操作模块
```
app/operations/
├── stock-in.tsx         # 入库
├── stock-out.tsx        # 出库
├── transfer.tsx         # 调拨
├── inventory-check.tsx  # 盘点
└── select-materials.tsx # 材料选择（公共组件）
```

**缺失功能**（需要添加）：
- ❌ BOM发料
- ❌ 退仓
- ❌ 换料
- ❌ 平账
- ❌ 审批作业

#### 记录模块
**当前状态**：❌ 未实现

**需要添加**：
- 单据记录
- 材料流水
- 审批记录

#### 其他
```
app/
├── operation-types/     # 操作类型选择
│   └── index.tsx
├── profile/             # 个人信息
│   └── personal-info.tsx
├── dev/                 # 开发工具
│   └── theme-lab.tsx
└── oauth/               # OAuth回调
    └── callback.tsx
```

---

## 3. 数据库表结构

### 3.1 现有表结构

#### users（用户表）
```sql
- id: int (PK, AUTO_INCREMENT)
- openId: varchar(64) UNIQUE NOT NULL
- name: text
- email: varchar(320)
- loginMethod: varchar(64)
- role: enum('user', 'admin') DEFAULT 'user'
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
- lastSignedIn: timestamp DEFAULT NOW()
```

#### warehouses（仓库表）
```sql
- id: int (PK, AUTO_INCREMENT)
- name: varchar(255) NOT NULL
- parentId: int (NULL=一级仓库, 非NULL=子仓库)
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

**当前问题**：
- ❌ 缺少 `sort` 字段（用于五大仓库排序）
- ❌ 缺少默认五大仓库数据

#### categories（材料分类表）
```sql
- id: int (PK, AUTO_INCREMENT)
- name: varchar(255) NOT NULL
- parentId: int (NULL=一级分类, 非NULL=子分类)
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

#### materials（材料表）
```sql
- id: int (PK, AUTO_INCREMENT)
- name: varchar(255) NOT NULL
- categoryId: int NOT NULL
- unit: varchar(50) NOT NULL
- specification: varchar(255)
- imageUrl: varchar(500)
- barcode: varchar(255)
- inboundPrice: varchar(50)
- outboundPrice: varchar(50)
- stockAlert: int
- expiryDate: varchar(50)
- notes: text
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

#### supply_units（供需单位表）
```sql
- id: int (PK, AUTO_INCREMENT)
- name: varchar(255) NOT NULL
- type: enum('customer', 'supplier', 'department', 'other') NOT NULL
- contact: varchar(255)
- phone: varchar(50)
- address: text
- notes: text
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

**说明**：
- ✅ 已包含 `department` 类型（用于部门管理）

#### boms（BOM表）
```sql
- id: int (PK, AUTO_INCREMENT)
- name: varchar(255) NOT NULL
- code: varchar(100) UNIQUE NOT NULL
- notes: text
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

#### bom_items（BOM材料清单表）
```sql
- id: int (PK, AUTO_INCREMENT)
- bomId: int NOT NULL
- materialId: int NOT NULL
- quantity: varchar(50) NOT NULL
- unit: varchar(50) NOT NULL
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

#### inventory（库存表）
```sql
- id: int (PK, AUTO_INCREMENT)
- materialId: int NOT NULL
- warehouseId: int NOT NULL
- quantity: varchar(50) NOT NULL DEFAULT '0'
- updatedAt: timestamp DEFAULT NOW() ON UPDATE NOW()
```

### 3.2 缺失的表（需要在后续Phase添加）

#### docs（单据主表）
**状态**：❌ 未创建

**需要字段**：
- id, docType, docNo, status, warehouseId, departmentId, createdBy, createdAt, submittedAt, approvedAt, postedAt

#### doc_items（单据明细表）
**状态**：❌ 未创建

**需要字段**：
- id, docId, materialId, quantity, unitPrice, batchNo, remark

#### stock_ledger（库存流水表）
**状态**：❌ 未创建

**需要字段**：
- id, docId, materialId, warehouseId, departmentId, direction (IN/OUT), quantity, balance, createdAt

#### approval_config（审批配置表）
**状态**：❌ 未创建

**需要字段**：
- id, enabled, level (1/2), exemptSelf, approver1Id, approver2Id

#### approval_logs（审批记录表）
**状态**：❌ 未创建

**需要字段**：
- id, docId, actorId, action (approve/reject), reason, level, createdAt

#### team_members（团队成员表）
**状态**：❌ 未创建

**需要字段**：
- id, userId, teamId, role, permissions (JSON), createdAt

#### permissions（权限点定义表）
**状态**：❌ 未创建

**需要字段**：
- id, key, name, description

---

## 4. tRPC接口清单

### 4.1 现有接口

#### auth（认证）
- `auth.me` - 获取当前用户信息
- `auth.logout` - 退出登录

#### warehouses（仓库管理）
- `warehouses.list` - 获取所有仓库
- `warehouses.get(id)` - 获取单个仓库
- `warehouses.create(data)` - 创建仓库
- `warehouses.update(id, data)` - 更新仓库
- `warehouses.delete(id)` - 删除仓库

#### categories（材料分类）
- `categories.list` - 获取所有分类
- `categories.get(id)` - 获取单个分类
- `categories.create(data)` - 创建分类
- `categories.update(id, data)` - 更新分类
- `categories.delete(id)` - 删除分类

#### materials（材料管理）
- `materials.list` - 获取所有材料
- `materials.get(id)` - 获取单个材料
- `materials.create(data)` - 创建材料
- `materials.update(id, data)` - 更新材料
- `materials.delete(id)` - 删除材料

#### supplyUnits（供需单位）
- `supplyUnits.list` - 获取所有供需单位
- `supplyUnits.get(id)` - 获取单个供需单位
- `supplyUnits.create(data)` - 创建供需单位
- `supplyUnits.update(id, data)` - 更新供需单位
- `supplyUnits.delete(id)` - 删除供需单位

#### boms（BOM管理）
- `boms.list` - 获取所有BOM
- `boms.get(id)` - 获取单个BOM（含材料清单）
- `boms.create(data)` - 创建BOM
- `boms.update(id, data)` - 更新BOM
- `boms.delete(id)` - 删除BOM

### 4.2 缺失的接口（需要在后续Phase添加）

#### warehouses（仓库管理扩展）
- ❌ `warehouses.ensureDefaults()` - 确保五大仓库存在
- ❌ `warehouses.listTop()` - 获取五大顶级仓库

#### supplyUnits（供需单位扩展）
- ❌ `supplyUnits.listDepartments()` - 获取所有部门

#### inventory（库存管理）
- ❌ `inventory.getByWarehouse(warehouseId, keyword, page)` - 按仓库查询库存
- ❌ `inventory.getByDepartment(departmentId, keyword, page)` - 按部门查询库存

#### ledger（库存流水）
- ❌ `ledger.listByMaterial(materialId, filters)` - 查询材料流水

#### docs（单据管理）
- ❌ `docs.createDraft(docType, ...)` - 创建单据草稿
- ❌ `docs.submit(docId)` - 提交单据
- ❌ `docs.post(docId)` - 过账单据

#### approval（审批管理）
- ❌ `approval.getConfig()` - 获取审批配置
- ❌ `approval.setConfig(data)` - 设置审批配置
- ❌ `approval.listTasks(filters)` - 获取审批任务列表
- ❌ `approval.approve(docId, comment)` - 审批通过
- ❌ `approval.reject(docId, reason)` - 审批驳回
- ❌ `approval.listLogs(filters)` - 获取审批记录

#### team（团队管理）
- ❌ `team.listMembers()` - 获取团队成员
- ❌ `team.inviteMember(email)` - 邀请成员
- ❌ `team.updateMemberPermissions(memberId, permissions)` - 更新成员权限

#### permissions（权限管理）
- ❌ `permissions.list()` - 获取所有权限点
- ❌ `permissions.check(userId, permissionKey)` - 检查权限

---

## 5. 组件结构

### 5.1 核心组件

#### 布局组件
- `ScreenContainer` - 安全区容器（已实现）
- `ThemedView` - 主题视图（已实现）

#### UI组件
- `IconSymbol` - 图标组件（已实现）
- `HapticTab` - 触觉反馈Tab（已实现）

### 5.2 缺失的组件（需要在Phase 3添加）

#### 工作台组件
- ❌ `WarehouseTabs` - 五仓横向Tabs（支持吸顶）
- ❌ `LeftList` - 左侧列表（分类/部门）
- ❌ `MaterialList` - 右侧材料列表
- ❌ `BottomActionBar` - 底部操作按钮栏
- ❌ `EmptyState` - 空状态组件
- ❌ `SearchBar` - 搜索栏组件

---

## 6. 数据流架构

### 6.1 当前数据流

```
前端组件
    ↓ (tRPC Client)
tRPC Router (server/routers.ts)
    ↓
数据库操作 (server/db.ts)
    ↓ (Drizzle ORM)
MySQL数据库
```

### 6.2 缺失的数据流层

**库存三层架构**（需要在Phase 2实现）：
```
单据层 (docs / doc_items)
    ↓
流水层 (stock_ledger)
    ↓
库存层 (inventory)
```

**审批流程**（需要在Phase 5实现）：
```
单据提交
    ↓
审批配置检查 (approval_config)
    ↓
审批任务生成
    ↓
审批动作 (approve/reject)
    ↓
审批记录 (approval_logs)
    ↓
单据过账
```

---

## 7. 关键业务规则

### 7.1 五大仓库结构

**默认仓库**（需要在Phase 1创建）：
1. 主材仓
2. 车间仓
3. PACK仓
4. 辅料仓
5. 待处理

**排序要求**：
- 必须按上述顺序显示
- 需要添加 `sort` 字段支持排序

### 7.2 部门结存规则（核心规则）

**实现方案**（推荐方案A）：
- 车间仓作为父仓库
- 每个部门对应一个子仓库（departmentWarehouse）
- 部门来自 `supply_units` 表（type='department'）

**关键规则**：
- 出库到车间仓 = 主材仓OUT + 部门仓IN
- BOM发料 = 出库到车间仓部门仓
- 不可只扣主材而不增加部门结存

### 7.3 BOM发料规则

**业务逻辑**：
1. 选择BOM编号
2. 选择部门
3. 加载BOM材料清单
4. 执行发料（等价于出库到车间仓部门仓）
5. 主材仓减少，部门仓增加

---

## 8. 技术约束

### 8.1 不可变更的部分

1. ✅ **首页UI**：布局不改，只补数据和跳转逻辑
2. ✅ **技术栈**：Expo Router + React Native + tRPC + Drizzle + MySQL
3. ✅ **底部导航**：首页/工作台/我的三个Tab

### 8.2 必须重构的部分

1. ⚠️ **工作台**：重构为五仓Tabs + 双栏联动 + 底部按钮
2. ⚠️ **我的页面**：添加成员管理、权限配置、审批配置
3. ⚠️ **操作模块**：添加BOM发料、退仓、换料、平账、审批作业
4. ⚠️ **记录模块**：添加单据记录、材料流水、审批记录

---

## 9. 下一步计划

### Phase 1：基础资料与默认数据
- 创建五大仓库默认数据
- 添加 `warehouses.sort` 字段
- 完善BOM管理功能
- 确保部门数据完整

### Phase 2：库存与部门结存模型
- 创建 `docs`, `doc_items`, `stock_ledger` 表
- 实现车间仓子仓库（部门仓）
- 建立库存三层架构

### Phase 3：工作台重构
- 实现五仓Tabs（支持吸顶）
- 实现左右双栏联动
- 添加底部操作按钮

### Phase 4-8：
- 见 `MOBILE_TASKS.md` 详细任务清单

---

## 10. 文件清单

### 已创建文档
- ✅ `MOBILE_TASKS.md` - 任务清单
- ✅ `ARCHITECTURE_MOBILE.md` - 本文档

### 待创建文档
- ❌ `CONSTRAINTS.md` - 约束文档
- ❌ `MOBILE_SPEC.md` - 功能规格说明
- ❌ `API_SPEC.md` - API接口规格
- ❌ `DB_MIGRATIONS.md` - 数据库迁移文档
- ❌ `ACCEPTANCE.md` - 验收清单

---

**文档版本**：v1.0
**最后更新**：2026-02-27
**状态**：Phase 0 完成
