import type { AiDrillResult, AnalyzeDrillInput, DrillType, KnowledgeNode } from '@teacher-exam/types';

// 逻辑骨架关键词：结构化=点题/析题/总结；试讲=导入/新授/练习/小结。
const FRAMEWORK_HINT: Record<DrillType, string> = {
    structured: '点题 → 析题 → 总结',
    lecture: '导入 → 新授 → 练习 → 小结',
    presentation: '说教材 → 说学情 → 说教法 → 说过程',
    defense: '亮明观点 → 给出依据 → 回应追问'
};

/**
 * mock AI 演练分析：纯函数、确定性（同输入同输出），无网络。
 * 真实环境用 STT + LLM 替换本函数，返回结构保持一致（AiDrillResult）。
 *
 * 评分以「演练时长是否落在合理区间」为主线，叠加按课题名派生的稳定扰动，
 * 让不同课题/时长得到可复现且有差异的结果，便于 UI 与雷达展示。
 */
export function analyzeDrillMock(input: AnalyzeDrillInput): AiDrillResult {
    const { durationSeconds, drillType, nodeTitle } = input;

    // 由课题名派生 0~1 的稳定扰动因子。
    const seed = hashString(nodeTitle);
    const jitter = (offset: number) => ((seed >> offset) & 0xff) / 255;

    // 时长把控：理想区间 [180, 480] 秒（3~8 分钟）。越靠近越高分。
    const ideal = 330;
    const timingError = Math.abs(durationSeconds - ideal) / ideal;
    const timing = clampScore(95 - Math.round(timingError * 60));

    // 口头禅：时长越长 + 扰动，估算"然后/那个"出现频次。
    const fillerCount = Math.max(0, Math.round((durationSeconds / 60) * (1.2 + jitter(0) * 2.4)));
    const fluency = clampScore(92 - fillerCount * 4);

    // 逻辑骨架：时长过短（<150s）多半没讲完整结构。
    const hasFramework = durationSeconds >= 150 && jitter(8) > 0.25;
    const logic = clampScore(hasFramework ? 78 + Math.round(jitter(8) * 17) : 45 + Math.round(jitter(8) * 20));

    // 踩分点遗漏：扰动决定缺失数量（0~2 项）。
    const missingPoints = pickMissingPoints(drillType, seed);

    const board = clampScore(70 + Math.round(jitter(16) * 25));
    const manner = clampScore(72 + Math.round(jitter(24) * 23));

    const verdict: AiDrillResult['verdict'] = hasFramework && fillerCount <= 8 && missingPoints.length === 0
        ? 'pass'
        : 'review';

    return {
        durationSeconds,
        fillerCount,
        hasFramework,
        missingPoints,
        scores: { timing, fluency, board, manner, logic },
        verdict,
        comment: buildComment({ verdict, fillerCount, hasFramework, missingPoints, drillType })
    };
}

export function frameworkHint(drillType: DrillType): string {
    return FRAMEWORK_HINT[drillType];
}

/** 笔试是否全部完成：所有 track!=='interview' 的叶子都已 done/archived。 */
export function isWrittenComplete(nodes: KnowledgeNode[]): boolean {
    const writtenLeaves = nodes.filter((node) => node.isLeaf && node.track !== 'interview');
    if (writtenLeaves.length === 0) {
        return true;
    }
    return writtenLeaves.every((node) => node.status === 'done' || node.status === 'archived');
}

function pickMissingPoints(drillType: DrillType, seed: number): string[] {
    const pool: Record<DrillType, string[]> = {
        structured: ['没有回扣题干关键词', '缺少分点小结', '对策不够具体可落地'],
        lecture: ['导入与新授衔接生硬', '缺少板书设计说明', '没有当堂练习巩固'],
        presentation: ['学情分析缺失', '教法依据没讲清', '缺少教学反思'],
        defense: ['论据支撑不足', '没有正面回应追问']
    };
    const items = pool[drillType];
    const count = seed % 3 === 0 ? 1 : 0; // 1/3 概率缺 1 项，确定性可复现
    return items.slice(0, count);
}

function buildComment(args: {
    verdict: 'pass' | 'review';
    fillerCount: number;
    hasFramework: boolean;
    missingPoints: string[];
    drillType: DrillType;
}): string {
    if (args.verdict === 'pass') {
        return `结构完整、表达干净，${FRAMEWORK_HINT[args.drillType]} 一气呵成，保持这个节奏。`;
    }
    if (!args.hasFramework) {
        return `骨架没搭起来，先把「${FRAMEWORK_HINT[args.drillType]}」练成肌肉记忆再开口。`;
    }
    if (args.missingPoints.length > 0) {
        return `内容踩点漏了：${args.missingPoints[0]}，下一遍重点补。`;
    }
    return `口头禅 ${args.fillerCount} 次偏多，刻意停顿代替"然后/那个"会更稳。`;
}

function clampScore(value: number): number {
    return Math.max(30, Math.min(99, value));
}

function hashString(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
