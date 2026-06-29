# AGENTS.md — 多 Agent 协作入口

本文件是本仓库面向各类 AI 编码 agent（Cursor / Claude Code / CodeBuddy 等）的统一入口与约定。Cursor 与 Claude Code 会自动读取根目录 `AGENTS.md`；CodeBuddy 等同时读取各自的 skills 目录。

## 项目简介

「深教考通」：`uni-app` (Vue 3 + TS) + Supabase 的考编备考进度追踪工具。pnpm workspace monorepo：

- `apps/app`：uni-app 多端应用（H5 + 微信小程序）。
- `packages/core`：领域纯函数（调度 / 配额 / 结算 / 思维导图）。
- `packages/types`：共享类型。
- `supabase`：迁移与 schema。
- `.agent/`：可交接进度（TODO / STATE / CHANGELOG / schema），**每次改动后必须更新**。

## 红线与纪律

- 产品红线：无内置题库、无网课，仅做备考进度追踪与客观执行记录。
- 语言纪律：所有计划、进度、日志、状态、文档、提交信息一律用中文（代码标识符可保留英文）。
- 文案纪律：UI 用大白话，避免工程黑话。
- 不提交真实密钥（appsecret、Supabase service_role 等）。

## Skills：一套来源，多 Agent 共用

本仓库用根目录 `skills-lock.json` 作为 skills 的**唯一可信来源**（记录每个 skill 的 GitHub 来源与 hash）。skills 实体不入库，换设备时按 lock 安装。

### 安装（首次 / 换设备）

```bash
pnpm install
pnpm skills:install            # = node scripts/install-skills.mjs
```

脚本会按 `skills-lock.json` 从 GitHub 拉取每个 `SKILL.md`，分发到各 agent 约定目录：

| Agent | 目录 |
|---|---|
| 通用 / 上级体系一致 | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| CodeBuddy | `.codebuddy/skills/` |

常用参数：

```bash
node scripts/install-skills.mjs --targets=cursor,claude   # 只装部分 agent
node scripts/install-skills.mjs --ref=<commit>            # 锁定到具体 commit（默认 HEAD）
node scripts/install-skills.mjs --dry-run                 # 只看计划，不联网不写盘
```

> 注意：`skills-lock.json` 仅记录单个 `SKILL.md` 的来源，附属大文件（如 `ui-ux-pro-max` 的 CSV 数据集、`scripts/`）不在 lock 内，需要时另行补齐。安装产物目录均已在 `.gitignore` 中忽略，不入库。

## 常用校验

```bash
pnpm type-check
pnpm test
pnpm build:h5
pnpm build:mp-weixin
node harness/playwright-verify.mjs   # H5 产物端到端断言
```
