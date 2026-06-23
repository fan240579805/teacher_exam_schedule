import type { DispatchTask, KnowledgeNode, ReviewState } from '@teacher-exam/types';
import { markDueReviews } from './ebbinghaus';

export interface DispatchInput {
    nodes: KnowledgeNode[];
    reviews: ReviewState[];
    now: Date;
}

export function generateTodayTasks({ nodes, reviews, now }: DispatchInput): DispatchTask[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const tasks = new Map<string, DispatchTask>();

    markDueReviews(reviews, now)
        .filter((review) => review.priority === 'P0')
        .forEach((review) => {
            const node = nodeMap.get(review.nodeId);
            if (node && node.status !== 'archived') {
                tasks.set(node.id, {
                    node,
                    reason: 'review',
                    priority: 'P0',
                    dueAt: review.nextReviewAt
                });
            }
        });

    nodes
        .filter((node) => node.isLeaf && node.status === 'available')
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
