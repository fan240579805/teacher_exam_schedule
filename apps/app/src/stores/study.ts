import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ActionType, CreateDailyCheckinInput, DailyCheckin, KnowledgeNode, SettlementPayload } from '@teacher-exam/types';
import { calculateQuota, canUnlockCandidate, generateTodayTasks, settleObjective, settleRecite, settleComprehensive } from '@teacher-exam/core';
import { mockDailyCheckins, mockHeatmap, mockNodes, mockReviews, mockWorkspace } from '../data/mock';
import { uploadSupabaseFile, upsertDailyCheckin } from '../services/supabase/client';

export const useStudyStore = defineStore('study', () => {
    const workspace = ref(mockWorkspace);
    const nodes = ref<KnowledgeNode[]>(restoreNodes());
    const reviews = ref(mockReviews);
    const heatmap = ref(mockHeatmap);
    const dailyCheckins = ref<DailyCheckin[]>(restoreDailyCheckins());
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

    // 模块燃尽：按 L2 大模块统计闭环进度，对应 PRD §四 Tab3 的「Burndown Charts」。
    // 数据源就是 nodes，因此首页结算后 done 数量自动联动这里，不需要额外推送。
    const moduleBurndown = computed(() => {
        const modules = nodes.value
            .filter((node) => node.level === 2)
            .sort((a, b) => a.orderIndex - b.orderIndex);

        return modules.map((module) => {
            const subtreeIds = collectDescendantIds(nodes.value, module.id);
            const leaves = nodes.value.filter((node) => subtreeIds.has(node.id) && node.isLeaf && node.status !== 'archived');
            const totalLeaves = leaves.length;
            const doneLeaves = leaves.filter((leaf) => leaf.status === 'done').length;
            const percent = totalLeaves === 0 ? 0 : Math.round((doneLeaves / totalLeaves) * 100);

            return {
                moduleId: module.id,
                title: module.title,
                totalLeaves,
                doneLeaves,
                percent
            };
        });
    });

    const todayKey = computed(() => toDateKey(new Date()));
    const todayCompletedCount = computed(() => nodes.value.filter((node) => (
        node.isLeaf
        && node.status === 'done'
        && node.completedAt?.slice(0, 10) === todayKey.value
    )).length);
    const todayTotalCount = computed(() => todayTasks.value.length + todayCompletedCount.value);
    const todayProgressText = computed(() => `${todayCompletedCount.value}/${Math.max(todayTotalCount.value, 1)}`);
    const todayCheckin = computed(() => dailyCheckins.value.find((item) => item.checkinDate === todayKey.value) ?? null);
    const currentStreakDays = computed(() => calculateStreak(dailyCheckins.value, todayKey.value));

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
        scheduleNextReview(nodeId);
        appendTodayHeat(result.durationMinutes);
        persistNodes();
    }

    async function saveDailyCheckin(input: CreateDailyCheckinInput) {
        const today = todayKey.value;
        const existing = dailyCheckins.value.find((item) => item.checkinDate === today);
        const uploadedImageUrl = input.imagePath
            ? await uploadCheckinImage(workspace.value.id, input.imagePath, today)
            : existing?.imageUrl ?? null;
        const record: DailyCheckin = {
            id: existing?.id ?? `checkin-${today}`,
            workspaceId: workspace.value.id,
            checkinDate: today,
            streakDays: calculateStreak(
                dailyCheckins.value.filter((item) => item.checkinDate !== today),
                today
            ),
            memo: input.memo.trim(),
            imageUrl: uploadedImageUrl,
            createdAt: existing?.createdAt ?? new Date().toISOString()
        };

        await upsertDailyCheckin(record);

        dailyCheckins.value = [
            ...dailyCheckins.value.filter((item) => item.checkinDate !== today),
            record
        ].sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));

        markTodayCheckin(record.imageUrl);
        persistDailyCheckins();
        return record;
    }

    function pruneLeaf(nodeId: string) {
        nodes.value = nodes.value.map((node) => (
            node.id === nodeId && node.isLeaf
                ? { ...node, status: 'archived' }
                : node
        ));
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

    function scheduleNextReview(nodeId: string) {
        const now = new Date();
        reviews.value = reviews.value.map((review) => {
            if (review.nodeId !== nodeId) {
                return review;
            }

            const nextInterval = review.intervalIndex + 1;
            return {
                ...review,
                intervalIndex: nextInterval,
                lastReviewedAt: now.toISOString(),
                nextReviewAt: nextReviewDate(now, nextInterval),
                priority: 'P1'
            };
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
            hasCheckin: false,
            imageUrl: null
        });
    }

    function markTodayCheckin(imageUrl?: string | null) {
        const today = todayKey.value;
        const found = heatmap.value.find((day) => day.date === today);
        if (found) {
            found.hasCheckin = true;
            found.imageUrl = imageUrl ?? found.imageUrl ?? null;
            return;
        }

        heatmap.value.push({
            date: today,
            minutes: 0,
            closedCount: 0,
            hasCheckin: true,
            imageUrl: imageUrl ?? null
        });
    }

    function resetMock() {
        // 用 JSON 深拷贝避免 mock 字面量被后续 settle 修改后污染下一次 reset。
        nodes.value = JSON.parse(JSON.stringify(mockNodes));
        reviews.value = JSON.parse(JSON.stringify(mockReviews));
        heatmap.value = JSON.parse(JSON.stringify(mockHeatmap));
        dailyCheckins.value = JSON.parse(JSON.stringify(mockDailyCheckins));
        persistNodes();
        persistDailyCheckins();
    }

    function persistNodes() {
        uni.setStorageSync('teacher-exam:nodes', nodes.value);
    }

    function restoreNodes() {
        const saved = uni.getStorageSync('teacher-exam:nodes') as KnowledgeNode[] | '';
        return Array.isArray(saved) && saved.length > 0 ? saved : mockNodes;
    }

    function persistDailyCheckins() {
        uni.setStorageSync('teacher-exam:daily-checkins', dailyCheckins.value);
    }

    function restoreDailyCheckins() {
        const saved = uni.getStorageSync('teacher-exam:daily-checkins') as DailyCheckin[] | '';
        return Array.isArray(saved) ? saved : mockDailyCheckins;
    }

    return {
        workspace,
        nodes,
        reviews,
        heatmap,
        dailyCheckins,
        todayTasks,
        amberAlert,
        homepageNodes,
        moduleBurndown,
        todayCompletedCount,
        todayTotalCount,
        todayProgressText,
        todayCheckin,
        currentStreakDays,
        settleTask,
        saveDailyCheckin,
        pruneLeaf,
        resetMock
    };
});

