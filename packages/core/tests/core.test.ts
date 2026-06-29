import { describe, expect, it } from 'vitest';
import type { BookNode, KnowledgeNode, ReviewState } from '@teacher-exam/types';
import {
    analyzeDrillMock,
    buildBookTree,
    buildTree,
    calculateQuota,
    canAddLeaf,
    canUnlockCandidate,
    collectSubtreeIds,
    generateTodayTasks,
    getHomepageNodes,
    isReviewDue,
    isWrittenComplete,
    nextOrderIndex,
    nextReviewDate,
    settleObjective,
    settleRecite
} from '../src';

const now = new Date('2026-06-22T08:00:00.000Z');

function node(partial: Partial<KnowledgeNode>): KnowledgeNode {
    return {
        id: partial.id ?? crypto.randomUUID(),
        workspaceId: 'workspace-1',
        parentId: partial.parentId ?? null,
        level: partial.level ?? 7,
        title: partial.title ?? '节点',
        description: null,
        isLeaf: partial.isLeaf ?? true,
        status: partial.status ?? 'available',
        orderIndex: partial.orderIndex ?? 1,
        allocatedDays: null,
        estimatedMinutes: partial.estimatedMinutes ?? 30,
        scheduleMode: partial.scheduleMode ?? 'serial',
        frequencyWeight: partial.frequencyWeight ?? 1,
        trapMemo: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        ...partial
    };
}

