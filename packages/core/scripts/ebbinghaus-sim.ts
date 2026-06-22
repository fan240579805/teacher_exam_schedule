import type { KnowledgeNode, ReviewState } from '@teacher-exam/types';
import { generateTodayTasks, nextReviewDate } from '../src';

const now = new Date('2026-06-22T08:00:00.000Z');

const nodes: KnowledgeNode[] = [
    {
        id: 'leaf-new',
        workspaceId: 'workspace-demo',
        parentId: 'section-1',
        level: 7,
        title: '教育的本质属性',
        description: null,
        isLeaf: true,
        status: 'available',
        orderIndex: 1,
        allocatedDays: null,
        estimatedMinutes: 35,
        scheduleMode: 'serial',
        frequencyWeight: 1,
        trapMemo: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    },
    {
        id: 'leaf-review',
        workspaceId: 'workspace-demo',
        parentId: 'section-1',
        level: 7,
        title: '教育的社会属性',
        description: null,
        isLeaf: true,
        status: 'done',
        orderIndex: 2,
        allocatedDays: null,
        estimatedMinutes: 30,
        scheduleMode: 'serial',
        frequencyWeight: 0.8,
        trapMemo: '注意区分永恒性与历史性',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    }
];

const reviews: ReviewState[] = [
    {
        nodeId: 'leaf-review',
        intervalIndex: 2,
        nextReviewAt: nextReviewDate(new Date('2026-06-18T08:00:00.000Z'), 2).toISOString(),
        lastReviewedAt: '2026-06-18T08:00:00.000Z',
        priority: 'P1'
    }
];

const tasks = generateTodayTasks({ nodes, reviews, now });

console.log(JSON.stringify({ now: now.toISOString(), tasks }, null, 2));
