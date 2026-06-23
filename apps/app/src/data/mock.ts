import type { DailyCheckin, HeatmapDay, KnowledgeNode, ReviewState, StudyLog, Workspace } from '@teacher-exam/types';

const now = '2026-06-22T08:00:00.000Z';
export const mockWorkspace: Workspace = {
    id: 'workspace-demo',
    userId: 'local-user',
    title: '深圳小学语文 · 暑期冲刺',
    region: '深圳',
    subject: '小学语文',
    examCategory: '教师招聘笔试',
    startDate: '2026-06-01',
    examDate: '2026-08-30',
    createdAt: now,
    updatedAt: now
};

// L1 总目标 → L2 三大模块 → L3 教材 → L4 编 → L5 章 → L6 节 → L7 叶子
// 与 PRD §一·1 的 7 层结构一一对应；仪表盘按 L2 模块燃尽。
export const mockNodes: KnowledgeNode[] = [
    node({ id: 'target', parentId: null, level: 1, title: '深圳小学语文教师招聘', isLeaf: false, orderIndex: 1, status: 'available' }),

    // ========== 模块一：教育综合知识 ==========
    node({ id: 'm-edu', parentId: 'target', level: 2, title: '教育综合知识', isLeaf: false, orderIndex: 1, allocatedDays: 28, status: 'available' }),
    node({ id: 'b-edu', parentId: 'm-edu', level: 3, title: '《教育学》', isLeaf: false, orderIndex: 1, allocatedDays: 12, status: 'available' }),
    node({ id: 'c-edu-1', parentId: 'b-edu', level: 4, title: '第一编 教育与教育学', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-edu-1', parentId: 'c-edu-1', level: 5, title: '第一章 教育的产生与发展', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-edu-1', parentId: 'u-edu-1', level: 6, title: '第一节 教育的概念与本质', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-edu-1', parentId: 's-edu-1', level: 7, title: '教育的本质属性', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 35, frequencyWeight: 1, trapMemo: '别把"有目的培养人"漏成"培养人"' }),
    node({ id: 'leaf-edu-2', parentId: 's-edu-1', level: 7, title: '教育的社会属性（永恒/历史/相对独立）', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 30, frequencyWeight: 0.9 }),
    node({ id: 'leaf-edu-3', parentId: 's-edu-1', level: 7, title: '教育起源的几种学说对比', isLeaf: true, orderIndex: 3, status: 'locked', estimatedMinutes: 25, frequencyWeight: 0.8 }),

    node({ id: 'b-psy', parentId: 'm-edu', level: 3, title: '《教育心理学》', isLeaf: false, orderIndex: 2, allocatedDays: 10, status: 'available' }),
    node({ id: 'c-psy-1', parentId: 'b-psy', level: 4, title: '第二编 学习与教学', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-psy-1', parentId: 'c-psy-1', level: 5, title: '第三章 学习理论', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-psy-1', parentId: 'u-psy-1', level: 6, title: '第一节 行为主义学习理论', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-psy-1', parentId: 's-psy-1', level: 7, title: '桑代克尝试-错误说', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 30, frequencyWeight: 1, trapMemo: '三大律：准备/练习/效果，别和加涅九段搞混' }),
    node({ id: 'leaf-psy-2', parentId: 's-psy-1', level: 7, title: '巴甫洛夫经典性条件作用', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 25, frequencyWeight: 0.9 }),
    node({ id: 'leaf-psy-3', parentId: 's-psy-1', level: 7, title: '斯金纳操作性条件作用', isLeaf: true, orderIndex: 3, status: 'locked', estimatedMinutes: 30, frequencyWeight: 1 }),

    // ========== 模块二：学科专业知识（小学语文） ==========
    node({ id: 'm-subj', parentId: 'target', level: 2, title: '小学语文学科知识', isLeaf: false, orderIndex: 2, allocatedDays: 30, status: 'available' }),
    node({ id: 'b-subj', parentId: 'm-subj', level: 3, title: '《现代汉语》', isLeaf: false, orderIndex: 1, allocatedDays: 12, status: 'available' }),
    node({ id: 'c-subj-1', parentId: 'b-subj', level: 4, title: '第二编 语音与文字', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-subj-1', parentId: 'c-subj-1', level: 5, title: '第一章 普通话语音', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-subj-1', parentId: 'u-subj-1', level: 6, title: '第一节 声母与韵母', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-subj-1', parentId: 's-subj-1', level: 7, title: '声母发音部位与发音方法', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 35, frequencyWeight: 1, trapMemo: 'zh/z、ch/c、sh/s 翘舌平舌一组背' }),
    node({ id: 'leaf-subj-2', parentId: 's-subj-1', level: 7, title: '韵母分类与拼写规则', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 30, frequencyWeight: 0.9 }),
    node({ id: 'leaf-subj-3', parentId: 's-subj-1', level: 7, title: '常考多音字与轻声变调', isLeaf: true, orderIndex: 3, status: 'locked', estimatedMinutes: 25, frequencyWeight: 0.8 }),

    node({ id: 'b-curri', parentId: 'm-subj', level: 3, title: '《义务教育语文课程标准（2022 版）》', isLeaf: false, orderIndex: 2, allocatedDays: 8, status: 'available' }),
    node({ id: 'c-curri-1', parentId: 'b-curri', level: 4, title: '第二部分 课程理念与目标', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-curri-1', parentId: 'c-curri-1', level: 5, title: '第一章 核心素养', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-curri-1', parentId: 'u-curri-1', level: 6, title: '第一节 四大核心素养', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-curri-1', parentId: 's-curri-1', level: 7, title: '文化自信、语言运用、思维能力、审美创造', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 25, frequencyWeight: 1, trapMemo: '顺序记成"文-语-思-审"，简答必考' }),
    node({ id: 'leaf-curri-2', parentId: 's-curri-1', level: 7, title: '学习任务群六大类', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 30, frequencyWeight: 0.9 }),

    // ========== 模块三：教师职业能力 ==========
    node({ id: 'm-prof', parentId: 'target', level: 2, title: '教师职业能力', isLeaf: false, orderIndex: 3, allocatedDays: 18, status: 'available' }),
    node({ id: 'b-law', parentId: 'm-prof', level: 3, title: '教育法律法规', isLeaf: false, orderIndex: 1, allocatedDays: 6, status: 'available' }),
    node({ id: 'c-law-1', parentId: 'b-law', level: 4, title: '第一编 核心法律', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-law-1', parentId: 'c-law-1', level: 5, title: '第一章 教师法与教育法', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-law-1', parentId: 'u-law-1', level: 6, title: '第一节 教师的权利与义务', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-law-1', parentId: 's-law-1', level: 7, title: '教师六大权利速记', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 25, frequencyWeight: 1, trapMemo: '"教-科-管-酬-培-参" 六字诀' }),
    node({ id: 'leaf-law-2', parentId: 's-law-1', level: 7, title: '教师六大义务对照', isLeaf: true, orderIndex: 2, status: 'locked', estimatedMinutes: 25, frequencyWeight: 0.9 }),

    node({ id: 'b-ethic', parentId: 'm-prof', level: 3, title: '《新时代中小学教师职业行为十项准则》', isLeaf: false, orderIndex: 2, allocatedDays: 4, status: 'available' }),
    node({ id: 'c-ethic-1', parentId: 'b-ethic', level: 4, title: '第一编 师德规范', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'u-ethic-1', parentId: 'c-ethic-1', level: 5, title: '第一章 十项准则', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 's-ethic-1', parentId: 'u-ethic-1', level: 6, title: '第一节 红线条款', isLeaf: false, orderIndex: 1, status: 'available' }),
    node({ id: 'leaf-ethic-1', parentId: 's-ethic-1', level: 7, title: '十项准则一字背诵清单', isLeaf: true, orderIndex: 1, status: 'available', estimatedMinutes: 30, frequencyWeight: 1, trapMemo: '材料分析题首选援引' })
];

export const mockReviews: ReviewState[] = [
    {
        nodeId: 'leaf-edu-1',
        intervalIndex: 2,
        nextReviewAt: '2026-06-22T08:00:00.000Z',
        lastReviewedAt: '2026-06-18T08:00:00.000Z',
        priority: 'P1'
    }
];

// 35 天热力数据（5 行 x 7 列），覆盖 2026-05-19 ~ 2026-06-22 当周
// 工作日普遍较高（90~210 分钟），周末有低谷与断签，更贴近真实备考节奏
export const mockHeatmap: HeatmapDay[] = [
    { date: '2026-05-19', minutes: 150, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-05-20', minutes: 110, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-05-21', minutes: 200, closedCount: 4, hasCheckin: true, imageUrl: 'mock://checkins/2026-05-21.jpg' },
    { date: '2026-05-22', minutes: 90, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-05-23', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null },
    { date: '2026-05-24', minutes: 60, closedCount: 1, hasCheckin: true, imageUrl: null },
    { date: '2026-05-25', minutes: 210, closedCount: 5, hasCheckin: true, imageUrl: 'mock://checkins/2026-05-25.jpg' },
    { date: '2026-05-26', minutes: 180, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-05-27', minutes: 130, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-05-28', minutes: 95, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-05-29', minutes: 165, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-05-30', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null },
    { date: '2026-05-31', minutes: 75, closedCount: 1, hasCheckin: true, imageUrl: null },
    { date: '2026-06-01', minutes: 200, closedCount: 5, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-01.jpg' },
    { date: '2026-06-02', minutes: 150, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-03', minutes: 130, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-04', minutes: 100, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-06-05', minutes: 175, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-06-06', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null },
    { date: '2026-06-07', minutes: 60, closedCount: 1, hasCheckin: true, imageUrl: null },
    { date: '2026-06-08', minutes: 195, closedCount: 4, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-08.jpg' },
    { date: '2026-06-09', minutes: 165, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-06-10', minutes: 140, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-11', minutes: 100, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-06-12', minutes: 185, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-06-13', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null },
    { date: '2026-06-14', minutes: 90, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-06-15', minutes: 175, closedCount: 4, hasCheckin: true, imageUrl: null },
    { date: '2026-06-16', minutes: 145, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-17', minutes: 110, closedCount: 2, hasCheckin: true, imageUrl: null },
    { date: '2026-06-18', minutes: 120, closedCount: 3, hasCheckin: true, imageUrl: null },
    { date: '2026-06-19', minutes: 180, closedCount: 4, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-19.jpg' },
    { date: '2026-06-20', minutes: 60, closedCount: 1, hasCheckin: true, imageUrl: null },
    { date: '2026-06-21', minutes: 210, closedCount: 5, hasCheckin: true, imageUrl: 'mock://checkins/2026-06-21.jpg' },
    { date: '2026-06-22', minutes: 0, closedCount: 0, hasCheckin: false, imageUrl: null }
];

// 客观刷题日志：用于「刷题正确率」与「日均学习时长」的统计
export const mockActionLogs: StudyLog[] = [
    {
        id: 'log-edu-1-obj',
        workspaceId: mockWorkspace.id,
        nodeId: 'leaf-edu-1',
        actionType: 'objective',
        payload: { totalCount: 30, wrongCount: 4 },
        durationMinutes: 35,
        score: 87,
        mastery: 87,
        trapMemo: null,
        createdAt: '2026-06-18T20:30:00.000Z'
    },
    {
        id: 'log-psy-1-obj',
        workspaceId: mockWorkspace.id,
        nodeId: 'leaf-psy-1',
        actionType: 'objective',
        payload: { totalCount: 25, wrongCount: 3 },
        durationMinutes: 30,
        score: 88,
        mastery: 88,
        trapMemo: null,
        createdAt: '2026-06-19T20:00:00.000Z'
    },
    {
        id: 'log-subj-1-comp',
        workspaceId: mockWorkspace.id,
        nodeId: 'leaf-subj-1',
        actionType: 'comprehensive',
        payload: { durationMinutes: 35, scorePoints: 80 },
        durationMinutes: 35,
        score: 80,
        mastery: 80,
        trapMemo: null,
        createdAt: '2026-06-21T19:30:00.000Z'
    }
];

export const mockDailyCheckins: DailyCheckin[] = [
    {
        id: 'checkin-2026-06-18',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-18',
        streakDays: 1,
        memo: '本质属性又错在"有目的"三个字，下次先看选项里有没有这词',
        imageUrl: null,
        createdAt: '2026-06-18T21:30:00.000Z'
    },
    {
        id: 'checkin-2026-06-19',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-19',
        streakDays: 2,
        memo: '今天把社会属性几条全捋了一遍，永恒/历史/相对独立 终于不混了',
        imageUrl: 'mock://checkins/2026-06-19.jpg',
        createdAt: '2026-06-19T21:30:00.000Z'
    },
    {
        id: 'checkin-2026-06-21',
        workspaceId: mockWorkspace.id,
        checkinDate: '2026-06-21',
        streakDays: 1,
        memo: '周末状态不行，只刷了 1 节，明天补上，别再断签',
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
