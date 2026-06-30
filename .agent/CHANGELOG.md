# Agent Changelog

## 2026-06-30 — P14.1 修复 dev 控制台报错 + 新增「验收查控制台」规范

- **现象**：dev 报 `SyntaxError: ... does not provide an export named 'analyzeDrillMock' (study.ts)`，首页白屏。
- **根因**：P14 给 `@teacher-exam/core` 新增 `analyzeDrillMock` 导出，但 `dev:h5` 是更早启动的，Vite 预打包缓存（`apps/app/node_modules/.vite`）仍是旧版本（与 P12 `buildBookTree` 同类问题）。
- **处理**：杀掉 5173 旧 dev → 删除 `.vite` 缓存 → 重启 `dev:h5`；浏览器复验首页正常渲染、报错消失。
- **新增规范**（[.cursor/rules/multi-agent-workflow.mdc](.cursor/rules/multi-agent-workflow.mdc)）：① 验收阶段必须检查运行时控制台无 error / 未捕获异常；② 重申「新增/改 workspace 包导出后必须重启 dev 或清 `.vite`」。
- **落地为自动断言**：`harness/playwright-verify.mjs` 新增 `console.error` / `pageerror` 收集，收尾断言为零（忽略 favicon 噪声）。
- **由此抓出并修复**：H5 端 `uni.getRecorderManager` 不支持会打 `console.error`；`DrillActionSheet.vue` 录音调用改用 `// #ifdef MP-WEIXIN || APP-PLUS` 条件编译，H5 不编译该段（时长仍由计时器驱动），控制台恢复干净。
- **验证**：`pnpm type-check`、`pnpm build:h5`、`pnpm build:mp-weixin`、`node harness/playwright-verify.mjs` **84/84**（含「全流程控制台零报错」）。


## 2026-06-29 (晚续) — P14 面试演练：音频 + AI 质检（前端 mock 落地）

按用户两张 v8.0 截图需求落地。**范围已与用户确认**：前端 + mock AI（可过 playwright + 小程序编译）；真实 STT/LLM/Edge Functions 写进 PRD 并预留接口（架构选 Edge Functions + 异步轮询）。

- **PRD**：[prd_final.md](prd_final.md) 新增「七、v8.0 — 面试演练：音频录制 + AI 结构化质检」章节（双轨调度 / 面试技能树 / AI 音频结算台 V2 / Edge 异步管线 / 客观雷达 / AI 点评 / 实现边界 / 验证）。
- **类型**（零侵入既有 ActionType/settlement）：`KnowledgeNode.track?`、`DrillType`、`AiDrillResult`、`DrillRadarScores`、`DrillRun`、`AnalyzeDrillInput`。
- **core**：新增 `packages/core/src/drill.ts`（`analyzeDrillMock` 确定性 mock 质检 + `isWrittenComplete` + `frameworkHint`）；`generateTodayTasks` 增 `interviewEnabled/interviewMode` 入参做双轨过滤；新增 4 组单测（core 单测 10→14）。
- **mock**：新增「面试演练」L2 子树（结构化/试讲 → 场景 → 课题叶子，`track=interview`、带 `drillType`）。
- **store**：新增 `interviewEnabled/interviewTrackMode/drillRuns/latestDrillComment` + `settleDrill/setInterviewEnabled/setInterviewTrackMode`；`interviewRadar` 优先取最近一次 AI 演练分数；`masteredCount/totalLeafCount/moduleBurndown` 排除面试节点，保证笔试统计不被污染；`todayTasks` 接双轨参数。
- **组件**：新增 `components/DrillActionSheet.vue`（🎙️ 麦克风录音计时 → 结束并提交 → 模拟 AI 异步分析 → 结果卡片：四项客观指标 + AI 点评 + 达标/复盘结论 + 自动闭环）；首页按 `track` 唤起：面试任务进音频结算台、笔试任务进 v7.0 刷题结算台；面试卡片带 🎙️ 标识。
- **辅助 UI**：`profile` 复习计划管理新增「面试演练模块」开关 + 「笔试/面试双轨」并行/串行切换；`DailyCheckinModal` 新增 AI 点评卡片（战果存库）；`dashboard` 雷达副标题随是否有演练记录切换文案。
- **Playwright**：脚本扩到 **83/83**（新增面试卡片识别、音频结算台录音→提交→结果卡片四指标/点评/结论、打卡弹窗 AI 点评、profile 面试开关+双轨切换；并把单项结算选择器从已废弃的 `.form-row input` 升级为 P11 的 `.metric-input input`，关面试模块后再清空任务以避免死循环）。
- **验证全绿**：`pnpm test`（14）、`pnpm type-check`、`pnpm build:h5`、`pnpm build:mp-weixin`、`node harness/playwright-verify.mjs` **83/83**。
- **实现边界**：真实 STT/LLM/Edge Functions/`drill_runs` 表为 PRD 预留（Edge Functions + 异步轮询），本期 AI 结果由 `analyzeDrillMock` 产出，结构与真实 LLM 一致，未来替换数据源即可。
- 注：环境缺 `playwright` 包，已 `pnpm install` + `npx playwright install chromium` 恢复后再跑验收。