function daysUntil(date: string): number {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(Math.ceil(diff / 86400000), 1);
}

function nextReviewDate(date: Date, intervalIndex: number) {
    const dayOffsets = [1, 2, 4, 7, 15, 30];
    const offset = dayOffsets[Math.min(intervalIndex, dayOffsets.length) - 1] ?? 30;
    return new Date(date.getTime() + offset * 86400000).toISOString();
}

async function uploadCheckinImage(workspaceId: string, filePath: string, date: string) {
    const result = await uploadSupabaseFile({
        bucket: 'checkins',
        path: `${workspaceId}/${date}.jpg`,
        filePath
    }) as { path?: string };

    return result.path ?? filePath;
}

function calculateStreak(checkins: DailyCheckin[], dateKey: string) {
    const dates = new Set(checkins.map((item) => item.checkinDate));
    dates.add(dateKey);

    let streak = 0;
    let cursor = new Date(`${dateKey}T00:00:00.000Z`);
    while (dates.has(toDateKey(cursor))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 86400000);
    }

    return streak;
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

// 邻接表收集 rootId 自身 + 所有后代的 id，用于按 L2 模块汇总叶子。
function collectDescendantIds(nodes: KnowledgeNode[], rootId: string): Set<string> {
    const result = new Set<string>([rootId]);
    let added = true;
    while (added) {
        added = false;
        for (const node of nodes) {
            if (node.parentId && result.has(node.parentId) && !result.has(node.id)) {
                result.add(node.id);
                added = true;
            }
        }
    }
    return result;
}
