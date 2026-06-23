这个交互方案非常巧妙。把原本被动弹出的结算，改成了在所有任务项清空后、由用户主动触发的“终极打卡仪式”，不仅逻辑更清晰，而且结合了随笔和图片上传，执行完毕后的情绪价值直接拉满。

我已经将首页底部的**固定大打卡按钮**，以及基于参考图重构的「战果随笔」弹窗 UI 细节完整无缝地融入了架构中（已剔除参考图中的广告模块，保留了连续坚持天数、心得输入框、图片上传和双选择按钮）。

以下是为你更新的终极版工程蓝图，可直接作为 Agent 的 System Prompt 投喂：

---

# 🚀 「深教考通」高保真执行引擎 - 终极 Agent 架构与开发白皮书 (v5.0 终版)

## 〇、 核心价值观与架构纪律 (Agent System Directives)

1. **产品红线：** 绝对无内置题库、无网课内容。系统仅作为“备考进度追踪与高保真客观执行记录”的拓扑计算引擎。
2. **技术基建：** 采用前端 `uni-app` (Vue 3 Composition API + TypeScript) + 样式库 `TailwindCSS/UnoCSS` + 后端/BaaS `Supabase` (Auth, PostgreSQL, Storage, Edge Functions)。
3. **UI/交互纪律：** 拒绝花哨动效与打卡焦虑。全站核心色调为黑白灰，辅以状态驱动的高对比度警示色（闭环绿、预警琥珀色、战损红）。所有状态流转必须由**客观数据录入**驱动。

---

## 一、 核心数据字典与状态流转 (Database & Pinia Store)

Agent 在建立数据库和全局状态时，必须严格遵守以下 Schema。

### 1. Supabase 核心表结构

* **`workspaces` (多目标隔离区)**：
* `id` (UUID), `user_id`, `target_path` (级联存储，如：广东-深圳-小学数学), `total_days` (备考总天数), `created_at`。


* **`knowledge_tree` (无限嵌套邻接表引擎)**：
* `id`, `workspace_id`, `parent_id`, `level` (L1目标 -> L2大模块 -> L3教材 -> L4编 -> L5章 -> L6节 -> L7叶子节点), `title`, `is_pruned` (布尔值), `is_locked` (DAG锁)。


* **`action_logs` (单项任务客观结算日志)**：
* `id`, `node_id` (关联 L7 叶子节点), `action_type` (枚举：`brush`, `recite`, `read`), `payload` (JSONB: 存 `{total: 100, wrong: 5}`, `{mastery: 80}` 等数据)。


* **`daily_checkins` (全局终极打卡日志 - *新增*)**：
* `id`, `workspace_id`, `checkin_date`, `streak_days` (当前连续打卡天数), `memo` (随笔文字), `image_url` (挂载的 Storage 图片链接)。



### 2. Pinia 全局状态管理 (`useEngineStore`)

* 前端必须维护 `CurrentWorkspace`, `TodayTasksList`, `CompletedTasksCount`。
* 任何操作必须先在 Store 进行乐观更新 (Optimistic UI Update)，渲染删除线与淡出动画，再向 Supabase 同步，保证交互的极致流畅度。

---

## 二、 视图层与组件树级交互细节 (Views & Interactions)

### 🎯 Tab 1: 首页 / 压迫执行流 (`pages/index/index.vue`)

这是用户每天停留最久的核心页面。布局采用“顶部信息 + 中间滚动任务流 + 底部固定吸底大按钮”的经典结构。

* **顶部：工作区切换与预警 (Header & Alert)**
* **Workspace Picker**：展示 `[广东-深圳-小学数学 ▼]`。切换即清空当前页面所有数据流并重新 Fetch。
* **Amber Alert Banner**：单日配额超限时触发，琥珀色通栏。提供降级修剪的入口。


* **中间区域：今日卡片流 (`<scroll-view>`)**
* 仅渲染调度器派发的 L7 叶子节点（如“今日 3 项任务”）。
* **交互**：点击单张卡片即唤起【半屏动作结算台】。
* **视觉反馈**：单项任务在结算台完成后，卡片文字增加删除线 -> 透明度淡出 -> 从列表中剔除。


* **底部固定区：终极打卡大按钮 (Fixed Bottom Bar)**
* **UI**：吸附在屏幕最底部的全宽/大圆角按钮组件。
* **动态状态机制**：
* **未清空状态** (今日任务列表长度 > 0)：按钮呈灰色不可点击状态，文案显示进度，如 `“今日任务执行中 (1/3)”`。
* **可打卡状态** (今日任务全部闭环，列表长度 = 0)：按钮高亮变为品牌主色（执行绿），文案变为 `“✅ 已完成今日所有任务，去打卡”`。