describe('tree', () => {
    it('builds ordered tree and only exposes L1-L3 on homepage', () => {
        const nodes = [
            node({ id: 'l1', level: 1, title: '目标', isLeaf: false }),
            node({ id: 'l3', parentId: 'l2', level: 3, title: '教材', isLeaf: false }),
            node({ id: 'l2', parentId: 'l1', level: 2, title: '模块', isLeaf: false }),
            node({ id: 'l4', parentId: 'l3', level: 4, title: '章节', isLeaf: false })
        ];

        const tree = buildTree(nodes);
        const homepage = getHomepageNodes(nodes);

        expect(tree[0].children[0].children[0].id).toBe('l3');
        expect(homepage.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
    });

    it('allows lightweight leaf editing only below chapter levels', () => {
        expect(canAddLeaf(node({ level: 3, isLeaf: false }))).toBe(false);
        expect(canAddLeaf(node({ level: 5, isLeaf: false }))).toBe(true);
    });
});

describe('dispatcher', () => {
    it('injects due reviews as P0 before new available leaves', () => {
        const available = node({ id: 'new', orderIndex: 2 });
        const reviewNode = node({ id: 'review', status: 'done', orderIndex: 1 });
        const reviews: ReviewState[] = [
            {
                nodeId: 'review',
                intervalIndex: 2,
                nextReviewAt: '2026-06-21T08:00:00.000Z',
                priority: 'P1'
            }
        ];

        const tasks = generateTodayTasks({
            nodes: [available, reviewNode],
            reviews,
            now
        });

        expect(tasks[0].node.id).toBe('review');
        expect(tasks[0].priority).toBe('P0');
        expect(tasks[1].node.id).toBe('new');
    });

    it('keeps serial lock until all previous siblings are done', () => {
        const first = node({ id: 'first', parentId: 'parent', status: 'done', orderIndex: 1 });
        const second = node({ id: 'second', parentId: 'parent', status: 'locked', orderIndex: 2 });

        expect(canUnlockCandidate(second, [first, second])).toBe(true);
        expect(canUnlockCandidate(second, [{ ...first, status: 'available' }, second])).toBe(false);
    });

    it('treats archived previous leaves as pruned from serial locks', () => {
        const first = node({ id: 'first', parentId: 'parent', status: 'archived', orderIndex: 1 });
        const second = node({ id: 'second', parentId: 'parent', status: 'locked', orderIndex: 2 });

        expect(canUnlockCandidate(second, [first, second])).toBe(true);
    });
});

describe('ebbinghaus and quota', () => {
    it('calculates next review and due state', () => {
        expect(nextReviewDate(now, 2).toISOString()).toBe('2026-06-26T08:00:00.000Z');
        expect(isReviewDue({ nodeId: 'n1', intervalIndex: 1, nextReviewAt: now.toISOString(), priority: 'P1' }, now)).toBe(true);
    });

    it('raises amber alert when remaining workload exceeds day capacity', () => {
        const alert = calculateQuota({
            nodes: [
                node({ estimatedMinutes: 90 }),
                node({ estimatedMinutes: 90 }),
                node({ estimatedMinutes: 90 })
            ],
            remainingDays: 1,
            targetMinutesPerDay: 180
        });

        expect(alert.level).toBe('red');
        expect(alert.actions).toContain('recycle_low_frequency');
    });
});

describe('settlement', () => {
    it('normalizes objective and recite scores', () => {
        expect(settleObjective({ totalCount: 10, wrongCount: 2 }).score).toBe(0.8);
        expect(settleRecite({ mastery: 80 }).mastery).toBe(0.8);
    });
});

function bookNode(partial: Partial<BookNode>): BookNode {
    return {
        id: partial.id ?? crypto.randomUUID(),
        bookId: partial.bookId ?? 'book-1',
        parentId: partial.parentId ?? null,
        title: partial.title ?? '节点',
        subtitle: partial.subtitle ?? null,
        orderIndex: partial.orderIndex ?? 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        ...partial
    };
}

describe('interview drill (双轨调度 + mock 分析)', () => {
    const writtenLeaf = (id: string, status: KnowledgeNode['status']) => node({ id, status, track: 'written', orderIndex: 1 });
    const interviewLeaf = (id: string, status: KnowledgeNode['status']) => node({ id, status, track: 'interview', orderIndex: 1 });

    it('isWrittenComplete 仅看笔试叶子是否全部 done/archived', () => {
        expect(isWrittenComplete([writtenLeaf('w1', 'done'), interviewLeaf('i1', 'available')])).toBe(true);
        expect(isWrittenComplete([writtenLeaf('w1', 'available')])).toBe(false);
        expect(isWrittenComplete([writtenLeaf('w1', 'done'), writtenLeaf('w2', 'archived')])).toBe(true);
    });

    it('串行模式下笔试未完成时不派发面试任务', () => {
        const nodes = [
            node({ id: 'w1', status: 'available', track: 'written', orderIndex: 1 }),
            node({ id: 'i1', status: 'available', track: 'interview', orderIndex: 2 })
        ];
        const serial = generateTodayTasks({ nodes, reviews: [], now, interviewMode: 'serial' });
        expect(serial.some((task) => task.node.id === 'i1')).toBe(false);

        const parallel = generateTodayTasks({ nodes, reviews: [], now, interviewMode: 'parallel' });
        expect(parallel.some((task) => task.node.id === 'i1')).toBe(true);
    });

    it('interviewEnabled=false 时面试任务完全不进调度', () => {
        const nodes = [node({ id: 'i1', status: 'available', track: 'interview', orderIndex: 1 })];
        const tasks = generateTodayTasks({ nodes, reviews: [], now, interviewEnabled: false });
        expect(tasks).toHaveLength(0);
    });

    it('analyzeDrillMock 确定性输出且对超短录音判 review', () => {
        const input = { durationSeconds: 330, drillType: 'structured' as const, nodeTitle: '《静夜思》试讲' };
        const a = analyzeDrillMock(input);
        const b = analyzeDrillMock(input);
        expect(a).toEqual(b);
        expect(a.scores.timing).toBeGreaterThanOrEqual(30);
        expect(a.scores.timing).toBeLessThanOrEqual(99);

        const tooShort = analyzeDrillMock({ durationSeconds: 20, drillType: 'structured' as const, nodeTitle: '《静夜思》试讲' });
        expect(tooShort.hasFramework).toBe(false);
        expect(tooShort.verdict).toBe('review');
    });
});

describe('book mind map', () => {
    it('builds nested tree ordered by orderIndex', () => {
        const nodes = [
            bookNode({ id: 'root', parentId: null, orderIndex: 1, title: '教育心理学' }),
            bookNode({ id: 'b', parentId: 'root', orderIndex: 2, title: '学习理论' }),
            bookNode({ id: 'a', parentId: 'root', orderIndex: 1, title: '绪论' }),
            bookNode({ id: 'a1', parentId: 'a', orderIndex: 1, title: '研究对象' })
        ];

        const tree = buildBookTree(nodes);

        expect(tree).toHaveLength(1);
        expect(tree[0].children.map((child) => child.id)).toEqual(['a', 'b']);
        expect(tree[0].children[0].children[0].id).toBe('a1');
    });

    it('collects subtree ids and computes next order index', () => {
        const nodes = [
            bookNode({ id: 'root', parentId: null, orderIndex: 1 }),
            bookNode({ id: 'a', parentId: 'root', orderIndex: 1 }),
            bookNode({ id: 'a1', parentId: 'a', orderIndex: 1 }),
            bookNode({ id: 'b', parentId: 'root', orderIndex: 2 })
        ];

        expect(collectSubtreeIds(nodes, 'a').sort()).toEqual(['a', 'a1']);
        expect(nextOrderIndex(nodes, 'root')).toBe(3);
    });
});