### P11 首页「动作结算」弹窗重设计（参照效果图）

用户反馈：原刷题结算只有两个无标注数字框，看不清要填什么。按用户提供的效果图，在 P10.1 基线（[apps/app/src/pages/index/index.vue](apps/app/src/pages/index/index.vue)）上**仅叠加**结算弹窗重设计，不动周历改版、重置计划按钮、按钮 reset、打卡条贴底、200rpx padding 等既有改动。

- **头部**：`picker` 切换改为 `🎯 完成本节` 标题 + 节点名副标题 + `刷题 / 背诵 / 学习输入` 分段控件（选中态白底主题色高亮）。
- **刷题量化清晰化**：两个带名称 + 说明的量化框（`总刷题数`「本次共做多少题」、`错题数`「其中做错多少题」，错题数红色强调），右侧新增**正确率圆环**（conic-gradient 实时联动；≥80 绿 / ≥60 琥珀 / <60 红），正确率 = (总题−错题)/总题，与 `settleObjective` 口径一致。
- **背诵**：四挡锚点卡片 `20% 漏点 / 50% 词不达意 / 80% 踩准 / 100% 肌肉记忆`（点选高亮），替代原 slider 更直观。
- **学习输入**：`耗时(分钟)` + `踩分(0-100)` 两个带说明量化框。
- **避坑随笔**：`<textarea>` + 按动作类型联动的快捷标签 chips（刷题 = #概念混淆/#主体搞错/#时间限定错误），点击追加到随笔且去重。
- **智能提示栏**：纯前端按正确率/掌握度/踩分阈值计算文案并嵌入节点名，无网络依赖。注：效果图标注为「AI 洞察」，但 P9 已确立「全站文案去 AI 化」规范，二者冲突，本次先用中性「智能提示」，待用户确认是否改回「AI 洞察」。
- **主按钮**文案 `标记完成` → `标记完成并闭环`；提交前对刷题做 `总题>0、0≤错题≤总题` 校验与规整；数据模型与 `settleTask` 入参零改动。
- **风险修复**：实现过程中一度整文件覆盖 index.vue 误回退 P9~P10.1 首页改动，已 `git checkout HEAD -- index.vue` 恢复基线后改为精准 StrReplace 叠加，复验周历/重置计划/打卡条贴底等历史改动均保留。
- **兼容性**：正确率环用 conic-gradient 内联样式（H5 验证渲染正确），中心百分比文字为信息主源；`.sheet` 加 `max-height:86vh + overflow-y:auto` 适配加长内容。
- **验证**：`pnpm type-check`、IDE lints、`pnpm build:h5`、`pnpm build:mp-weixin` 全过；H5 浏览器走查：分段切换、错题改 5→正确率环 50% 变红、智能提示联动、标签、标记完成并闭环（进度 0/6→1/7）均正常。
- **PRD 同步**：[prd_final.md](prd_final.md) 新增「六、v7.0 增量需求 — 首页『动作结算』弹窗重设计」章节，并在 §二核心组件 1 处加最新实现跳转提示。
- **用户验收通过并提交**（commit `5ab7f62`）。

### skills 跨机复用：仅纳入 skills-lock.json

- 背景：自定义 skills 实体在上级 `aigc/.agents/skills/`（10 个，共 2.1M，其中 `ui-ux-pro-max` 占 1.8M CSV），由 `aigc/skills-lock.json` 锁定来源；其他机器若只 clone 本子仓库会拿不到。
- 冲突机制澄清：`.agents/skills` 按目录层级就近优先加载，仓库内同名 skill 覆盖上级同名版本，不会真正冲突；两份同源（同 hash）行为一致。
- 决策（用户选定）：**不把 skills 实体入库**（避免 2.1M 第三方 CSV 撑大业务仓库 + 版本漂移），只把 `skills-lock.json` 拷到仓库根作为可信来源。其他机器拿到 lock 后用对应 skills 管理器按 `source`/`skillPath`/`computedHash` 恢复到本地 `.agents/skills`。
- 本机继续使用上级 `aigc/.agents/skills`，与本决策无冲突。
- 已校验仓库内 `skills-lock.json` 与上级源 JSON 完全一致。

### 多 agent 跨设备 skills 安装机制

