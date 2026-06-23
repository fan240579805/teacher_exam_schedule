export type UUID = string;

export type KnowledgeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'done' | 'archived';

export type ScheduleMode = 'serial' | 'parallel';

export type ActionType = 'objective' | 'recite' | 'comprehensive';

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
