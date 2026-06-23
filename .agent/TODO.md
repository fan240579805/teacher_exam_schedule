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

## P7 知识树重构为书架 + 可编辑思维导图

知识树 Tab 从七层 nodes 列表重构为「复习书架 + 思维导图」。新增 `books`、`book_nodes` 数据模型（迁移 `supabase/migrations/0002_books.sql`）。

- [x] 新增 `Book`/`BookNode`/`BookTreeNode` 等共享类型与 `CreateBookInput`、`UpsertBookNodeInput`。
- [x] 新增核心纯函数 `buildBookTree`、`collectSubtreeIds`、`nextOrderIndex` 并补单测。
- [x] 新增 `useLibraryStore`、`data/library.ts` mock，支持书目与节点本地持久化、增删改、连续排序。
- [x] 重构 `pages/tree/index.vue` 为书架：书目封面网格、新增/编辑/删除、封面色选择。
- [x] 新增 `pages/mindmap/index.vue` 可编辑思维导图：左右向布局、连接线、主副标题、点击展开/收起、长按编辑、新增子/同级节点、删除子树、新增主分支。
- [x] 思维导图采用「绝对定位 + 计算布局 + view 连接线」非递归实现，规避 uni-app vue3 递归组件在微信小程序 `usingComponents` 为空导致子层不渲染的问题，保证 H5 与小程序双端一致。
- [x] 编辑统一使用底部面板（小程序不支持 contenteditable），交互流畅。
- [x] 注册 `pages/mindmap/index` 路由（非 tabBar）。
- [x] 修复 tabBar 页底部弹窗被原生 tabBar 遮挡：提升弹窗层级并增加底部留白。
- [x] 同步 `supabase/migrations/0002_books.sql` 与 `.agent/schema.sql` 摘要。
- [x] 严格验收：类型检查、单测（10 条）、H5/小程序构建、IDE lints、浏览器逐功能走查均通过。
- [x] 修复 dev:h5 报「does not provide an export named 'buildBookTree'」：清理 `apps/app/node_modules/.vite` 缓存并重启；记录「新增 workspace 导出后需重启 dev」规则到 STATE/CHANGELOG。

## P8 微信小程序真机调试修复

针对微信开发者工具真机调试出现的 `Can't find variable: __wxAppCode__` 与 `routeDone webviewId not found` 报错。

- [x] 定位根因：`manifest.json` 顶层 `appid` 错填了微信小程序 AppID（该位置是 5+App 标识），`mp-weixin.appid` 留空导致小程序产物无有效 AppID、运行时不注入 `__wxAppCode__`。
- [x] 修复 `apps/app/src/manifest.json`：顶层 `appid` 置空，`mp-weixin.appid` 填 `wxf68746786a764562`。
- [x] 补齐 `mp-weixin.setting`：`es6=true`、`minified=true`、`postcss=true`，并新增 `lazyCodeLoading: requiredComponents`。
- [ ] 用户侧验证（待用户执行）：重新 `pnpm --filter @teacher-exam/app run dev:mp-weixin`，微信开发者工具导入产物目录 `apps/app/dist/dev/mp-weixin`，确认 AppID 显示为 `wxf68746786a764562`，清缓存→普通编译并真机调试通过。

## P9 文案、UI 与模块燃尽数据结构改造

按 PRD §四 Tab3「Burndown Charts」严格对齐：模块燃尽以 L2 大模块为基准，多条横向进度条与首页结算实时联动；同步完成全站文案去 AI 化与按钮 UI 一致性修复。