- 目标：让 Cursor / Claude Code / CodeBuddy 都认同一套 skills，且其他设备 clone 后可按 `skills-lock.json` 安装。
- 新增 [scripts/install-skills.mjs](scripts/install-skills.mjs)：零依赖 Node 18+ 脚本，读 lock → 按 `https://raw.githubusercontent.com/{source}/{ref}/{skillPath}` 拉取每个 `SKILL.md` → 分发到 `.agents/skills/`、`.cursor/skills/`、`.claude/skills/`、`.codebuddy/skills/`。支持 `--targets` / `--ref` / `--dry-run`；可选 sha256 校验 hash（不一致仅告警）；目录名取 skillPath 父目录（`uniapp说明`→`uniapp`）。
- 新增根 [AGENTS.md](AGENTS.md)（Cursor/Claude Code 通用入口：项目简介 + 红线 + skills 安装表 + 校验命令）与 [CLAUDE.md](CLAUDE.md)（指向 AGENTS.md + 安装步骤）。
- `package.json` 新增 `skills:install` 脚本；`.gitignore` 忽略 `.agents/skills/`、`.cursor/skills/`、`.claude/skills/`、`.codebuddy/skills/`（派生实体不入库，仅保留 lock + 脚本 + 入口），且不影响已入库的 `.cursor/rules`。
- 验证：`node --check` 通过、`--dry-run` 正确解析 10 个 skill 的 URL/目录/四目标、`package.json` JSON 合法、`git check-ignore` 确认四目录被忽略而 `.cursor/rules` 仍跟踪。
- 限制：本机隔离环境无外网，真实 GitHub 拉取需在有网设备验证；lock 仅含 `SKILL.md`，附属大文件（ui-ux-pro-max CSV 等）不在 lock 内、需另行补齐。

---

## 2026-06-24

### P10.1 首页打卡按钮贴底 + 统计页热力日历改为可切月月历

针对用户提交的两张真机截图反馈：① 首页底部打卡按钮悬空在 tabBar 上方约 50px，下方仍能看到残缺的任务卡片，体感被"卡腰"；② 统计页打卡日历只是色块矩阵，看不出具体几号、也无法切换月份查看历史。

#### 一、首页打卡按钮真正"置于底部"

[apps/app/src/pages/index/index.vue](apps/app/src/pages/index/index.vue)：

- `.checkin-bar` 的 `bottom` 由 `calc(50px + env(safe-area-inset-bottom))` 改为 `env(safe-area-inset-bottom)`，紧贴 tabBar 顶部，不再额外抬高 50px。
- `.checkin-bar` padding 从 `8px 32rpx 10px` 微调为 `12rpx 32rpx 16rpx`，让按钮上下留白与 tabBar 节奏一致。
- `.page` 底部 padding 从 `280rpx` 收紧到 `200rpx`，让最后一张任务卡片可以完整滚出固定按钮区域，而不是被遮在按钮下方半截可见、半截透出。

#### 二、Tab 3 打卡日历改为「可切月份的月历视图」

[apps/app/src/pages/dashboard/index.vue](apps/app/src/pages/dashboard/index.vue)：

- **顶部月份选择器**：用 `<picker mode="selector" :range="monthOptions" range-key="label">` 实现，浅灰胶囊按钮里显示当前选中的「YYYY 年 M 月 ▾」。`monthOptions` 收集 `store.heatmap` 中出现过的全部 `YYYY-MM` 并补齐"当月"，确保至少有一个可选项；默认 `selectedMonthIdx` 指向当月。
- **周表头**：新增 `.weekday-row` 渲染「一二三四五六日」7 列，与下方网格严格按 `grid-template-columns: repeat(7, 1fr)` 对齐。
- **月历网格 `monthGrid` computed**：
    1. 取选中月份首日的 `getDay()`（JS 周日=0）转换成「周一=0...周日=6」算前导占位数；
    2. 用 `new Date(year, month, 0).getDate()` 拿到当月天数，循环填日号；
    3. 末尾用占位补齐 7 的整数倍，保证最后一行不会出现孤立窄格。
    4. 每个非占位格在中心展示日号，深色块（hot-2 / hot-3）上日号自动反白。
    5. 当日格加 3rpx 主题色 `inset` 内描边，`.heat-cell.today { box-shadow: 0 0 0 3rpx #0f766e inset }`。
- **徽章保留**：`★ 当日有随笔` / `▣ 当日有照片` 仍渲染在格子右上角，不影响日号居中显示。
- 颜色档位与图例保持原 4 档（`hot-0` 灰 / `hot-1` 浅绿 / `hot-2` 中绿 / `hot-3` 深绿），数据档位逻辑沿用 `levelClassByMinutes`。

#### 三、Playwright 验收脚本升级到 70 项

[harness/playwright-verify.mjs](harness/playwright-verify.mjs)：

