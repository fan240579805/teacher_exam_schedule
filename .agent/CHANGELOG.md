# Agent Changelog

## 2026-06-23

### 终版 PRD 同步修正

- 确认 `prd_final.md` 已成为当前权威需求文档，重点新增“首页底部固定终极打卡按钮”“打卡随笔弹窗”“`daily_checkins` 全局打卡日志”“热力月历图片标记”等终版交互与数据要求。
- 补记进度断档：最近一次提交 `feat: prd updaye --story=000000` 只更新了 `prd_final.md`、`prd_v1.md`、`prd_v2.md`、`prd_v3.md`，未同步 `.agent/TODO.md`、`.agent/STATE.json`、`.agent/CHANGELOG.md`。
- 当前代码仍处于首版 mock 验收完成状态：已有首页任务卡片、半屏动作结算台、双轨调度纯函数、Amber Alert、热力 mock；尚未实现终版独立 `DailyCheckinModal`、`daily_checkins` 表、随笔图片上传与底部大按钮主动打卡仪式。
- 本次修正仅更新文档与进度状态，不改业务代码、不运行构建、不提交。

### 中文规范

- 后续所有 PRD、计划、进度、日志、状态、提交信息和交接说明均必须使用中文。
- 技术名词、文件名、表名、函数名、命令名可以保留英文原文，但解释和提交描述必须使用中文。

### P6 终版 PRD 实现与验收

- 数据库迁移从旧 `artifacts` 调整为 `daily_checkins`，增加 `checkin_date`、`streak_days`、`memo`、`image_url` 与工作区日期唯一约束，并同步 RLS、索引和 `.agent/schema.sql` 摘要。
- 共享类型新增 `DailyCheckin`、`CreateDailyCheckinInput`，热力图字段调整为 `hasCheckin` 与 `imageUrl`。
- Store 新增每日打卡记录、本地持久化、连续天数计算、终极打卡保存、图片上传、L7 叶子节点修剪和 mock 模板重载能力。
- 首页新增底部固定终极打卡按钮：任务未清空时灰色不可点击，任务清空后高亮并打开 `DailyCheckinModal`。
- 新增 `apps/app/src/components/DailyCheckinModal.vue`，支持随笔、限 1 张图片、以后再说、保存记录和保存中反馈。
- 仪表盘热力月历改为读取打卡记录图片标记，并展示最近打卡随笔；规划页补齐 L7 修剪与模板库克隆入口；本地 HTML harness 同步终版打卡语义。
- 修复串行推进边界：`archived` 叶子节点视为已从拓扑调度中修剪，不再阻塞后续兄弟节点解锁，并新增核心单测覆盖。
- 验证通过：`pnpm type-check`、`pnpm test`（8 条核心单测）、`pnpm build:h5`、`pnpm build:mp-weixin`、IDE lints。
- 剩余真实环境风险：Supabase Auth token、Storage bucket 访问策略、微信开发者工具真机图片上传仍需用户补齐真实配置后联调。

### 浏览器验收补充

- 使用浏览器访问 H5 构建产物，对照 `prd_final.md` 验收首页任务流、半屏动作结算台、底部终极打卡按钮、`DailyCheckinModal`、仪表盘热力图/最近随笔、知识树 L7 修剪和模板库入口。
- 浏览器验收发现并修复问题：复测任务结算后仍因过期 `reviews` 留在 P0 队列，导致任务无法真正清空。修复为结算后更新该节点下一次复测时间，避免同日重复派发。
- 修复后重新浏览器验收通过：P0 复测结算后消失，剩余任务清空后底部按钮变为 `已完成今日所有任务，去打卡`，保存随笔后显示 `今日已打卡，连续 1 天`。
- 仪表盘浏览器验收通过：最近打卡随笔出现本次验收文本，热力月历展示图片标记，燃尽进度展示 `3/3`。
- 知识树浏览器验收通过：L7 叶子可移入回收站并变为 `archived`，模板库按钮可重新载入官方 mock 模板。

### P7 知识树重构为书架 + 可编辑思维导图

- 按需求把「知识树」Tab 从七层 nodes 列表重构为「复习书架 + 思维导图」：书架展示用户自定义复习书目（如《教育心理学》《特殊教育学》），点击进入该书可编辑思维导图。
- 重设计数据结构：新增 `Book`（书名/作者/封面色/排序）与 `BookNode`（parent_id 邻接表、主标题 title、副标题 subtitle、排序）共享类型；新增迁移 `supabase/migrations/0002_books.sql`（含索引、updated_at 触发器、按 owner 的 RLS）。
- 新增核心纯函数 `buildBookTree`、`collectSubtreeIds`、`nextOrderIndex` 并补 1 组（2 个）单测（核心单测由 8 增至 10 条）。
- 新增 `useLibraryStore` 与 `data/library.ts` mock：书目与节点本地持久化、增删改、连续天数排序、删除整本书级联清空节点。
- 书架页 `pages/tree/index.vue`：封面网格、长按编辑、新增/删除书目、封面色选择，风格与全站统一（米色背景、白卡片、执行绿主色）。
- 思维导图页 `pages/mindmap/index.vue`：左右向布局、view 连接线、节点主副标题、点击展开/收起、长按编辑、新增子/同级节点、删除子树、`+ 主分支`，编辑用底部面板（小程序不支持 contenteditable）。
- 关键兼容性决策：uni-app vue3 递归组件在微信小程序产物中 `usingComponents` 为空、子层级不渲染；故思维导图改用「JS 计算布局 + 绝对定位节点 + 计算坐标连接线」非递归方案，H5 与小程序均为迭代 `wx:for` 渲染，双端一致且流畅。
- 修复 tabBar 页底部弹窗被原生 tabBar 遮挡：将书架与思维导图弹窗 `z-index` 提升到 999 并增加底部留白。
- 浏览器（H5）逐功能验收通过：书架渲染/新增书目/封面色/持久化；思维导图渲染/连接线/折叠展开/编辑保存/新增子节点/删除确认/新增主分支；首页与仪表盘无回归。
- 验证通过：`pnpm type-check`、`pnpm test`（10 条）、`pnpm build:h5`、`pnpm build:mp-weixin`、IDE lints。
- 说明：本次 books/book_nodes 暂为本地（uni storage）持久化，真实 Supabase 读写待用户补齐配置后接入；迁移与 RLS 已先行就绪。

### 运维备忘：新增 workspace 导出后需重启 dev

- 现象：`pages/tree/index` 报 `SyntaxError: ... does not provide an export named 'buildBookTree'`。
- 原因：`dev:h5` 在 `@teacher-exam/core` 新增导出之前已启动，Vite 把旧版本 `@teacher-exam/core` 预打包进 `apps/app/node_modules/.vite` 缓存，运行时找不到新导出（源码、`type-check`、两端 `build` 均正常）。
- 处理：停掉占用 5173 的旧 dev → 删除 `apps/app/node_modules/.vite` 缓存 → 重新 `npm run dev:h5` 强制重新预打包；浏览器复验书架与思维导图均正常。
- 规则（务必记住）：凡新增/改动了向 workspace 包（如 `@teacher-exam/core`、`@teacher-exam/types`）导出的内容后，必须重启 `dev:h5`（或删除 `apps/app/node_modules/.vite` 缓存），否则 Vite 预打包缓存仍是旧版本。

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
