import type { DispatchTask, KnowledgeNode, ReviewState } from '@teacher-exam/types';
import { markDueReviews } from './ebbinghaus';
import { isWrittenComplete } from './drill';

export interface DispatchInput {
    nodes: KnowledgeNode[];
    reviews: ReviewState[];
    now: Date;
    /** 面试模块是否启用，关闭时面试任务完全不进调度。默认 true。 */
    interviewEnabled?: boolean;
    /** 双轨模式：并行同排，串行需笔试全部完成才解锁面试。默认 parallel。 */
    interviewMode?: 'parallel' | 'serial';
}

export function generateTodayTasks({
    nodes,
    reviews,
    now,
    interviewEnabled = true,
    interviewMode = 'parallel'
}: DispatchInput): DispatchTask[] {
    const writtenDone = isWrittenComplete(nodes);
    const allowInterview = (node: KnowledgeNode) => {
        if (node.track !== 'interview') {
            return true;
        }
        if (!interviewEnabled) {
            return false;
        }
        // 串行模式：笔试未全部完成前，不派发面试任务。
        return interviewMode !== 'serial' || writtenDone;
    };

    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const tasks = new Map<string, DispatchTask>();

    markDueReviews(reviews, now)
        .filter((review) => review.priority === 'P0')
        .forEach((review) => {
            const node = nodeMap.get(review.nodeId);
            if (node && node.status !== 'archived' && allowInterview(node)) {
                tasks.set(node.id, {
                    node,
                    reason: 'review',
                    priority: 'P0',
                    dueAt: review.nextReviewAt
                });
            }
        });

    nodes
        .filter((node) => node.isLeaf && node.status === 'available' && allowInterview(node))
        .forEach((node) => {
            if (!tasks.has(node.id)) {
                tasks.set(node.id, {
                    node,
                    reason: 'new',
                    priority: 'P1'
                });
            }
        });

    return [...tasks.values()].sort((a, b) => {
        const priority = a.priority.localeCompare(b.priority);
        if (priority !== 0) {
            return priority;
        }

        return a.node.orderIndex - b.node.orderIndex;
    });
}

export function canUnlockCandidate(candidate: KnowledgeNode, siblings: KnowledgeNode[]): boolean {
    if (candidate.status !== 'locked') {
        return false;
    }

    return siblings
        .filter((node) => node.parentId === candidate.parentId && node.orderIndex < candidate.orderIndex)
        .every((node) => node.status === 'done' || node.status === 'archived');
}