- 移除原「热力日历渲染 35 格」的硬断言，替换为「月历网格按 7 列对齐（28 / 35 / 42 格之一）」自适应断言。
- 新增 5 项断言：
    1. 首页 `.checkin-bar` 的 `getComputedStyle().bottom` 数值 < 10px（贴底）；
    2. 月历每个非占位格都通过 `.heat-cell:not(.placeholder) .cell-date` 渲染日号（正则 `^\d{1,2}$`）；
    3. 顶部 `.month-picker` 元素数量 = 1；
    4. 月份选择器文案匹配「YYYY 年 M 月」格式；
    5. `.weekday-text` 7 项且首项为「一」、末项为「日」。

#### 四、验证全绿

- Playwright **70/70** 全部通过（在 P10 的 65 项基础上新增 5 项）。
- `pnpm test` 单元测试 10/10。
- `vue-tsc --noEmit` 0 错误。
- `pnpm build:h5` + `pnpm build:mp-weixin` 双端构建通过。
- 关键截图：`2-dashboard-initial.png` 视觉确认 6 月月历 30 天 + 24 日主题色描边 + 多日深绿格 + 月份选择器；`1-home-default.png` 视觉确认底部 padding 已收紧。

#### 五、待用户侧最终验收

待用户在微信开发者工具导入 `apps/app/dist/build/mp-weixin` 真机走查：
1. 首页底部打卡按钮紧贴 tabBar 顶部、最后一张任务卡片不再被按钮遮挡；
2. 统计页打卡日历显示当月每一天的日号、当日有主题色描边、点击右上角月份选择器可切换历史月份查看历史打卡分布。

---

### P10 Tab 3「统计」/ Tab 4「我的」独立架构 + 首页周历改版（v6.0）

按用户提交的 v6.0 需求文档（`prd_final.md` §五已同步收录）落地三块改造：① 首页周历改造为「中文星期 + 日期数字 + 已打卡圆点」三段式（与设计图一致）；② 仪表盘改名为「统计」并按 PRD §一·1 的多巴胺逻辑彻底重构（5x7 热力日历 / 2x2 核心指标 / 最近随笔 / 各科进度 / 五维雷达）；③ 新建 Tab 4「我的」页（用户卡 / 倒计时 / 三组列表 / 广告位）。

#### 一、首页周历 + 重置按钮改版

[apps/app/src/pages/index/index.vue](apps/app/src/pages/index/index.vue)：

- **周历**：DOM 结构由 `.dot` 改为三段式 `.week-day > {.week-label, .week-date, .week-dot}`；普通日透明背景 + 深灰文字，当日填充主题色 `#0f766e` 圆形 + 白字，已打卡日下方绿色圆点 `#22c55e`。
- **数据**：`weekDays` 从静态数组改为 `computed`，以「今天」为基准回退到本周一连续 7 天，结合 `store.dailyCheckins` 的 checkinDate 集合判定 `checked`。
- **重置按钮**：文案从「重置」改为「↻ 重置计划」，样式由"主题色描边"改为"透明底中灰字"的弱化按钮，与 hero 标题同行右对齐；`.hero` 改 `flex-start` 让长标题和按钮一行排齐。

#### 二、Tab 3「统计」页（[apps/app/src/pages/dashboard/index.vue](apps/app/src/pages/dashboard/index.vue) 整体重写）

按 v6.0 需求自上而下拆 5 块：

1. **打卡日历 `<HeatmapCalendar />`**：5 行 x 7 列 = 35 格热力网格，4 档颜色 + ⭐/▣ 角标徽章（当日有随笔/有照片）+ 底部图例条。
2. **核心数据概览 `<DataOverviewGrid />`**：2x2 grid 渲染 4 张指标卡，严格使用「完美达标天数 / 日均学习时长 / 已掌握考点 / 刷题正确率」文案。
3. **最近打卡随笔 `<RecentMemosList />`**：纵向 3 张卡，每张 = 日期 + 已坚持 N 天 + memo 全文 + 1:1 图片占位。
4. **各科通关进度 `<ModuleProgressBars />`**：复用 `store.moduleBurndown`，文案统一为 `{percent}% （掌握 {done}/{total} 考点）`。
5. **面试能力雷达 `<InterviewRadarChart />`**：纯 CSS `clip-path: polygon(...)` 实现五维雷达（时间把控/语言流畅/板书完整/教态/逻辑框架），三层同心圆背景 + 5 条径向轴线，不依赖 echarts/ucharts。

#### 三、Tab 4「我的」页（[apps/app/src/pages/profile/index.vue](apps/app/src/pages/profile/index.vue) 新建）