* **交互**：在可打卡状态下点击，拉起「打卡随笔弹窗」。



---

### ⌨️ 核心组件 1：单项任务半屏结算台 (`components/ActionSheet.vue`)

由任务流中的单张卡片唤起，强制遮罩。用于**精准量化当前知识点的掌握度**。

* **顶部动作切换 Segment**：`[客观刷题] | [主观背诵] | [综合泛读]`
* **动态表单渲染**：
* **动作A (刷题)**：双栏数字输入框，录入 `总题数` 和 `错题数`（错题>总题报错）。
* **动作B (背诵)**：四挡固定锚点滑块。强制附带文字刻度：`20% (漏点)`、`50% (词不达意)`、`80% (踩准)`、`100% (肌肉记忆)`。
* **动作C (泛读)**：数字步进器 `[ - | 耗时分钟 | + ]`。


* **交互闭环**：点击保存后，半屏收起，对应的主页任务卡片划线消失，底部的大打卡按钮进度 +1。

---

### 📸 核心组件 2：终极打卡随笔弹窗 (`components/DailyCheckinModal.vue`)

由首页底部变成绿色的【去打卡】大按钮触发。这是一个类似朋友圈/日志发布的半屏或全屏弹窗，承载极高的情绪价值。

* **弹窗 Header**：
* 标题：`打卡随笔`
* 右上角：`[ X ]` 关闭按钮。


* **状态卡片区 (Streak Card)**：
* 左侧：显示一个代表当前状态的简明 Icon（如坚定、胜利）。
* 标题文案：当前工作区目标名称（如 `深圳小学数学编`）。
* 副标题标红高亮：`已连续坚持高保真执行 X 天`。
* 右侧操作区：提供 `[撤销]` 或 `[历史记录]` 的小文字按钮。


* **富文本输入区 (Text Area)**：
* 无边框的宽大文本域，Placeholder 设置为：`“记下此刻的心情、今日避坑总结或执行感悟...”`。


* **战果附件区 (Media Upload)**：
* 提供一个方块型的上传按钮 `[ 🖼️ 添加图片 (限1张) ]`。
* 点击唤起 `uni.chooseImage`，支持用户拍摄或上传今日的桌面笔记、做题草稿等战果照片。图片直接直传至 Supabase Storage。


* **底部结算操作区 (Footer Actions)**：
* 摒弃一切广告，保持纯粹。
* 左侧弱化按钮：`[ 以后再说 ]` (关闭弹窗，保留今日已完成状态，但不记录特殊随笔)。
* 右侧高亮主按钮：`[ 保存记录 ]` (提交至 `daily_checkins` 表)。
* **成功反馈**：提交后弹窗收起，撒花动画，当日周历彻底点亮。



---

## 三、 核心算法引擎 (The Dispatcher & Timeboxing)

Agent 必须将此逻辑封装为独立的 TypeScript Class 或 Supabase Edge Function。

### 1. 双轨调度生成器 (Dual-Track Generator)

每日凌晨静默执行，生成当天的任务列表。

* **轨道一：艾宾浩斯复测防线 (P0 极高优先级)**
* 遍历历史 `action_logs`，按记忆衰减阈值提取需复测的 L7 节点。强制塞入今日队列首位。


* **轨道二：强制串行推进锁 (P1 顺延优先级)**
* 锚定当前 L2 大模块进度。检测前一章节的所有 L7 节点全部拥有日志后，方可解锁下一章节的新节点。绝对禁止跨结构跳跃。



### 2. 航向修正预警熔断器 (Amber Alert)

* **配额计算公式**：
$Quota = \frac{\text{Remaining Unpruned L7 Nodes}}{\text{Remaining Configured Days}}$
* **熔断条件**：当系统计算出 `Quota` 激增，导致单日预估耗时超出了该用户“历史最高单日专注耗时”极值时，触发首页顶部警报。

---

## 四、 规划与数据看板视图 (Settings & Dashboard)

### ⚙️ Tab 2: 规划与引擎层 (`pages/plan/index.vue`)

