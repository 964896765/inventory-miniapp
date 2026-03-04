# Inventory Backend (Express + MySQL)

## 1) 安装
```bash
cd backend
pnpm install   # 或 npm install
```

## 2) 配置环境变量
复制并修改：
```bash
cp .env.example .env
```

## 3) 初始化数据库
先确保 MySQL 已创建数据库 `inventory`（或你在 .env 里配置的 DB_NAME）。

执行：
```bash
pnpm db:migrate
pnpm db:seed
```

默认管理员：
- username: admin
- password: admin123

## 4) 启动
```bash
pnpm dev
```

## 5) 前端对接
前端 `.env`：
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
```

> 注意：分享“跳转微信并发送到群/个人”受微信限制，只能调用系统 Share 面板，让用户自己选择微信对象。