- **用户卡**：圆形主题色头像（取昵称首字"考"）+ 昵称 + 当前 workspace 标题 + 同步状态（绿点"云端数据已同步"/橙点"离线数据待上传"）。
- **倒计时卡**：`#ecfdf5` 浅绿底 + 大号主题色数字（68 天）+ 考试日期。
- **Group 1 复习计划管理**：当前备考目标（拉 ActionSheet）/ 倒计时与时间分配（modal 占位）/ 每日任务上限提醒（⊖/⊕ 调节器，绑定 `store.dailyTaskCapHours`，区间 2-12）。
- **Group 2 考点库管理**：暂不复习考点库（空态展示 + 单条恢复 + 一键全部恢复）/ 本地日志清理（红字 Danger，二次确认后调用 `store.clearLocalCache()`）。
- **预留广告位**：200rpx 高度虚线灰底，居中文案"[ 预留广告位 / Ad Slot ]"，后期接入腾讯广点通时把内容替换为 `<ad>` 即可。
- **Group 3 关于与帮助**：问题反馈 / 关于深教考通 v1.0.0。
- **底部说明**：浅灰小字"本应用仅作为备考进度追踪工具，不内置题库、不内置网课"，呼应 PRD §〇 红线。

#### 四、tabBar 升级为 4 tab

[apps/app/src/pages.json](apps/app/src/pages.json)：

- 新增 `pages/profile/index` 注册（标题"我的"）；
- dashboard 标题由"仪表盘"改为"统计"；
- tabBar list 加第 4 项"我的"（pagePath: pages/profile/index）。

#### 五、Pinia store 扩展

[apps/app/src/stores/study.ts](apps/app/src/stores/study.ts)：

- 新增 ref：`actionLogs: StudyLog[]`、`dailyTaskCapHours`、`cloudSyncStatus`；
- 新增 7 个 computed：`perfectDays` / `avgStudyHours` / `masteredCount` / `totalLeafCount` / `objectiveAccuracy` / `interviewRadar` / `daysUntilExam` / `archivedLeaves`；
- 新增 2 个 action：`restoreArchived(nodeId?)` 单条/全部恢复回收站考点；`clearLocalCache()` 清 Storage + resetMock；
- `settleTask` 同步追加 `actionLogs`，让"刷题正确率/日均学习时长"指标随业务真实联动；
- `resetMock` 同步重置 `actionLogs`。

#### 六、Mock 数据扩展

[apps/app/src/data/mock.ts](apps/app/src/data/mock.ts)：

- `mockHeatmap` 由 5 天扩到 35 天（覆盖 5 周，工作日 90~210min/周末有低谷与断签，更接近真实备考节奏）；
- 新增 `mockActionLogs: StudyLog[]`（3 条历史结算，驱动初始"刷题正确率 87%"）；
- import 加 `StudyLog`。

#### 七、Playwright 验收升级（32 → 65）

[harness/playwright-verify.mjs](harness/playwright-verify.mjs)：在原 32 项基础上新增 33 项断言：

- **首页周历 3 项**：7 天 + 日期数字必现、重置按钮文案"重置计划"、透明底；
- **统计页 18 项**：标题"深教考通 · 我的统计"、9 个核心文案、35 格热力、4 张指标卡、"0/14"初值、3 条模块、5 条雷达轴、1 个 polygon；
- **我的页 17 项**：用户卡 / 同步状态 / 倒计时 / 3 组列表 / 14 个具体列表项 / 倒计时数字 > 0 / 头像主题色 / 广告位渲染；
- **tabBar 5 项**：4 个 tab 标签精确匹配。

新增 2 张截图：`7-profile-page.png`（我的页全貌）、`8-tabbar.png`（tabBar）。

修复脚本 1 处 bug：之前 `page.evaluate` 隐藏 tabbar 后，最后做 tabBar 验收时它仍 hidden，需改用 `state: 'attached'` 并主动 `tab.style.display = ''` 恢复。

#### 八、PRD 文档同步

[prd_final.md](prd_final.md) 末尾新增「五、v6.0 增量需求」章节，9 个小节完整收录：总体调整 / 周历改版 / 重置按钮 / Tab3 / Tab4 / store 扩展 / mock 扩展 / Playwright 65 项 / 验证全绿命令清单 / 后续路线图。

#### 验证全绿

- Playwright **65/65 通过**；
- `pnpm test` 10/10 通过；
- `vue-tsc --noEmit` 0 错误；
- `build:h5` + `build:mp-weixin` 双端通过；
- 视觉复核 8 张截图（首页/统计页/我的页/sheet/modal/tabbar）全部符合设计。

## 2026-06-24

### P9.1 真机截图反馈：按钮渐变伪影、关闭按钮灰圆底未生效修复

用户提交 5 张真机截图，反映以下按钮样式问题：