- [x] mock 数据扩充为 3 个 L2 模块 × 14 个 L7 叶子（教综 6 + 学科 5 + 职业能力 3），所有标题、`trapMemo`、`mockDailyCheckins.memo` 改写为真实考编生口吻。
- [x] 全 UI 文案去 AI 化：首页（航向修正/动作结算台/闭环/Quota/避坑/已闭环）、仪表盘（Dashboard & Asset Vault/战果照片）、打卡弹窗（高保真执行）、manifest 描述。
- [x] 首页「重置」按钮改为透明底 + 主题色描边 + 主题色字的次级按钮规范。
- [x] 首页打卡按钮未就绪态改为浅灰底 + 灰字（`#e5e7eb` + `#9ca3af`），与就绪态主题色形成清晰对比。
- [x] `DailyCheckinModal` 关闭按钮 border/字色统一，连续天数文案从战损红改为主题色，按钮组加 `::after` reset。
- [x] `App.vue` 全局补 `button::after { border: none }`，彻底清除 uni-app H5/小程序原生 button 的 1rpx 幽灵灰边。
- [x] `stores/study.ts` 新增 `moduleBurndown` computed（基于 L2 邻接表 BFS 收集后代叶子），与 nodes 响应式联动。
- [x] `resetMock` 改为 JSON 深拷贝避免 mock 字面量被污染。
- [x] 仪表盘整体重写：新增「今日任务进度」卡 + 多模块燃尽多条横向进度条 + 三档颜色 + 百分比。
- [x] 数据模型零侵入：仍是单表 `knowledge_nodes`，迁移 Supabase 时只替换 mockNodes 注入源即可。
- [x] 新增 Playwright 严格验收脚本 `harness/playwright-verify.mjs`：Node 静态服务器 + chromium iPhone 视口，24 项断言覆盖文案/视觉/结构/联动/残留，落 4 张关键截图。
- [x] 装 `playwright` 1.61.0 至 root devDependencies，`npx playwright install chromium` 下载本地浏览器内核。
- [x] 验证全绿：`pnpm test`（10 条单测）、`pnpm type-check`、`pnpm build:h5`、`pnpm build:mp-weixin`、Playwright 24/24。
- [ ] 用户侧最终验收（待用户执行）：微信开发者工具导入 `apps/app/dist/build/mp-weixin` 真机走查首页、仪表盘、打卡弹窗三个画面；连续完成 2 个任务确认对应 L2 模块燃尽 0→2 平滑递增。

## P9.1 真机截图按钮渐变伪影修复

针对用户提交的 5 张真机截图反馈：①未就绪打卡按钮文字不可读；②就绪态打卡按钮渐变伪影；③sheet 标记完成按钮渐变；④Modal 关闭按钮 × 灰圆底未生效；⑤Modal 底部按钮组渐变。根因：uni-app H5 双层 button 结构外层 uni-button 默认灰底未被重置。

- [x] App.vue 全局新增三层 button reset：`uni-button,button{background:transparent;...}` + `[disabled]{background-color:transparent}` + `:after{display:none!important}`。
- [x] 首页 `.primary-button` / `.ghost-button` / `.text-button` / `.checkin-button` 全部加 `!important` 强制覆盖 uni-button 默认样式。
- [x] 首页打卡按钮未就绪态字色从浅灰 `#9ca3af` 升级为中灰 `#4b5563`、底色从 `#e5e7eb` 加深到 `#d1d5db` 以保证可读。
- [x] 打卡按钮加 `[disabled]{opacity:1}` 防止 uni-app 把 disabled 按钮压暗。
- [x] DailyCheckinModal `.close-button` `.later-button` `.save-button` 全部加 `!important` 与 `::after{display:none}` reset。
- [x] Playwright 验收脚本升级到 **32 项断言**：新增 8 项 `getComputedStyle` 严格 RGB 匹配（打卡按钮可读色、结算主按钮主题色、Modal 关闭/保存/以后再说三按钮各自背景与字色）。
- [x] Playwright 脚本通过 `page.evaluate` 隐藏 `uni-tabbar.uni-tabbar-bottom` 解决 fixed tabbar 拦截 sheet 底部按钮 click 的问题（不能用 force click，会跳过 vue 事件冒泡）。
- [x] 截图复核 6 张：1-home-default（未就绪打卡按钮单色）、5-sheet-primary-button（标记完成单色）、6-checkin-modal（关闭按钮圆底 + 底部单色）目视确认无渐变。
- [x] 验证全绿：Playwright 32/32、`pnpm test` 10/10、`vue-tsc` 0 错误、`build:h5` + `build:mp-weixin` OK。
- [x] mp-weixin 产物 `app.wxss` 确认完整保留 button 双重 reset，小程序端兼容。
- [ ] 用户侧最终验收（待用户执行）：微信开发者工具导入 `apps/app/dist/build/mp-weixin` 真机走查三处按钮：①首页底部打卡按钮（未就绪+就绪两态）；②sheet 标记完成主按钮；③打卡随笔弹窗 × 与底部「以后再说/保存记录」按钮组。预期：所有按钮单色一体填充、无渐变/双色、无 1rpx 灰描边。