* **技能树透视与修剪**：
* 树状列表默认展开至 L3 教材层级。
* **修剪交互**：移动端只允许在最底层 L7 叶子节点进行操作。列表项左滑，露出红色 `[移入回收站]`。点击后该节点 `is_pruned = true`，立刻从整个拓扑调度中剔除，恢复健康的 Quota 公式。


* **模板库克隆**：一键拉取官方预埋的标准大纲 JSON 树，实例化为个人的数据。

### 📊 Tab 3: 数据多巴胺与能力透视 (`pages/dashboard/index.vue`)

* **全局热力月历 (GitHub Contributions Style)**：读取打卡日志，用深浅不同的绿色色块渲染每日执行强度。若当日在“打卡随笔弹窗”中上传了图片，对应网格叠加“胶片图标”。
* **模块燃尽图 (Burndown Charts)**：以 L2 层级为基准，渲染横向的闭环进度百分比条。

---

## 五、 v6.0 增量需求 — Tab 3「统计」与 Tab 4「我的」独立架构 + 首页周历改版

> 本章在 v5.0 基础上整合 P10 阶段的所有增量需求，是当前实现的最终蓝图，已对 mock 数据、Pinia store、Playwright 验收脚本完成全面落地（65/65 通过）。

### 5.1 总体调整

* **导航结构升级为 4 Tab**：
  * Tab 1 — 「今日」（`pages/index/index.vue`，原首页）
  * Tab 2 — 「知识树」（`pages/tree/index.vue`，保持）
  * Tab 3 — 「统计」（`pages/dashboard/index.vue`，原「仪表盘」改名为「统计」并整体重构）
  * Tab 4 — 「我的」（`pages/profile/index.vue`，**新建**）
* **文案纪律：** 全站继续使用大白话，禁止「闭环节点 / Quota / 高保真执行 / Asset Vault」等工程黑话；使用「已掌握考点 / 完美达标天数 / 刷题正确率」等用户能即时理解的字眼。
* **视觉纪律：** 主题色仍为 `#0f766e`（teal-700），灰白底 + 高对比品牌绿，无复杂动效；按钮一律遵循 `<App.vue>` 中的 uni-button/button 双层 reset 规则避免渐变伪影。

### 5.2 首页周历改版（替换原 v5.0 周历）

参考设计图：替换原"白底圆角格子 + 一个无意义灰圆点"的旧周历，改为「中文星期 + 日期数字 + 已打卡圆点」三段式布局：

* **DOM 结构**：`.week-strip > .week-day { .week-label, .week-date, .week-dot }`
* **状态切片**：
  * 普通日：透明背景，`.week-label` 与 `.week-date` 为深灰；
  * 当日（active）：填充为主题色 `#0f766e` 的胶囊圆形，内部文字反白；
  * 已打卡日：`.week-dot.checked` 显示绿色（`#22c55e`）实心圆点；当日已打卡则反白成白色圆点。
* **数据来源**：`weekDays` 是 `<script setup>` 中的 `computed`，以「今天」为基准回退到本周一并循环 7 天，结合 `store.dailyCheckins` 的 `checkinDate` 集合判定 `checked`。

### 5.3 重置按钮（替换原 v5.0「重置」）

* 文案改为「重置计划」，左侧加「↻」转动 C 形图标（`.ghost-icon`）。
* 样式改为透明底无边框的弱化按钮（`#6b7280` 中灰字），靠右与 hero 标题同行对齐；保留 `uni-button[disabled]{background-color:transparent}` 的全局 reset，避免任何渐变。

### 5.4 Tab 3 — 「统计」页（`pages/dashboard/index.vue`）

页面定位：**多维度客观量化反馈与多巴胺情绪价值展示**。自上而下结构：

#### 5.4.1 顶部：打卡日历 `<HeatmapCalendar />`

* **布局**：`.heat-grid` 为 7 列 x 5 行 = 35 格的 grid，覆盖最近 5 周。
* **颜色映射**：
  * `hot-0` `#edf2f7`（无任务）
  * `hot-1` `#bbf7d0`（>0 ~ 89min）
  * `hot-2` `#4ade80`（90 ~ 179min）
  * `hot-3` `#15803d`（≥180min）
* **特殊状态**：当日有随笔（`memo` 非空）右上角渲染 ⭐（黄）；当日有照片渲染 ▣（白色 + 阴影），与底部图例对应。
* **图例**：`.heat-legend` 在网格下方一行展示「少 □ □ □ □ 多　★ 当日有随笔　▣ 当日有照片」。
* **数据来源**：`store.heatmap.slice(-35)` + `store.dailyCheckins`，迁移到 Supabase 时直接用 `client.from('heatmap_view').select()` 替换。