1. 首页打卡按钮未就绪态（"今日任务进行中 (X/Y)"）文字几乎不可读，灰底也太浅；
2. 首页打卡按钮就绪态（"今日任务已完成 · 去写随笔"）出现「上半绿、下半灰」的渐变/双色伪影；
3. sheet 弹层「标记完成」主题色按钮也呈现同样的渐变伪影；
4. 打卡随笔弹窗右上角关闭按钮 × 灰圆底完全未生效，渲染成光秃秃的 ×；
5. 打卡随笔弹窗底部「以后再说 / 保存记录」按钮组同样存在渐变伪影。

#### 根因定位

uni-app H5 端会把 `<button>` 包装成 `<uni-button>` 双层结构：

- 外层 `uni-button` 是 uni-app 注入的自定义元素，**自带 `background-color: #f8f8f8`** 灰底默认样式；
- 内层 `<button>` 才是业务样式生效的目标。

我们之前只对内层 `button` 的 class 设置 `background: #0f766e`，外层 `uni-button` 仍保留默认灰底，于是渲染出"上半业务色 + 下半默认灰"的渐变撕裂。同时 `uni-button[disabled]` 还有更深一层的 `background-color` 灰态覆盖，导致打卡按钮 disabled 时颜色更难调控。`<button>::after` 还有 1rpx 描边伪元素，原本只在小程序端出现，但 uni-app H5 把这条规则也下发了。

#### 修复方案

**1. `apps/app/src/App.vue` 全局三层 reset**

```css
uni-button,
button {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
    line-height: normal;
    text-align: center;
}

uni-button::after,
button::after {
    display: none !important;
    border: none !important;
}

uni-button[disabled],
button[disabled] {
    color: inherit;
    background-color: transparent;
}
```

把外层 uni-button、内层 button、内层 ::after 三层默认样式全部重置为透明，业务样式才能直接生效。

**2. 业务按钮加 `!important` 强制覆盖**

由于 `uni-button` 是元素选择器、业务样式是 class 选择器，但 uni-app 把 uni-button 默认样式注入到 `:host` 上下文中，不加 `!important` 仍会被覆盖。所有需要显式背景色/字色的业务按钮统一加 `!important`：

- [apps/app/src/pages/index/index.vue](apps/app/src/pages/index/index.vue)：
  - `.primary-button`：宽度 100%、高度 88rpx、`background: #0f766e !important`、`color: #fff !important`、`line-height: 88rpx`、`font-weight: 700`，并加 `::after { display: none }`。
  - `.ghost-button`（重置）：保留透明底+主题色描边，三色全加 `!important`。
  - `.text-button`（取消）：宽度 100%、`background: transparent !important`、`color: #6b7280 !important`、`line-height: 72rpx`，加 `::after { display: none }`。
  - `.checkin-button`：宽度 100%、未就绪态 `background: #d1d5db !important` + `color: #4b5563 !important`（之前是 `#e5e7eb` + `#9ca3af` 太浅不可读），就绪态 `.ready` 加 `!important` 覆盖；`[disabled]` 显式 `opacity: 1` 防 uni-app 把 disabled 按钮压暗；`line-height: 52px` 让文字垂直居中。
  - 把原先泛用的 `.text-button` 选择器改为 `.sheet .text-button` 以避免影响 modal 结构。
- [apps/app/src/components/DailyCheckinModal.vue](apps/app/src/components/DailyCheckinModal.vue)：
  - `.close-button`：`background: #f3f4f6 !important` + `color: #6b7280 !important`、`flex-shrink: 0`、加 `::after { display: none }`，灰圆底彻底生效。
  - `.later-button` / `.save-button`：分别加 `!important` 锁定背景色和字色，`padding: 0` + `line-height: 88rpx` 让 88rpx 高度内文字正中，`::after { display: none }` 杜绝 1rpx 描边。

#### Playwright 验收升级（24 → 32 项）

[harness/playwright-verify.mjs](harness/playwright-verify.mjs) 在原 24 项基础上新增 8 项 `getComputedStyle` 严格 RGB 匹配断言：

- 打卡按钮文字色可读：期望 `rgb(75, 85, 99)`（中灰）或 `rgb(255, 255, 255)`（白）；
- 结算面板主按钮：背景 `rgb(15, 118, 110)` 主题色实心 + 文字 `rgb(255, 255, 255)` 白；
- Modal 关闭按钮：背景 `rgb(243, 244, 246)` 浅灰圆底 + 文字 `rgb(107, 114, 128)` 中灰；
- Modal 保存按钮：背景 `rgb(15, 118, 110)` + 文字 `rgb(255, 255, 255)`；
- Modal 以后再说按钮：背景 `rgb(243, 244, 246)`。

