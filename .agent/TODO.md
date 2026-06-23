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

## P10 Tab 3「统计」/ Tab 4「我的」+ 周历改版（v6.0）

按 v6.0 需求文档落地三块功能 + PRD 同步 + Playwright 升级。

- [x] **首页周历改版**：DOM 改为「中文星期 + 日期数字 + 已打卡圆点」三段式，当日填充主题色圆形 + 反白文字；`weekDays` 从静态数组改为以"今天"为基准回退到本周一连续 7 天的 computed，结合 `dailyCheckins.checkinDate` 集合判定 `checked`。
- [x] **首页重置按钮**：文案「重置」→「↻ 重置计划」，样式从主题色描边改为透明底中灰字弱化按钮；`.hero` 改 `flex-start` 让长标题与按钮一行排齐。
- [x] **Tab 3 统计页**（[apps/app/src/pages/dashboard/index.vue](apps/app/src/pages/dashboard/index.vue)）整体重写：5x7=35 格热力日历（4 档颜色 + ⭐/▣ 徽章 + 图例条）+ 2x2 核心指标卡（完美达标天数 / 日均学习时长 / 已掌握考点 / 刷题正确率）+ 最近随笔列表 + 各科通关进度（统一为 "{N}% (掌握 a/b 考点)" 文案）+ 纯 CSS clip-path 实现的五维雷达图（时间把控/语言流畅/板书完整/教态/逻辑框架）。
- [x] **Tab 4 我的页**（[apps/app/src/pages/profile/index.vue](apps/app/src/pages/profile/index.vue)）新建：圆形主题色头像 + 同步状态 + 倒计时卡 + 复习计划管理 / 考点库管理 / 关于与帮助 三组列表 + 200rpx 虚线广告位占位 + 底部红线说明。
- [x] **每日任务上限调节器**：列表项内联 ⊖/⊕ + 数值显示，绑定 `store.dailyTaskCapHours`（区间 2-12）。
- [x] **暂不复习考点库**：单条恢复 + 一键全部恢复，调用 `store.restoreArchived()`，恢复后立即触发 `unlockNextSiblings`。
- [x] **本地日志清理**：红字 Danger 按钮，`uni.showModal` 二次确认后调用 `store.clearLocalCache()` 清 Storage + resetMock。
- [x] **tabBar 升级到 4 个 tab**：今日 / 知识树 / 统计 / 我的；`pages.json` 新增 `pages/profile/index` 注册并把 dashboard 标题改为"统计"。
- [x] **Pinia store 扩展**：新增 `actionLogs` / `dailyTaskCapHours` / `cloudSyncStatus` 三个 ref + 7 个 computed（`perfectDays` / `avgStudyHours` / `masteredCount` / `totalLeafCount` / `objectiveAccuracy` / `interviewRadar` / `daysUntilExam` / `archivedLeaves`）+ 2 个 action（`restoreArchived` / `clearLocalCache`）；`settleTask` 同步追加 `actionLogs` 让指标真实联动；`resetMock` 同步重置 `actionLogs`。
- [x] **Mock 数据扩展**：`mockHeatmap` 5 天 → 35 天（覆盖 5 周）+ 新增 `mockActionLogs`（3 条客观刷题/泛读历史日志，驱动初始"刷题正确率 87%"）。
- [x] **Playwright 验收升级到 65 项**：新增首页周历 3 + 统计页 18 + 我的页 17 + tabBar 5 共 33 项断言；新增 2 张截图（`7-profile-page` / `8-tabbar`）。修复 tabbar 隐藏后无法可见的脚本 bug，改用 `state: 'attached'` 并主动恢复 display。
- [x] **PRD 文档同步**：[prd_final.md](prd_final.md) 末尾新增「五、v6.0 增量需求」章节（9 小节）。
- [x] **验证全绿**：Playwright 65/65、`pnpm test` 10/10、`vue-tsc` 0 错误、`build:h5` + `build:mp-weixin` 双端通过。
- [ ] 用户侧最终验收（待用户执行）：微信开发者工具导入 `apps/app/dist/build/mp-weixin` 真机走查 4 个 tab：今日（新周历）/ 知识树 / 统计（热力日历 + 4 指标 + 雷达图）/ 我的（用户卡 + 3 组设置 + 广告位）。预期：所有页面文案为大白话、按钮单色一体、tabBar 4 个项正常切换。

## P10.1 首页打卡按钮贴底 + 统计页热力日历改为可切月月历

针对用户提交的 2 张真机截图反馈：①首页打卡按钮悬空在 tabBar 上方约 50px、下方仍能透出残缺的任务卡片；②统计页热力日历只是色块，看不出具体日期且无法选月。

- [x] **首页 `.checkin-bar` 紧贴 tabBar**：`bottom` 由 `calc(50px + safe-area)` 改为 `env(safe-area-inset-bottom)`，padding 微调；`.page` 底部 padding 从 `280rpx` 收紧至 `200rpx`，保证最后一张任务卡片可以完整滚出按钮区域。
- [x] **统计页热力日历改为「月历」视图**（[apps/app/src/pages/dashboard/index.vue](apps/app/src/pages/dashboard/index.vue)）：
    - 顶部新增 `<picker>` 月份选择器，自动收集 `store.heatmap` 中出现过的所有月份并补齐"当月"，文案格式 `YYYY 年 M 月 ▾`，浅灰胶囊样式。
    - 新增「一二三四五六日」7 列周表头与下方网格严格对齐。
    - 每个有效格子在中心展示日号（深色块上自动反白），占位格透明，当日格加 3rpx 主题色内描边高亮。
    - 颜色档位与图例保持原 4 档（无打卡灰 / 弱 / 中 / 强）。
    - `monthGrid` computed 实现：以选中月份的 `firstDay.getDay()` 计算前导占位、日数循环填日号、尾部补足 7 整倍占位，保证网格永远是 7 列对齐（28/35/42 格之一）。
- [x] **Playwright 验收脚本升级到 70 项**：新增 5 项断言（首页打卡按钮 `bottom < 10px` 贴底、月历 7 列对齐、有效格子全部显示日号、月份选择器存在并显示「YYYY 年 M 月」、周表头一~日 7 列）。
- [x] **验证全绿**：Playwright 70/70、`pnpm test` 10/10、`vue-tsc` 0 错误、`build:h5` + `build:mp-weixin` 双端通过。
- [x] 截图复核：`2-dashboard-initial.png` 视觉确认 6 月月历 30 天 + 当日 24 号绿色描边 + 多日深绿格、`1-home-default.png` 视觉确认底部 padding 收紧。
- [ ] 用户侧最终验收（待用户执行）：微信开发者工具导入 `apps/app/dist/build/mp-weixin` 真机确认：①首页底部打卡按钮紧贴 tabBar 顶部、列表底部留白合适不再被遮挡；②统计页打卡日历显示当月每一天的日号、当日有主题色描边、点击右上角月份选择器可切换历史月份查看历史打卡分布。
