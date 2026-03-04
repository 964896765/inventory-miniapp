# inventory-miniapp (Android + Expo SDK 54 + MySQL)

移动端库存管理工具（仅移动端，不做 Web）。

## 技术栈
- App: Expo (SDK 54) + Expo Router
- Backend: Node.js (Express) + tRPC
- DB: MySQL 8 (Docker)

## 默认账号
- `admin / 123456`

## 目录结构
- `app/`：移动端页面（Expo Router）
- `backend/`：后端服务（API + tRPC）

## 一键启动（推荐：Docker MySQL + 本地后端 + Expo）

### 1) 启动 MySQL（Docker）

```bash
cd backend
docker compose up -d
```

### 2) 初始化表结构 + 种子（创建 admin & 默认仓库）

```bash
cd backend
pnpm i
pnpm db:migrate
pnpm db:seed
```

### 3) 启动后端 API

```bash
cd backend
pnpm dev
# 默认监听 http://0.0.0.0:3000
```

### 4) 启动 App

```bash
cd ..
pnpm i
pnpm start
```

> 真机调试时，App 会自动用当前 Expo Dev Server 的局域网 IP 推导后端地址（默认 `http://<你的电脑IP>:3000`）。
> 也可以在项目根目录 `.env` 中手动指定：

```bash
EXPO_PUBLIC_API_URL=http://你的电脑局域网IP:3000
```

