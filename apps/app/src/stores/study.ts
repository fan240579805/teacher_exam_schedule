import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ActionType, CreateDailyCheckinInput, DailyCheckin, KnowledgeNode, SettlementPayload, StudyLog } from '@teacher-exam/types';
import { calculateQuota, canUnlockCandidate, generateTodayTasks, settleObjective, settleRecite, settleComprehensive } from '@teacher-exam/core';
import { mockActionLogs, mockDailyCheckins, mockHeatmap, mockNodes, mockReviews, mockWorkspace } from '../data/mock';
import { uploadSupabaseFile, upsertDailyCheckin } from '../services/supabase/client';

export const useStudyStore = defineStore('study', () => {
    const workspace = ref(mockWorkspace);
    const nodes = ref<KnowledgeNode[]>(restoreNodes());
    const reviews = ref(mockReviews);
    const heatmap = ref(mockHeatmap);
    const dailyCheckins = ref<DailyCheckin[]>(restoreDailyCheckins());
    const actionLogs = ref<StudyLog[]>(JSON.parse(JSON.stringify(mockActionLogs)));
    const targetMinutesPerDay = ref(180);
    const dailyTaskCapHours = ref(6);
    const cloudSyncStatus = ref<'synced' | 'pending'>('synced');

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

    // ========== Tab 3 「统计」页面用的详细指标 ==========
    // 完美达标天数：热力日记中闭环任务数 >= 3 且到底记录了打卡 的天数。
    // （后期接入 supabase 后可调为需要每日预算代表「达标」。）
    const perfectDays = computed(() => heatmap.value.filter((day) => day.closedCount >= 3 && day.hasCheckin).length);

    // 日均学习时长（小时）：遵从 PRD 「网课/泛读表单录入的时长」，不计未开始备考的空白日。
    // 以 heatmap.minutes > 0 的有效学习日作为分母。
    const avgStudyHours = computed(() => {
        const activeDays = heatmap.value.filter((day) => day.minutes > 0);
        if (activeDays.length === 0) {
            return 0;
        }
        const totalMinutes = activeDays.reduce((acc, day) => acc + day.minutes, 0);
        return Math.round((totalMinutes / activeDays.length / 60) * 10) / 10;
    });

    // 已掌握考点：状态为 done 的叶子节点总数。
    const masteredCount = computed(() => nodes.value.filter((node) => node.isLeaf && node.status === 'done').length);
    const totalLeafCount = computed(() => nodes.value.filter((node) => node.isLeaf && node.status !== 'archived').length);

    // 刷题正确率：所有 objective 动作的 (total - wrong) / total 加权平均。
    const objectiveAccuracy = computed(() => {
        const objectiveLogs = actionLogs.value.filter((log) => log.actionType === 'objective');
        if (objectiveLogs.length === 0) {
            return 0;
        }
        let total = 0;
        let right = 0;
        for (const log of objectiveLogs) {
            const payload = log.payload as { totalCount: number; wrongCount: number };
            total += payload.totalCount;
            right += payload.totalCount - payload.wrongCount;
        }
        return total === 0 ? 0 : Math.round((right / total) * 100);
    });

    // “备考能力雷达」5 维数据。当前由 mastered/objective 等现有资源推导，
    // 后期 interview_runs 接入后可从该表读取。
    const interviewRadar = computed(() => {
        // 以完成度为基础 + 个各维度经验係数，营造差异感。
        const baseline = totalLeafCount.value === 0 ? 0 : Math.round((masteredCount.value / totalLeafCount.value) * 100);
        return [
            { label: '时间把控', score: Math.min(60 + Math.round(baseline * 0.4), 95) },
            { label: '语言流畅', score: Math.min(50 + Math.round(baseline * 0.5), 92) },
            { label: '板书完整', score: Math.min(55 + Math.round(baseline * 0.45), 90) },
            { label: '教态', score: Math.min(65 + Math.round(baseline * 0.35), 95) },
            { label: '逻辑框架', score: Math.min(60 + Math.round(baseline * 0.4), 93) }
        ];
    });

    // 倒计时天数（Tab 4 「我的」页使用）。
    const daysUntilExam = computed(() => daysUntil(workspace.value.examDate));

    // “暂不复习考点」：被派送到回收站的 archived 叶子。
    const archivedLeaves = computed(() => nodes.value.filter((node) => node.isLeaf && node.status === 'archived'));

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

        // 同步记录到 actionLogs，让「刷题正确率/学习时长」等联动指标随着业务动作增长。
        actionLogs.value = [
            ...actionLogs.value,
            {
                id: `log-${nodeId}-${Date.now()}`,
                workspaceId: workspace.value.id,
                nodeId,
                actionType,
                payload,
                durationMinutes: result.durationMinutes,
                score: result.score,
                mastery: result.mastery,
                trapMemo: trapMemo || null,
                createdAt: new Date().toISOString()
            }
        ];

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
        actionLogs.value = JSON.parse(JSON.stringify(mockActionLogs));
        persistNodes();
        persistDailyCheckins();
    }

    // Tab 4 「我的」页面使用的动作：一键恢复被丢进回收站的考点，重新加入调度。
    function restoreArchived(nodeId?: string) {
        nodes.value = nodes.value.map((node) => {
            if (!node.isLeaf || node.status !== 'archived') {
                return node;
            }
            if (nodeId && node.id !== nodeId) {
                return node;
            }
            return { ...node, status: 'locked' } as KnowledgeNode;
        });
        unlockNextSiblings();
        persistNodes();
    }

    // 清除本地缓存，重新拉取 mock。在 Tab 4 「本地日志清理」使用。
    function clearLocalCache() {
        try {
            uni.removeStorageSync('teacher-exam:nodes');
            uni.removeStorageSync('teacher-exam:daily-checkins');
        } catch (e) {
            // 忎略 storage 调用异常
        }
        resetMock();
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
        actionLogs,
        targetMinutesPerDay,
        dailyTaskCapHours,
        cloudSyncStatus,
        todayTasks,
        amberAlert,
        homepageNodes,
        moduleBurndown,
        todayCompletedCount,
        todayTotalCount,
        todayProgressText,
        todayCheckin,
        currentStreakDays,
        perfectDays,
        avgStudyHours,
        masteredCount,
        totalLeafCount,
        objectiveAccuracy,
        interviewRadar,
        daysUntilExam,
        archivedLeaves,
        settleTask,
        saveDailyCheckin,
        pruneLeaf,
        resetMock,
        restoreArchived,
        clearLocalCache
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