#### 5.4.2 中上部：核心数据概览 `<DataOverviewGrid />`

`.metric-grid` 用 2x2 grid 渲染 4 张指标卡，每张 28rpx 圆角 + 浅阴影。**严格使用以下文案，禁止工程黑话：**

| 序 | label | 计算公式 |
|---|---|---|
| 1 | **完美达标天数** | `heatmap.filter(d => d.closedCount >= 3 && d.hasCheckin).length` |
| 2 | **日均学习时长** | `Σ minutes / activeDays / 60`（保留 1 位小数，单位"小时"） |
| 3 | **已掌握考点** | `nodes.filter(n => n.isLeaf && n.status==='done').length` / 总叶子数 |
| 4 | **刷题正确率** | `Σ (totalCount-wrongCount) / Σ totalCount * 100` |

视觉：`.metric-value` 用主题色 + 44rpx 800 字重作为大数字；`.metric-unit` 用 26rpx 600 中等字号挂在数字右侧；`.metric-hint` 用 20rpx 浅灰说明计算口径。

#### 5.4.3 中下部：最近打卡随笔 + 各科通关进度

* **最近打卡随笔 `<RecentMemosList />`**
  * 仅渲染最近 3 条 `dailyCheckins`，按 `checkinDate` 倒序。
  * 每条卡片头：`MM 月 DD 日` + `已坚持 N 天`；body 是随笔正文；若有图片渲染 1:1 占位（实际产线接入 Supabase Storage URL 即可）。
* **各科通关进度 `<ModuleProgressBars />`**
  * 直接复用 `store.moduleBurndown`（按 L2 邻接表 BFS 收集叶子）渲染 3 条横向进度条。
  * 文案统一为：`{percent}% （掌握 {done}/{total} 考点）`。
  * 三档颜色：`burn-weak #fbbf24` / `burn-mid #2dd4bf` / `burn-strong #15803d`。

#### 5.4.4 底部：面试能力雷达图 `<InterviewRadarChart />`

* 用纯 CSS + `clip-path: polygon(...)` 实现的零依赖五维雷达，`.radar-wrap` 480rpx 见方。
* 5 个维度：**时间把控 / 语言流畅 / 板书完整 / 教态 / 逻辑框架**。
* `store.interviewRadar` 为 computed，根据 `masteredCount/totalLeafCount` 估算基线分，每维加经验偏移系数，后期接入真实 `interview_runs` 表后只需替换数据源。

### 5.5 Tab 4 — 「我的」页（`pages/profile/index.vue`，新建）

页面定位：**极简身份管理与底层引擎参数控制**。自上而下结构：

#### 5.5.1 极简用户卡片 `<UserProfileCard />`

* 左侧 112rpx 圆形主题色头像（取昵称首字「考」）；右侧昵称（"考编战士 · 微光"）+ 当前 workspace 标题 + 同步状态行。
* 同步状态：默认 `synced` 显示绿色圆点 + 「云端数据已同步」；离线写入时切到橙色圆点 + 「离线数据待上传」（由 `store.cloudSyncStatus` 控制，目前默认 `'synced'`）。

#### 5.5.2 倒计时卡片

* 主题浅绿色卡（`#ecfdf5`），左侧 `64rpx` 主题色大数字「68 天」+ 顶上「距离考试还有」标签；右侧「考试日期 2026-08-30」。
* 数据：`store.daysUntilExam` computed = `daysUntil(workspace.examDate)`。

#### 5.5.3 Group 1 — 复习计划管理

| 列表项 | 行为 |
|---|---|
| **当前备考目标** | 点击拉起 ActionSheet（mock 三个目标候选）；后续接入 supabase 后写真实 workspace 表。 |
| **倒计时与时间分配** | 点击弹出 `uni.showModal` 占位弹窗，预留接入考试日期 / 各科时间箱权重的设置面板。 |
| **每日任务上限提醒** | 内联 ⊖/⊕ 调节器 + 「N 小时」中间显示，绑定 `store.dailyTaskCapHours`，区间 `[2, 12]`。 |

#### 5.5.4 Group 2 — 考点库管理

| 列表项 | 行为 |
|---|---|
| **暂不复习考点库** | 列表展开 `store.archivedLeaves`，每条右侧「恢复」按钮（透明底主题色描边），底部「一键全部恢复」实心按钮；空态显示"当前没有放进回收站的考点"。 |
| **本地日志清理** | 红字 Danger 按钮，点击 `uni.showModal` 二次确认，确认后调用 `store.clearLocalCache()` 清除 Storage 并 `resetMock`。 |

