import type { AmberAlert, KnowledgeNode } from '@teacher-exam/types';

export interface QuotaInput {
    nodes: KnowledgeNode[];
    remainingDays: number;
    targetMinutesPerDay: number;
}

export function calculateQuota({ nodes, remainingDays, targetMinutesPerDay }: QuotaInput): AmberAlert {
    const activeLeaves = nodes.filter((node) => node.isLeaf && node.status !== 'done' && node.status !== 'archived');
    const safeDays = Math.max(remainingDays, 1);
    const quota = activeLeaves.length / safeDays;
    const avgMinutes = average(activeLeaves.map((node) => node.estimatedMinutes ?? 30), 30);
    const estimatedMinutes = Math.ceil(quota * avgMinutes);
    const ratio = estimatedMinutes / Math.max(targetMinutesPerDay, 1);

    if (ratio >= 1.4) {
        return {
            level: 'red',
            quota,
            estimatedMinutes,
            message: '当前剩余任务已显著超过每日可承载时间，需要立即提额或回收低频考点。',
            actions: ['raise_quota', 'recycle_low_frequency']
        };
    }

    if (ratio >= 1.05) {
        return {
            level: 'amber',
            quota,
            estimatedMinutes,
            message: '今日额度开始逼近上限，建议提前调整后续节奏。',
            actions: ['raise_quota', 'recycle_low_frequency']
        };
    }

    if (ratio >= 0.85) {
        return {
            level: 'watch',
            quota,
            estimatedMinutes,
            message: '复习节奏接近上限，保持观察。',
            actions: ['raise_quota']
        };
    }

    return {
        level: 'none',
        quota,
        estimatedMinutes,
        message: '当前复习节奏稳定。',
        actions: []
    };
}

export function pickLowFrequencyLeaves(nodes: KnowledgeNode[], limit: number): KnowledgeNode[] {
    return nodes
        .filter((node) => node.isLeaf && node.status !== 'done' && node.status !== 'archived')
        .sort((a, b) => a.frequencyWeight - b.frequencyWeight || (b.estimatedMinutes ?? 0) - (a.estimatedMinutes ?? 0))
        .slice(0, limit);
}

function average(values: number[], fallback: number): number {
    if (values.length === 0) {
        return fallback;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
