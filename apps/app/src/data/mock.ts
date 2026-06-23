import type { DailyCheckin, HeatmapDay, KnowledgeNode, ReviewState, Workspace } from '@teacher-exam/types';

const now = '2026-06-22T08:00:00.000Z';

export const mockWorkspace: Workspace = {
    id: 'workspace-demo',
    userId: 'local-user',
    title: '深圳教综 90 天冲刺',
    region: '深圳',
    subject: '教综',
    examCategory: '教师招聘笔试',
    startDate: '2026-06-01',
    examDate: '2026-08-30',
    createdAt: now,
    updatedAt: now
};

export const mockNodes: KnowledgeNode[] = [
    node({ id: 'target', parentId: null, level: 1, title: '深圳教师招聘', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'module-edu', parentId: 'target', level: 2, title: '教育综合知识', isLeaf: false, orderIndex: 1, allocatedDays: 20, status: 'available' }),
    node({ id: 'book-edu', parentId: 'module-edu', level: 3, title: '教育学教材', isLeaf: false, orderIndex: 1, allocatedDays: 8, status: 'available' }),
    node({ id: 'chapter-1', parentId: 'book-edu', level: 4, title: '第一编 教育与教育学', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'unit-1', parentId: 'chapter-1', level: 5, title: '第一章 教育的产生与发展', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'section-1', parentId: 'unit-1', level: 6, title: '第一节 教育的概念', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-1', parentId: 'section-1', level: 7, title: '教育的本质属性', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 35, frequencyWeight: 1 }),
    node({ id: 'leaf-2', parentId: 'section-1', level: 7, title: '教育的社会属性', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 30, frequencyWeight: 0.8 }),
    node({ id: 'chapter-2', parentId: 'book-edu', level: 4, title: '第二编 教育与社会发展', isLeaf: false, orderIndex: 2, status: 'locked' }),
    node({ id: 'unit-2', parentId: 'chapter-2', level: 5, title: '第二章 教育功能', isLeaf: false, orderIndex: 1, status: 'locked' }),
    node({ id: 'section-2', parentId: 'unit-2', level: 6, title: '第一节 教育功能概述', isLeaf: false, orderIndex: 1, status: 'locked' }),
    node({ id: 'leaf-3', parentId: 'section-2', level: 7, title: '个体发展功能', isLeaf: true, orderIndex: 1, status: 'locked', estimatedMinutes: 30, frequencyWeight: 0.9 })
];

export const mockReviews: ReviewState[] = [
    {
        nodeId: 'leaf-2',
        intervalIndex: 2,
        nextReviewAt: '2026-06-22T08:00:00.000Z',
        lastReviewedAt: '2026-06-18T08:00:00.000Z',
        priority: 'P1'
    }
];

export const mockHeatmap: HeatmapDay[] = [
    { date: '2026-06-18', minutes: 120, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-19', minutes: 180, closedCount: 4, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-19.jpg' },
    { date: '2026-06-20', minutes: 60, closedCount: 1, hasCheckin: true, imageUrl: null },
    { date: '2026-06-21', minutes: 210, closedCount: 5, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-21.jpg' },
    { date: '2026-06-22', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null }
];

export const mockDailyCheckins: DailyCheckin[] = [
    {
        id: 'checkin-2026-06-18',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-18',
        streakDays: 1,
        memo: '完成教育本质属性复盘，错因集中在概念外延。',
        imageUrl: null,
        createdAt: '2026-06-18T21:30:00.000Z'
    },
    {
        id: 'checkin-2026-06-19',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-19',
        streakDays: 2,
        memo: '今天把教育社会属性和个体发展功能区分清楚了。',
        imageUrl: 'mock://checkins/2026-06-19.jpg',
        createdAt: '2026-06-19T21:30:00.000Z'
    },
    {
        id: 'checkin-2026-06-21',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-21',
        streakDays: 1,
        memo: '周末恢复执行，重点记住串行推进不要跳章。',
        imageUrl: 'mock://checkins/2026-06-21.jpg',
        createdAt: '2026-06-21T21:30:00.000Z'
    }
];

function node(partial: Partial<KnowledgeNode>): KnowledgeNode {
    return {
        id: '',
        workspaceId: mockWorkspace.id,
        parentId: null,
        level: 7,
        title: '',
        description: null,
        isLeaf: true,
        status: 'locked',
        orderIndex: 1,
        allocatedDays: null,
        estimatedMinutes: null,
        scheduleMode: 'serial',
        frequencyWeight: 1,
        trapMemo: null,
        createdAt: now,
        updatedAt: now,
        ...partial
    };
}