#### 5.5.5 预留广告位 `<AdPlaceholder />`

* `.ad-slot` 200rpx 高度、虚线灰边、居中文字「[ 预留广告位 / Ad Slot ]」，位于「考点库管理」与「关于与帮助」之间。
* 后期对接腾讯广点通 / 微信小程序流量主时，把内层 view 替换为 `<ad unit-id="...">` 即可。

#### 5.5.6 Group 3 — 关于与帮助

* **问题反馈 / 吐槽**：占位 modal，提示通过邮件或工单反馈。
* **关于深教考通**：右侧版本号 `v1.0.0`，点击展示版本号 + 隐私协议简述。

#### 5.5.7 底部说明

`.footer` 一行 22rpx 浅灰文字：「本应用仅作为备考进度追踪工具，不内置题库、不内置网课。」对应 PRD §〇 的产品红线。

### 5.6 Pinia 全局状态扩展（在原 useStudyStore 基础上）

| 新增 ref/computed | 用途 |
|---|---|
| `actionLogs: StudyLog[]` | 客观刷题/背诵/泛读的结算日志，settleTask 时同步追加，承载"刷题正确率/日均时长" |
| `dailyTaskCapHours` | 每日任务上限（小时），由 Tab 4 调节器控制 |
| `cloudSyncStatus` | `'synced' \| 'pending'`，控制用户卡同步指示器配色 |
| `perfectDays` | 完美达标天数 computed |
| `avgStudyHours` | 日均学习时长 computed |
| `masteredCount` / `totalLeafCount` | 已掌握考点 + 总叶子数 |
| `objectiveAccuracy` | 客观题加权正确率 |
| `interviewRadar` | 5 维雷达分数 computed |
| `daysUntilExam` | 倒计时天数 computed |
| `archivedLeaves` | 暂不复习考点库（status === 'archived' 的叶子） |

| 新增 action | 用途 |
|---|---|
| `restoreArchived(nodeId?: string)` | 单条/全部恢复回收站考点，恢复后立即触发 `unlockNextSiblings` |
| `clearLocalCache()` | 清除 Storage + resetMock |

### 5.7 Mock 数据扩展

* `mockHeatmap` 由 5 天扩展为 35 天（覆盖 5 周），用于热力日历完整渲染。
* 新增 `mockActionLogs: StudyLog[]`，含 3 条历史结算（教综/学心/学科），驱动「刷题正确率 87%」初始数据。
* 所有 mock 文案保持口语化（已坚持/今天没写感悟/小提醒等），无任何 AI 黑话。

### 5.8 Playwright 严格验收（65/65）

`harness/playwright-verify.mjs` 在原 32 项基础上扩到 65 项，新增覆盖：

* **首页周历**：7 天 + 日期数字必现、重置按钮文案为「重置计划」、透明底；
* **统计页**：9 项文案 + 35 格热力 + 4 张指标卡 + "0/14" 初值 + 3 条模块燃尽 + 5 条雷达轴 + 1 个 polygon；
* **我的页**：14 项分组 + 倒计时数字 + 头像主题色 + 广告位渲染；
* **tabBar**：4 个 tab 标签精确匹配。

落 8 张关键截图到 `harness/verify-shots/`：
1-home-default、2-dashboard-initial、3-home-after-settle、4-dashboard-after-settle、5-sheet-primary-button、6-checkin-modal、**7-profile-page**、**8-tabbar**。

### 5.9 验证全绿（可重复执行）

```bash
pnpm --filter @teacher-exam/core test          # 10/10
pnpm --filter @teacher-exam/app run type-check # 0 错误
pnpm --filter @teacher-exam/app run build:h5   # OK
pnpm --filter @teacher-exam/app run build:mp-weixin # OK
node harness/playwright-verify.mjs             # 65/65
```

> **后续可做**（不在 v6.0 范围内）：
> 1. 思维导图节点拖拽排序；
> 2. `books`/`book_nodes` 接入真实 Supabase 读写；
> 3. 把面试规范检查单接到真实 `interview_checklist_items` 表，雷达图替换为真实历史平均分；
> 4. 接入流量主真实组件 `<ad>` 替换占位广告位；
> 5. workspace 切换真实拉起 ActionSheet 写库。