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

## P6 终版 PRD 对齐

当前权威需求文档：`prd_final.md`。P0-P5 代表首版工程与 mock 验收完成，不代表终版 PRD 已全部实现。

- [x] 补记 `prd_final.md` 提交后未同步 `.agent` 进度文档的问题。
- [x] 明确后续所有计划、进度、日志、状态、文档和提交信息必须使用中文。
- [x] 将数据库设计从旧 `artifacts` 每日战果语义调整为 `daily_checkins` 全局终极打卡日志，字段包含 `workspace_id`、`checkin_date`、`streak_days`、`memo`、`image_url`。
- [x] 同步共享类型、Supabase 访问层与 mock 数据，支持每日打卡记录、连续天数和限 1 张图片。
- [x] 改造首页底部固定大打卡按钮：任务未清空时灰色不可点击并显示进度，任务清空后高亮并触发打卡随笔。
- [x] 新增 `components/DailyCheckinModal.vue`：连续天数状态卡、随笔输入、图片上传、`以后再说`、`保存记录` 与成功反馈。
- [x] 保持半屏动作结算台只负责单项任务客观结算，结算完成后任务卡片划线、淡出并更新底部打卡按钮进度。
- [x] 仪表盘热力月历改为读取 `daily_checkins`，上传图片的日期叠加图片标记。
- [x] 规划页补齐 L7 叶子节点左滑修剪、回收站语义与模板库克隆入口。
- [x] 完成 P6 窄范围验证：`pnpm type-check`、`pnpm test`、`pnpm build:h5`、`pnpm build:mp-weixin`、IDE lints、浏览器 H5 功能验收均通过。