为了让 Playwright 能在循环结算 6 个 task 后打开真正的 modal，需要在脚本里 `page.evaluate(() => document.querySelector('uni-tabbar.uni-tabbar-bottom').style.display = 'none')` 临时隐藏 fixed tabbar，否则它会拦截 sheet 底部按钮的 click。**绝不能用 force click**，因为 force 会跳过 vue 事件冒泡，导致 `sheet-mask` 的 `@click="closeSheet"` 不触发，sheet-mask 残留在 DOM 上拦截后续点击。

最终落 6 张关键截图到 [harness/verify-shots/](harness/verify-shots/)：
- 1-home-default：未就绪打卡按钮单色一体灰底；
- 5-sheet-primary-button：标记完成按钮单色主题色实心；
- 6-checkin-modal：关闭按钮圆形灰底 + 底部按钮组单色一体。

#### 验证全绿

- Playwright **32/32 通过**；
- `pnpm test` 10/10 通过；
- `pnpm --filter @teacher-exam/app run type-check` 0 错误；
- `pnpm build:h5` OK；
- `pnpm build:mp-weixin` OK，`apps/app/dist/build/mp-weixin/app.wxss` 完整保留 `uni-button,button{...}` + `:after{display:none!important}` + `[disabled]{background-color:transparent}` 三层 reset，小程序端样式同步生效。

## 2026-06-24

### P9 文案去 AI 化、按钮 UI 一致性修复、模块燃尽按 L2 重构

- 文案去 AI 化（mock 数据 + 全 UI 文案）：
  - `apps/app/src/data/mock.ts` 中 `mockWorkspace.title` 改为「深圳小学语文 · 暑期冲刺」，`mockDailyCheckins` 三条 memo 改写为真实考编生口吻，去掉句号和「错因集中在概念外延」类汇报体。
  - 首页：`航向修正预警` → `进度提醒`、`Quota` → `负荷指数`、`动作结算台` → `完成本节`、`闭环此节点` → `标记完成`、`已闭环` toast → `已完成`、`避坑` → `小提醒`、`已完成今日所有任务，去打卡` → `今日任务已完成 · 去写随笔`。
  - 仪表盘：`Dashboard & Asset Vault / 进度、热力与偏科风险` → `我的进度 / 备考节奏一目了然`，`分模块燃尽` → `模块燃尽进度`，`热力月历读取每日终极打卡日志` → `月度打卡热力`，`战果照片` → `学习记录照片`，`面试规范 V1` → `面试自评清单`，并补口语化提示文案。
  - 打卡弹窗：`已连续坚持高保真执行 X 天` → `今天是你连续打卡的第 X 天`，`添加图片（限 1 张）` → `添加一张今天的笔记或实拍`，`支持拍摄或上传今日战果照片` → `可以是草稿、笔记本、录音截图任你`。
  - `manifest.json` description 中「高保真执行记录」改为「复习记录」，规避 AI 黑话外泄。

- 按钮 UI 一致性修复：
  - 首页「重置」按钮从「绿底实心」改为「透明底 + 主题色 #0f766e 描边 + 主题色字」，符合次级按钮规范。
  - 首页打卡按钮未就绪态从 `#d1d5db + #4b5563` 改为 `#e5e7eb + #9ca3af`（更弱视觉），就绪态保留 `#0f766e + #fff`。
  - `DailyCheckinModal` 关闭按钮：清掉 `border`、字色统一为 `#6b7280`、显式 `font-size: 36rpx`、加 `::after { border: none }`。
  - `DailyCheckinModal` 连续天数文案从战损红 `#b91c1c` 改为主题色 `#0f766e`，与全站冷静绿色调统一。
  - 在 `App.vue` 全局补 `button::after { border: none }` 与 `button { background: transparent; line-height: normal; }`，杜绝 uni-app H5 / 微信小程序原生 button 的 1rpx 幽灵灰边。

- 数据结构改造（按 PRD §四 Tab3 燃尽语义对齐）：
  - `mock.ts` 扩为 3 个 L2 大模块 × 14 个 L7 叶子：
    - 教育综合知识（《教育学》《教育心理学》共 6 个 leaf）
    - 小学语文学科知识（《现代汉语》《义务教育语文课程标准 2022 版》共 5 个 leaf）
    - 教师职业能力（教育法律法规、十项准则共 3 个 leaf）
  - `stores/study.ts` 新增 `moduleBurndown` computed，按 L2 节点遍历后代叶子（用 `collectDescendantIds` 邻接表 BFS），输出 `{moduleId, title, totalLeaves, doneLeaves, percent}[]`。computed 自动跟随 `nodes` 响应式刷新，与首页结算实时联动。
  - `resetMock` 改为 JSON.parse(JSON.stringify(...)) 深拷贝，避免 settleTask 后污染 mock 字面量、下次重置初值不归零的隐患。
  - 仪表盘 `pages/dashboard/index.vue` 整体重写：新增「今日任务进度」卡（与首页 todayCompletedCount 共享 store 状态），「模块燃尽进度」从单条改为多条横向进度条 + 三档颜色（弱 #fbbf24 / 中 #2dd4bf / 强 #15803d）+ 百分比文字。
  - 数据模型零侵入：仍是单表 `knowledge_nodes`（已对齐 `supabase/migrations/0001_init.sql`），未来切真库只需把 mockNodes 替换为 `client.from('knowledge_nodes').select()` 注入源即可，无需改 store 或视图。

