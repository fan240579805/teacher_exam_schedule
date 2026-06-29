# CLAUDE.md

本项目的协作约定以根目录 [`AGENTS.md`](./AGENTS.md) 为准（项目简介、红线、校验命令、skills 机制）。

## Skills

Skills 由根目录 `skills-lock.json` 统一管理，实体不入库。首次或换设备：

```bash
pnpm install
pnpm skills:install     # 按 lock 拉取并分发到 .claude/skills 等各 agent 目录
```

Claude Code 读取 `.claude/skills/<name>/SKILL.md`（由上面的安装脚本生成）。

## 关键纪律

- 所有文档、进度、提交信息用中文。
- 每次改动后更新 `.agent/` 下的 `TODO.md` / `STATE.json` / `CHANGELOG.md`。
- 不提交真实密钥。
