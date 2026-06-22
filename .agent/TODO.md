# Agent TODO

本文件是项目可交接进度清单。每项完成后必须经过对应验证再勾选。

## P0 初始化

- [x] 创建 pnpm workspace monorepo 基础目录。
- [x] 生成 `apps/app` uni-app Vue3 + Vite + TS 模板。
- [x] 创建 `packages/types` 与 `packages/core` 基础包。
- [x] 创建 `.env.example`，只保留 Supabase 与小程序敏感配置占位。
- [x] 安装依赖并验证 `pnpm install`。
- [x] 验证 `pnpm dev:h5` 可启动空壳或至少通过类型检查。

## P1 数据库优先

- [x] 编写 `supabase/migrations/0001_init.sql`。
- [x] 编写 `supabase/seed.sql`。
- [x] 同步 `.agent/schema.sql`。
- [x] 设计 RLS、RPC：`clone_template`、`settle_node`。

## P2 领域引擎

- [x] 完成共享类型。
- [x] 完成 `tree` 纯函数与测试。
- [x] 完成 `dispatch` 纯函数与测试。
- [x] 完成 `ebbinghaus` 纯函数与模拟脚本。
- [x] 完成 `quota` 与 Amber Alert 纯函数。
- [x] 完成 `settlement` 动作结算纯函数。

## P3 应用地基

- [x] 完成 Supabase `uni.request` 客户端与 mock fallback。
- [x] 完成 Pinia stores 与持久化。
- [x] 完成路由、tabBar、基础主题。
- [x] 完成登录/工作区/首页骨架。

## P4 PRD 核心功能

- [x] 冷启动与工作区。
- [x] 七层知识树与穿透页。
- [x] 双轨调度与预警。
- [x] 执行结算台。
- [x] 仪表盘与面试规范。

## P5 验收

- [x] 完成本地 HTML 验收页。
- [x] 使用 mock 数据验收核心流程。
- [x] 构建 H5。
- [x] 构建微信小程序产物。
- [x] QA 人格复核并回写日志。