- Playwright 严格验收（24/24 通过）：
  - 新增 `harness/playwright-verify.mjs`：起 Node 静态服务器服务 `apps/app/dist/build/h5/` 产物，用 chromium iPhone 视口跑端到端断言。
  - 24 项断言覆盖：文案 8 条（去 AI 化）+ 视觉 4 条（重置按钮透明底/主题色描边/主题色字、打卡按钮浅灰底）+ 结构 6 条（3 模块 + 各自分母 6/5/3 + 初值 0）+ 联动 3 条（结算后被点击任务从清单消失、任务集合发生变化、教综燃尽 0/6 → 1/6）+ 残留 3 条（无「高保真」「航向」「Quota」）。
  - 落 4 张关键截图到 `harness/verify-shots/`：1-home-default、2-dashboard-initial、3-home-after-settle、4-dashboard-after-settle。
  - 新增 `playwright` 1.61.0 至根 `devDependencies`，`npx playwright install chromium` 已下载本地浏览器内核（约 300MB，仅本地开发使用）。

- 验证全绿：`pnpm test`（10 条核心单测）、`pnpm --filter @teacher-exam/app run type-check`（vue-tsc 0 错误）、`pnpm build:h5`、`pnpm build:mp-weixin`、`node harness/playwright-verify.mjs`（24/24）。

- 串行锁副作用记录：结算 `leaf-edu-1` 后，PRD §三 §1 的串行推进锁会自动解锁同 parent 下 orderIndex 更大的 sibling（leaf-edu-2），所以首页任务总数可能不变（结算 1 个 + 解锁 1 个 = 净 0），但**任务集合内容发生了变化**。Playwright 验收脚本据此调整断言为「被点击的任务从清单中消失」，不要求总数减少。

## 2026-06-24

### 微信小程序真机调试 `__wxAppCode__` 报错修复

- 现象：微信开发者工具真机调试报 `SystemError (jsEnginScriptError) Can't find variable: __wxAppCode__`，紧接着 `Page route 错误(system error) routeDone with a webviewId 46 is not found`。错误栈始于 `WASubContext.js` 的 `recurseUsingComponents → injectComponentsRecursively`。
- 根因：`apps/app/src/manifest.json` 中微信小程序 AppID 填错位置——把 `wxf68746786a764562` 写到了顶层 `appid`（该字段是 5+App 的 `__UNI__` 标识），而 `mp-weixin.appid` 留空。uni-app 编译产物的 `project.config.json` 因此没有有效 AppID，微信运行时不会注入 `__wxAppCode__`（该全局变量承载小程序所有页面/组件注入代码），导致 `recurseUsingComponents` 阶段 `ReferenceError`，首屏起不来又触发 `routeDone webviewId not found` 链式报错。
- 修复：将顶层 `appid` 置空（保留字段以兼容 5+App），把 `wxf68746786a764562` 移到 `mp-weixin.appid`；顺手补齐 `mp-weixin.setting` 的 `es6/minified/postcss` 与 `lazyCodeLoading: requiredComponents`，让小程序产物默认走 ES6→ES5、CSS 兼容性处理与按需注入，规避后续真机兼容性踩坑。
- AppID 不属于密钥范畴，可入库；`appsecret` 仍严禁提交，保持 `secretsPolicy.storeRealSecrets=false`。
- 用户后续步骤（不在本次代码改动范围内）：重新执行 `pnpm --filter @teacher-exam/app run dev:mp-weixin`，在微信开发者工具中导入**构建产物目录** `apps/app/dist/dev/mp-weixin`（非源码目录），项目设置里确认 AppID 为 `wxf68746786a764562`，清缓存→普通编译。
- 本次仅改 `manifest.json` 配置，不动业务代码、不跑构建。

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

### 样式偏移修复

- 根据用户截图修复首页两处偏移：`重置` 按钮改为固定 px 尺寸，避免 H5 宽视口下 rpx 放大导致按钮过大；底部终极打卡条改为固定 px 高度并抬到 tabBar 上方，避免被 tabBar 裁切。
- 修复仪表盘「最近打卡随笔」文案右对齐问题，改为左对齐并补充行高。
- 验证通过：`pnpm type-check`、IDE lints、H5 浏览器截图复验首页与仪表盘。

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
