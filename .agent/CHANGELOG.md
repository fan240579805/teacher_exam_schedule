# Agent Changelog

## 2026-06-22

### 初始化决策

- 采用 pnpm workspace monorepo：`apps/app` 为 uni-app 多端一码应用，`packages/core` 放纯领域逻辑，`packages/types` 放共享类型，`supabase` 放数据库与后端资源。
- 采用官方 `dcloudio/uni-preset-vue#vite-ts` 模板作为应用基线。
- pnpm 版本为 8.15.9，配置 `.npmrc` 使用 `shamefully-hoist=true`、`strict-peer-dependencies=false`、`auto-install-peers=true`，规避 uni-app 编译器在 workspace 下的依赖解析问题。
- 敏感配置只提交 `.env.example` 与 `manifest.json` 占位；真实值由用户填写，不进入版本库。
- Supabase 客户端不直接依赖浏览器 `fetch`，后续通过 `uni.request` / `uni.uploadFile` 自建多端访问层。
- 验收优先使用 `harness/html-preview` 本地 HTML + mock 数据，真实 Supabase 与微信小程序联调放到用户补齐配置之后。

### P0 验证

- `pnpm install` 已通过并生成 `pnpm-lock.yaml`。
- `pnpm type-check` 已通过，覆盖 `packages/types`、`packages/core`、`apps/app`。
- 原计划使用的 `qiun-data-charts` 在当前镜像不可用，首版燃尽图改为自建轻量组件，避免安装阻塞。

### P1 数据库设计

- 新增 `supabase/migrations/0001_init.sql`，包含七层邻接表、执行日志、复测、战果、面试检查单、RLS 与 RPC。
- 新增 `supabase/seed.sql`，提供深圳教综官方模板与级联目录示例。
- `.agent/schema.sql` 改为结构摘要并指向权威迁移，避免双份 SQL 漂移。

### P2 领域引擎

- 新增 `packages/types` 共享领域类型。
- 新增 `packages/core` 纯函数：`tree`、`dispatch`、`ebbinghaus`、`quota`、`settlement`。
- `pnpm --filter @teacher-exam/core test` 通过：7 个测试覆盖首页降维、串行锁、P0 复测、Amber Alert 与结算归一化。
- `pnpm harness:ebbinghaus` 通过，可在无 UI 情况下模拟 P0 复测任务注入。

### P3-P5 应用与验收

- 新增 `apps/app/src/services/supabase/client.ts`，使用 `uni.request` / `uni.uploadFile`，缺少 env 时进入 mock 模式。
- 新增 `apps/app/src/stores/study.ts` 与 mock 数据，串联任务生成、结算、串行解锁、热力更新与 Amber Alert。
- 替换默认首页，新增今日执行、知识树、仪表盘三栏页面。
- 新增 `harness/html-preview/index.html`，可直接本地打开，用 mock 数据验收核心流程。
- 验证通过：`pnpm test`、`pnpm type-check`、`pnpm build:h5`、`pnpm build:mp-weixin`。

### 工作流规则

- 新增 `.cursor/rules/multi-agent-workflow.mdc`，固化多 agent 独立 worktree、问题日志自记录、修复后自验证、审计后提交并推送的流程。

### 提交前审计修复

- 修复 `pickLowFrequencyLeaves` 对 `estimatedMinutes` 空值使用非空断言导致排序不稳定的问题。
- 补充 `KnowledgeNode.completedAt` 类型，使应用结算状态与数据库 `completed_at` 语义对齐。

### UI/UX Skill 规则

- 根据用户要求，后续任何 UI、视觉设计、交互、布局、导航、动画、图表或体验优化任务，必须先调用 `ui-ux-pro-max` skill，并遵循其可访问性、触控目标、响应式、排版、颜色与反馈规范。
