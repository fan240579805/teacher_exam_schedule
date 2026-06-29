#!/usr/bin/env node
/**
 * 跨 agent skills 安装器
 *
 * 读取仓库根 `skills-lock.json`，按每个 skill 的 GitHub 来源拉取 `SKILL.md`，
 * 分发到各 AI agent 约定目录，使 Cursor / Claude Code / CodeBuddy 等都能识别同一套 skills。
 *
 * 设计要点：
 * - 零额外依赖，仅用 Node 18+ 内置 fetch / crypto / fs。
 * - skills 实体不入库（见 .gitignore），换设备 clone 后跑本脚本按 lock 恢复。
 * - lock 只记录单个 SKILL.md 来源，故仅恢复 SKILL.md 主文件；附属大文件（如 ui-ux-pro-max 的 CSV）需另行处理，脚本会给出提示。
 *
 * 用法：
 *   node scripts/install-skills.mjs                 # 安装到全部 agent 目录
 *   node scripts/install-skills.mjs --targets=cursor,claude
 *   node scripts/install-skills.mjs --ref=main      # 指定 git ref（默认 HEAD）
 *   node scripts/install-skills.mjs --dry-run       # 只打印计划，不联网不写盘
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = join(ROOT, 'skills-lock.json');

// 各 agent 约定的 skills 目录（相对仓库根）。
const ALL_TARGETS = {
    agents: '.agents/skills', // 通用 / 与上级体系一致
    cursor: '.cursor/skills', // Cursor
    claude: '.claude/skills', // Claude Code
    codebuddy: '.codebuddy/skills' // CodeBuddy
};

function parseArgs(argv) {
    const opts = { ref: 'HEAD', targets: Object.keys(ALL_TARGETS), dryRun: false };

    for (const arg of argv) {
        if (arg === '--dry-run') {
            opts.dryRun = true;
        } else if (arg === '--help' || arg === '-h') {
            opts.help = true;
        } else if (arg.startsWith('--ref=')) {
            opts.ref = arg.slice('--ref='.length).trim() || 'HEAD';
        } else if (arg.startsWith('--targets=')) {
            const list = arg
                .slice('--targets='.length)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            opts.targets = list.length > 0 ? list : Object.keys(ALL_TARGETS);
        }
    }

    return opts;
}

function printHelp() {
    console.log(`跨 agent skills 安装器

用法:
  node scripts/install-skills.mjs [--targets=cursor,claude,codebuddy,agents] [--ref=HEAD] [--dry-run]

可选 targets: ${Object.keys(ALL_TARGETS).join(', ')}`);
}

/** 由 skillPath 推断规范的 skill 目录名（取 SKILL.md 的父目录名），回退到 lock key。 */
function skillDirName(name, skillPath) {
    const segments = skillPath.split('/').filter(Boolean);
    if (segments.length >= 2) {
        return segments[segments.length - 2];
    }
    return name;
}

function rawUrl(source, ref, skillPath) {
    // source 形如 owner/repo；GitHub raw 支持 /{owner}/{repo}/{ref}/{path}
    return `https://raw.githubusercontent.com/${source}/${ref}/${skillPath}`;
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));

    if (opts.help) {
        printHelp();
        return;
    }

    const invalidTargets = opts.targets.filter((target) => !ALL_TARGETS[target]);
    if (invalidTargets.length > 0) {
        console.error(`未知 target: ${invalidTargets.join(', ')}；可选: ${Object.keys(ALL_TARGETS).join(', ')}`);
        process.exit(2);
    }

    let lock;
    try {
        lock = JSON.parse(await readFile(LOCK_PATH, 'utf8'));
    } catch (error) {
        console.error(`无法读取 skills-lock.json: ${error.message}`);
        process.exit(2);
    }

    const skills = Object.entries(lock.skills ?? {});
    if (skills.length === 0) {
        console.error('skills-lock.json 中没有任何 skill。');
        process.exit(2);
    }

    const targetDirs = opts.targets.map((target) => ALL_TARGETS[target]);
    console.log(`安装 ${skills.length} 个 skill -> [${opts.targets.join(', ')}] (ref=${opts.ref})${opts.dryRun ? ' [dry-run]' : ''}\n`);

    let ok = 0;
    let failed = 0;
    let hashMismatch = 0;

    for (const [name, meta] of skills) {
        const dir = skillDirName(name, meta.skillPath);
        const url = rawUrl(meta.source, opts.ref, meta.skillPath);

        if (opts.dryRun) {
            console.log(`· ${name}`);
            console.log(`    拉取  ${url}`);
            for (const target of targetDirs) {
                console.log(`    写入  ${join(target, dir, 'SKILL.md')}`);
            }
            ok += 1;
            continue;
        }

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`✗ ${name}: HTTP ${res.status} ${url}`);
                failed += 1;
                continue;
            }

            const text = await res.text();

            if (meta.computedHash) {
                const hash = createHash('sha256').update(text).digest('hex');
                if (hash !== meta.computedHash) {
                    hashMismatch += 1;
                    console.warn(`  ! ${name}: 内容 hash 与 lock 不一致（来源默认分支可能已更新；如需锁定请用 --ref 指定具体 commit）`);
                }
            }

            for (const target of targetDirs) {
                const outDir = join(ROOT, target, dir);
                await mkdir(outDir, { recursive: true });
                await writeFile(join(outDir, 'SKILL.md'), text, 'utf8');
            }

            console.log(`✓ ${name} -> ${dir}/SKILL.md`);
            ok += 1;
        } catch (error) {
            console.error(`✗ ${name}: ${error.message}`);
            failed += 1;
        }
    }

    console.log(`\n完成：成功 ${ok}，失败 ${failed}${hashMismatch ? `，hash 不一致 ${hashMismatch}` : ''}。`);
    if (!opts.dryRun) {
        console.log('提示：lock 仅记录 SKILL.md，带附属数据的 skill（如 ui-ux-pro-max 的 CSV）需自行补齐。');
    }

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
