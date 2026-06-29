export type UUID = string;

export type KnowledgeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'done' | 'archived';

export type ScheduleMode = 'serial' | 'parallel';

export type ActionType = 'objective' | 'recite' | 'comprehensive';

export type TaskTrack = 'written' | 'interview';

export type DrillType = 'structured' | 'lecture' | 'presentation' | 'defense';

export interface Workspace {
    id: UUID;
    userId: UUID;
    title: string;
    region: string;
    subject: string;
    examCategory: string;
    startDate: string;
    examDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface KnowledgeNode {
    id: UUID;
    workspaceId: UUID;
    parentId: UUID | null;
    level: KnowledgeLevel;
    title: string;
    description?: string | null;
    isLeaf: boolean;
    status: NodeStatus;
    orderIndex: number;
    allocatedDays?: number | null;
    estimatedMinutes?: number | null;
    scheduleMode: ScheduleMode;
    frequencyWeight: number;
    trapMemo?: string | null;
    completedAt?: string | null;
    /** 任务分轨：笔试（缺省）或面试演练。面试节点点击后唤起音频结算台 V2。 */
    track?: TaskTrack;
    /** 面试叶子的演练形式，仅 track==='interview' 的叶子使用。 */
    drillType?: DrillType;
    createdAt: string;
    updatedAt: string;
}

export interface TreeNode extends KnowledgeNode {
    children: TreeNode[];
}

export interface ObjectivePayload {
    totalCount: number;
    wrongCount: number;
}

export interface RecitePayload {
    mastery: 20 | 50 | 80 | 100;
}

export interface ComprehensivePayload {
    durationMinutes: number;
    scorePoints?: number;
    note?: string;
}

export type SettlementPayload = ObjectivePayload | RecitePayload | ComprehensivePayload;

export interface StudyLog {
    id: UUID;
    workspaceId: UUID;
    nodeId: UUID;
    actionType: ActionType;
    payload: SettlementPayload;
    durationMinutes: number;
    score: number;
    mastery: number;
    trapMemo?: string | null;
    createdAt: string;
}

export interface DailyCheckin {
    id: UUID;
    workspaceId: UUID;
    checkinDate: string;
    streakDays: number;
    memo: string;
    imageUrl?: string | null;
    createdAt: string;
}

export interface CreateDailyCheckinInput {
    memo: string;
    imagePath?: string | null;
}

export interface ReviewState {
    nodeId: UUID;
    intervalIndex: number;
    nextReviewAt: string;
    lastReviewedAt?: string | null;
    priority: 'P0' | 'P1' | 'P2';
}

export interface DispatchTask {
    node: KnowledgeNode;
    reason: 'new' | 'review' | 'amber_recovery';
    priority: 'P0' | 'P1' | 'P2';
    dueAt?: string;
}

export interface AmberAlert {
    level: 'none' | 'watch' | 'amber' | 'red';
    quota: number;
    estimatedMinutes: number;
    message: string;
    actions: Array<'raise_quota' | 'recycle_low_frequency'>;
}

export interface HeatmapDay {
    date: string;
    minutes: number;
    closedCount: number;
    hasCheckin: boolean;
    imageUrl?: string | null;
}

export interface Book {
    id: UUID;
    workspaceId: UUID;
    title: string;
    author?: string | null;
    coverColor: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface BookNode {
    id: UUID;
    bookId: UUID;
    parentId: UUID | null;
    title: string;
    subtitle?: string | null;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface BookTreeNode extends BookNode {
    children: BookTreeNode[];
}

export interface CreateBookInput {
    title: string;
    author?: string | null;
    coverColor?: string;
}

export interface UpsertBookNodeInput {
    title: string;
    subtitle?: string | null;
}

/** AI 对一次面试演练录音的客观解构结果（前端 mock 与真实 LLM 返回结构一致）。 */
export interface DrillRadarScores {
    timing: number; // 时间把控
    fluency: number; // 语言流畅
    board: number; // 板书完整
    manner: number; // 教态
    logic: number; // 逻辑框架
}

export interface AiDrillResult {
    durationSeconds: number;
    fillerCount: number; // 口头禅/废话次数
    hasFramework: boolean; // 逻辑骨架是否完整
    missingPoints: string[]; // 踩分点遗漏
    scores: DrillRadarScores; // 五维客观评分
    verdict: 'pass' | 'review'; // 自动亮绿 / 需复盘
    comment: string; // 最犀利的一句点评
}

export interface DrillRun {
    id: UUID;
    nodeId: UUID;
    drillType: DrillType;
    result: AiDrillResult;
    createdAt: string;
}

export interface AnalyzeDrillInput {
    durationSeconds: number;
    drillType: DrillType;
    nodeTitle: string;
}
