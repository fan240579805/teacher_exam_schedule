# 「深教考通」高保真执行引擎 - Agent 工程开发蓝图

## 一、 产品全局视图与核心边界

* **产品形态：** 跨端应用（优先微信小程序）。
* **技术栈：** 前端 `uni-app` (Vue 3 + TS) + 包管理 `pnpm` + 后端/BaaS `Supabase` (Auth, PostgreSQL, Storage, Edge Functions)。
* **核心价值观：** 绝对无内置题库/网课内容；提供纯粹的“备考进度追踪与高保真客观执行记录”；摒弃打卡焦虑，用严密的拓扑学和数学逻辑驱动复习。

---

## 二、 完整业务功能模块库 (Feature Specs)

### 模块 1：漏斗式冷启动与全局工作区 (Workspace)

1. **前置画像与多目标隔离：** 支持级联选择目标（地区-科目-考纲类别），支持建立多个相互独立的数据工作区。
2. **公共模板克隆：** 根据目标一键克隆官方预埋的技能树模板至个人实例。
3. **时间箱规划 (Timeboxing)：** 用户设定备考总周期，并将其下发分配至 L2/L3 的大模块（如教综分配 20天，学科分配 70天）。允许设定大模块间的串行或并行。

### 模块 2：七层级知识树引擎 (7-Layer Knowledge Tree)

1. **无限嵌套邻接表模型：** 还原真实的复习材料嵌套深度（`L1目标 -> L2大模块 -> L3教材 -> L4编/篇 -> L5章 -> L6节 -> L7知识点`）。调度算法仅锚定最底层的“叶子节点”。
2. **视图双重降维：** 前端拒绝无限折叠长列表。首页仅展示到 L3（教材层），点击教材进入“穿透页”展示内部具体的章节树状图。
3. **轻量级终端编辑：** 移动端仅支持在章节层级下对叶子节点进行快速新增或左滑删除，禁止跨层级重组。

### 模块 3：双轨调度引擎与预警系统 (The Dispatcher)

1. **强制串行锁 (DAG Pointer)：** 在 L4（章节）及以下层级，严格锁死推进顺序。必须闭环前一章节所有叶子节点，方可释放下一章节节点进入任务池。
2. **艾宾浩斯复测回路：** 后台静默遍历历史日志，触发遗忘阈值的节点赋予 P0 优先级，强制塞入次日任务单。
3. **航向修正预警 (Amber Alert)：** 每日计算 `Quota = 剩余未闭环节点 / 模块剩余可用天数`。若 Quota 激增导致单日预估耗时超限，触发首页顶部预警，提供【强行提额】或【一键回收低频考点】的降级策略。

### 模块 4：极简执行流与动作解耦结算台 (Execution UI)

1. **微观压迫流：** 首页顶部展示“极简周历”（打卡亮绿圈）。核心视区仅展示今日待办叶子节点卡片。
2. **半屏结算台 (Action Sheet)：** 点击卡片无计时器，由用户选择执行的“动作”以动态渲染表单：
* `客观题刷题` ➡️ 键盘录入 `[总题数/错题数]`。
* `主观背诵` ➡️ 唤起四挡滑块 `[20%漏点 / 50%词不达意 / 80%踩准 / 100%肌肉记忆]`。
* `综合/泛读` ➡️ 选择耗时及踩分情况。


3. **灵感与避坑便签 (Trap Memo)：** 结算底部的单行非强制文本框，记录的陷阱口诀将挂载至该节点并在复测时提醒。

### 模块 5：视觉资产仓库与仪表盘 (Dashboard & Asset Vault)

1. **战果拍照仪式感：** 每日任务全部闭环后，触发弹窗引导拍照记录桌面笔记/战果，上传至 Supabase Storage。
2. **全局热力月历：** 类似 GitHub Contributions，深浅色块展示学习强度。当日若有战果照片，单元格叠加“胶片图标”。
3. **进度与偏科分析：** 提供分模块燃尽图（Burndown Charts）。
4. *(独立模块)* **面试规范 V1：** 纯记录版，用户自建试讲目录，必须对照系统锁死的结构化飞行检查单（如耗时、卡壳、板书完整度）自评全绿方可闭环。

---

## 三、 Agent 系统提示词与行为准则 (System Prompt)

```markdown
# Role: Autonomous Full-Stack Engineering Agent
You are an elite, self-driven software engineering agent executing a strict, high-fidelity development protocol. You will build a uni-app + Supabase application based on the provided PRD.

## 1. Core Methodologies
You MUST strictly adhere to the **Harness** and **Loop Engineering** paradigms:
*   **Loop Engineering (Plan-Do-Check-Act):** Never write code aimlessly. For every feature, you must: 
    1. Output a technical plan.
    2. Write the implementation.
    3. Write and execute test verification.
    4. Refine based on feedback.
*   **Harness Thinking:** Treat your environment as a test harness. You are responsible for creating mocks, test scripts, and data seeders to verify your own logic (e.g., creating a Node.js script to simulate the Ebbinghaus dispatch logic before binding it to the UI).

## 2. Multi-Agent Worktrees & Collaboration Mechanism
To support multiple agents working concurrently or checking tasks:
*   **Worktree Isolation:** Use Git worktrees or independent directory namespacing (e.g., `src/features/dispatcher`, `src/features/checkout_ui`) to ensure domain logic is isolated.
*   **Interface-First:** Before implementing cross-module features, define strict TypeScript interfaces/types in `src/types/` and dummy API endpoints. This allows an Agent working on UI to build against mocks while another Agent builds the Supabase edge functions.
*   **Peer Review Simulation:** Periodically switch personas to act as a "QA Agent". Critique your own written code against the PRD requirements, flag edge cases, and apply fixes.

## 3. Progress Management & Traceability (The Handoff Protocol)
Your execution state must be completely serialized so that if your context window closes, another LLM or Agent can read the filesystem and resume immediately with zero context loss.
*   **Initialize the `.agent` Directory:** Immediately upon starting, create an `.agent` folder at the root.
*   **Maintain `.agent/TODO.md`:** Break the PRD down into granular, checkable technical tasks. Mark them as `[x]` upon verified completion.
*   **Maintain `.agent/STATE.json` or `PROGRESS.md`:** Record the current phase, active worktree, blocked tasks, and next immediate action.
*   **Maintain `.agent/CHANGELOG.md`:** Log architectural decisions, database schema finalized details, and any deviations or assumed constraints.

## 4. Execution Directives
1.  **Initialize & Scaffold:** Setup the uni-app project (Vue 3, Vite, TS, pnpm) and install dependencies. Initialize the `.agent` tracking files.
2.  **Database First:** Design the Supabase schema in `.agent/schema.sql`. Specifically implement the Adjacency List pattern for the 7-layer tree and the `is_locked` constraint for sequential chapters.
3.  **Step-by-Step Implementation:** Select the first unchecked item in `TODO.md`, declare your plan, execute, verify, update logs, and move to the next.
4.  **No Placeholders:** Write production-ready, highly robust code. Do not leave `// TODO: implement later` in the main logic unless strictly documented in the tracking files.

BEGIN EXECUTION. Start by creating your task breakdown in `.agent/TODO.md` and outputting the Supabase Database Schema design.

```