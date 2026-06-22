import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ActionType, KnowledgeNode, SettlementPayload } from '@teacher-exam/types';
import { calculateQuota, canUnlockCandidate, generateTodayTasks, settleObjective, settleRecite, settleComprehensive } from '@teacher-exam/core';
import { mockHeatmap, mockNodes, mockReviews, mockWorkspace } from '../data/mock';

export const useStudyStore = defineStore('study', () => {
    const workspace = ref(mockWorkspace);
    const nodes = ref<KnowledgeNode[]>(restoreNodes());
    const reviews = ref(mockReviews);
    const heatmap = ref(mockHeatmap);
    const targetMinutesPerDay = ref(180);

    const todayTasks = computed(() => generateTodayTasks({
        nodes: nodes.value,
        reviews: reviews.value,
        now: new Date()
    }));

    const amberAlert = computed(() => calculateQuota({
        nodes: nodes.value,
        remainingDays: daysUntil(workspace.value.examDate),
        targetMinutesPerDay: targetMinutesPerDay.value
    }));

    const homepageNodes = computed(() => nodes.value.filter((node) => node.level <= 3));

    function settleTask(nodeId: string, actionType: ActionType, payload: SettlementPayload, trapMemo = '') {
        const result = actionType === 'objective'
            ? settleObjective(payload as { totalCount: number; wrongCount: number })
            : actionType === 'recite'
                ? settleRecite(payload as { mastery: 20 | 50 | 80 | 100 })
                : settleComprehensive(payload as { durationMinutes: number; scorePoints?: number; note?: string });

        nodes.value = nodes.value.map((node) => {
            if (node.id !== nodeId) {
                return node;
            }

            return {
                ...node,
                status: 'done',
                trapMemo: trapMemo || node.trapMemo,
                completedAt: new Date().toISOString()
            } as KnowledgeNode;
        });

        unlockNextSiblings();
        appendTodayHeat(result.durationMinutes);
        persistNodes();
    }

    function unlockNextSiblings() {
        nodes.value = nodes.value.map((candidate) => {
            if (canUnlockCandidate(candidate, nodes.value)) {
                return { ...candidate, status: 'available' };
            }

            return candidate;
        });
    }

    function appendTodayHeat(minutes: number) {
        const today = new Date().toISOString().slice(0, 10);
        const found = heatmap.value.find((day) => day.date === today);
        if (found) {
            found.minutes += minutes;
            found.closedCount += 1;
            return;
        }

        heatmap.value.push({
            date: today,
            minutes,
            closedCount: 1,
            hasArtifact: false
        });
    }

    function resetMock() {
        nodes.value = mockNodes;
        reviews.value = mockReviews;
        heatmap.value = mockHeatmap;
        persistNodes();
    }

    function persistNodes() {
        uni.setStorageSync('teacher-exam:nodes', nodes.value);
    }

    function restoreNodes() {
        const saved = uni.getStorageSync('teacher-exam:nodes') as KnowledgeNode[] | '';
        return Array.isArray(saved) && saved.length > 0 ? saved : mockNodes;
    }

    return {
        workspace,
        nodes,
        reviews,
        heatmap,
        todayTasks,
        amberAlert,
        homepageNodes,
        settleTask,
        resetMock
    };
});

function daysUntil(date: string): number {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(Math.ceil(diff / 86400000), 1);
}
