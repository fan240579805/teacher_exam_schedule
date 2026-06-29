<template>
    <view class="page">
        <view class="hero">
            <view>
                <text class="eyebrow">{{ store.workspace.region }} · {{ store.workspace.subject }}</text>
                <text class="title">{{ store.workspace.title }}</text>
            </view>
            <button class="ghost-button" @click="store.resetMock">
                <text class="ghost-icon">↻</text>
                <text class="ghost-text">重置计划</text>
            </button>
        </view>

        <view class="week-strip">
            <view v-for="day in weekDays" :key="day.label" class="week-day" :class="{ active: day.active }">
                <text class="week-label">{{ day.label }}</text>
                <text class="week-date">{{ day.dateNum }}</text>
                <view class="week-dot" :class="{ checked: day.checked }" />
            </view>
        </view>

        <view v-if="store.amberAlert.level !== 'none'" class="alert">
            <text class="alert-title">进度提醒 · {{ levelLabel(store.amberAlert.level) }}</text>
            <text class="alert-text">{{ store.amberAlert.message }}</text>
            <text class="alert-meta">预计今日 {{ store.amberAlert.estimatedMinutes }} 分钟 · 负荷指数 {{ store.amberAlert.quota.toFixed(1) }}</text>
        </view>

        <view class="section-head">
            <text>今日任务</text>
            <text>{{ store.todayTasks.length }} 项</text>
        </view>

        <view v-for="task in store.todayTasks" :key="task.node.id" class="task-card" :class="{ 'is-drill': task.node.track === 'interview' }" @click="openSheet(task.node.id)">
            <view>
                <text class="task-priority">
                    <text v-if="task.node.track === 'interview'" class="drill-tag">🎙️ 面试演练</text>
                    {{ task.priority }} · {{ task.reason === 'review' ? '复习' : '新学' }}
                </text>
                <text class="task-title">{{ task.node.title }}</text>
                <text v-if="task.node.trapMemo" class="memo">小提醒：{{ task.node.trapMemo }}</text>
            </view>
            <text class="duration">{{ task.node.estimatedMinutes ?? 30 }}min</text>
        </view>

        <view v-if="store.todayTasks.length === 0" class="empty">
            <text>今日任务已全部完成，去底部按钮记一笔随笔吧。</text>
        </view>

        <view v-if="activeNode" class="sheet-mask" @click="closeSheet">
            <view class="sheet" @click.stop>
                <view class="sheet-head">
                    <view class="sheet-title-row">
                        <text class="sheet-icon">🎯</text>
                        <text class="sheet-title">完成本节</text>
                    </view>
                    <text class="sheet-subtitle">{{ activeNode.title }}</text>
                </view>

                <view class="segment">
                    <view
                        v-for="(label, index) in actionLabels"
                        :key="label"
                        class="segment-item"
                        :class="{ active: actionIndex === index }"
                        @click="setAction(index)"
                    >{{ label }}</view>
                </view>

                <view class="block">
                    <text class="block-label">{{ blockLabel }}</text>

                    <view v-if="actionType === 'objective'" class="metric-card">
                        <view class="metric-box">
                            <text class="metric-name">总刷题数</text>
                            <input
                                v-model.number="objective.totalCount"
                                class="metric-input"
                                type="number"
                                @blur="normalizeObjective"
                            />
                            <text class="metric-hint">本次共做多少题</text>
                        </view>
                        <view class="metric-box">
                            <text class="metric-name">错题数</text>
                            <input
                                v-model.number="objective.wrongCount"
                                class="metric-input danger"
                                type="number"
                                @blur="normalizeObjective"
                            />
                            <text class="metric-hint">其中做错多少题</text>
                        </view>
                        <view class="accuracy">
                            <view class="ring" :style="accuracyRingStyle">
                                <view class="ring-hole">
                                    <text class="ring-value">{{ objectiveAccuracy }}%</text>
                                </view>
                            </view>
                            <text class="accuracy-label">正确率</text>
                        </view>
                    </view>

                    <view v-else-if="actionType === 'recite'" class="anchor-group">
                        <view
                            v-for="opt in reciteOptions"
                            :key="opt.value"
                            class="anchor"
                            :class="{ active: reciteMastery === opt.value }"
                            @click="reciteMastery = opt.value"
                        >
                            <text class="anchor-value">{{ opt.value }}%</text>
                            <text class="anchor-label">{{ opt.label }}</text>
                        </view>
                    </view>

                    <view v-else class="metric-card">
                        <view class="metric-box">
                            <text class="metric-name">耗时(分钟)</text>
                            <input
                                v-model.number="comprehensive.durationMinutes"
                                class="metric-input"
                                type="number"
                            />
                            <text class="metric-hint">本次有效投入</text>
                        </view>
                        <view class="metric-box">
                            <text class="metric-name">踩分(0-100)</text>
                            <input
                                v-model.number="comprehensive.scorePoints"
                                class="metric-input"
                                type="number"
                            />
                            <text class="metric-hint">核心得分点占比</text>
                        </view>
                    </view>
                </view>

                <view class="block">
                    <text class="block-label">避坑随笔</text>
                    <textarea
                        v-model="trapMemo"
                        class="memo-area"
                        :maxlength="200"
                        placeholder="记下核心避坑口诀或感悟..."
                    />
                    <view class="tag-row">
                        <text
                            v-for="tag in quickTags"
                            :key="tag"
                            class="tag"
                            @click="appendTag(tag)"
                        >#{{ tag }}</text>
                    </view>
                </view>

                <view class="insight">
                    <text class="insight-icon">✨</text>
                    <text class="insight-text">智能提示：{{ aiInsight }}</text>
                </view>

                <button class="primary-button" @click="submitSettlement">标记完成并闭环</button>
                <button class="text-button" @click="closeSheet">取消</button>
            </view>
        </view>

        <view class="checkin-bar">
            <button class="checkin-button" :class="{ ready: canCheckin }" :disabled="!canCheckin" @click="openCheckin">
                {{ checkinButtonText }}
            </button>
        </view>

        <DrillActionSheet
            v-if="drillNode"
            :node="drillNode"
            @close="closeDrill"
        />

        <DailyCheckinModal
            v-if="showCheckinModal"
            :workspace-title="store.workspace.title"
            :streak-days="store.currentStreakDays"
            :saving="savingCheckin"
            :ai-comment="store.latestDrillComment"
            @close="closeCheckin"
            @save="saveCheckin"
        />
    </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { ActionType, CreateDailyCheckinInput } from '@teacher-exam/types';
import DailyCheckinModal from '../../components/DailyCheckinModal.vue';
import DrillActionSheet from '../../components/DrillActionSheet.vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const actionLabels = ['刷题', '背诵', '学习输入'];
const actionTypes: ActionType[] = ['objective', 'recite', 'comprehensive'];
const reciteOptions: { value: 20 | 50 | 80 | 100; label: string }[] = [
    { value: 20, label: '漏点' },
    { value: 50, label: '词不达意' },
    { value: 80, label: '踩准' },
    { value: 100, label: '肌肉记忆' }
];
const tagPresets: Record<ActionType, string[]> = {
    objective: ['概念混淆', '主体搞错', '时间限定错误'],
    recite: ['关键词遗漏', '顺序混乱', '理解偏差'],
    comprehensive: ['踩点不全', '时间超限', '思路卡顿']
};
const actionIndex = ref(0);
const activeNodeId = ref('');
const trapMemo = ref('');
const reciteMastery = ref<20 | 50 | 80 | 100>(80);
const objective = reactive({ totalCount: 10, wrongCount: 2 });
const comprehensive = reactive({ durationMinutes: 30, scorePoints: 80 });
const showCheckinModal = ref(false);
const savingCheckin = ref(false);

const drillNodeId = ref('');
const actionType = computed(() => actionTypes[actionIndex.value]);
const activeNode = computed(() => store.nodes.find((node) => node.id === activeNodeId.value));
const drillNode = computed(() => store.nodes.find((node) => node.id === drillNodeId.value) ?? null);
const quickTags = computed(() => tagPresets[actionType.value]);
const blockLabel = computed(() => {
    if (actionType.value === 'objective') {
        return '客观题量化';
    }

    if (actionType.value === 'recite') {
        return '背诵掌握度';
    }

    return '学习输入量化';
});

const objectiveAccuracy = computed(() => {
    const total = Number(objective.totalCount) || 0;
    if (total <= 0) {
        return 0;
    }

    const wrong = Math.min(Math.max(Number(objective.wrongCount) || 0, 0), total);
    return Math.round(((total - wrong) / total) * 100);
});

const accuracyColor = computed(() => {
    if (objectiveAccuracy.value >= 80) {
        return '#0f766e';
    }

    if (objectiveAccuracy.value >= 60) {
        return '#b45309';
    }

    return '#b91c1c';
});

const accuracyRingStyle = computed(() => ({
    background: `conic-gradient(${accuracyColor.value} ${objectiveAccuracy.value * 3.6}deg, #e5e7eb 0deg)`
}));

const aiInsight = computed(() => {
    const name = activeNode.value?.title ?? '该知识点';

    if (actionType.value === 'objective') {
        const acc = objectiveAccuracy.value;
        if (acc >= 90) {
            return `正确率 ${acc}%，掌握扎实，可拉长复习间隔。`;
        }

        if (acc >= 60) {
            return `正确率 ${acc}%，错题需二次订正后再闭环。`;
        }

        return `错误率较高，建议重点复盘【${name}】。`;
    }

    if (actionType.value === 'recite') {
        if (reciteMastery.value >= 100) {
            return '已达肌肉记忆，进入长周期复习即可。';
        }

        if (reciteMastery.value >= 80) {
            return '核心要点踩准，明日安排一次快速回忆。';
        }

        if (reciteMastery.value >= 50) {
            return '仍有词不达意，建议结合关键词重背。';
        }

        return `漏点较多，建议重学【${name}】后再背诵。`;
    }

    const score = Number(comprehensive.scorePoints) || 0;
    if (score >= 80) {
        return '踩分较全，综合应用已成型。';
    }

    if (score >= 60) {
        return '踩分中等，注意补齐遗漏要点。';
    }

    return `踩分偏低，建议重做【${name}】的综合题。`;
});

const canCheckin = computed(() => store.todayTasks.length === 0 && store.todayTotalCount > 0);
const checkinButtonText = computed(() => {
    if (store.todayCheckin) {
        return `今日已打卡 · 连续 ${store.todayCheckin.streakDays} 天`;
    }

    if (canCheckin.value) {
        return '今日任务已完成 · 去写随笔';
    }

    return `今日任务进行中 (${store.todayProgressText})`;
});
const weekDays = computed(() => {
    // 以「今天」为参考点，向前推到周一，生成一整周的日期。
    // 表现与设计图一致：周几上方是中文、下方是日期数、底部是状态点；active 今日填充为主题色圆。
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today.getTime() - (dayOfWeek - 1) * 86400000);
    const checkinSet = new Set(store.dailyCheckins.map((item) => item.checkinDate));

    return labels.map((label, index) => {
        const date = new Date(monday.getTime() + index * 86400000);
        const dateKey = date.toISOString().slice(0, 10);
        return {
            label,
            dateNum: date.getDate(),
            active: index === dayOfWeek - 1,
            checked: checkinSet.has(dateKey)
        };
    });
});

function levelLabel(level: 'none' | 'watch' | 'amber' | 'red') {
    const map = { none: '', watch: '轻微偏移', amber: '需要调整', red: '偏移严重' } as const;
    return map[level];
}

function openSheet(nodeId: string) {
    const node = store.nodes.find((item) => item.id === nodeId);
    // 面试演练任务唤起 AI 音频结算台；笔试任务走刷题/背诵/学习输入结算台。
    if (node?.track === 'interview') {
        drillNodeId.value = nodeId;
        return;
    }
    activeNodeId.value = nodeId;
}

function closeDrill() {
    drillNodeId.value = '';
}

function closeSheet() {
    activeNodeId.value = '';
    trapMemo.value = '';
}

function setAction(index: number) {
    actionIndex.value = index;
}

function normalizeObjective() {
    const total = Math.max(Math.floor(Number(objective.totalCount) || 0), 0);
    const wrong = Math.min(Math.max(Math.floor(Number(objective.wrongCount) || 0), 0), total);
    objective.totalCount = total;
    objective.wrongCount = wrong;
}

function appendTag(tag: string) {
    if (trapMemo.value.includes(`#${tag}`)) {
        return;
    }

    const prefix = trapMemo.value.trim();
    trapMemo.value = prefix ? `${prefix} #${tag} ` : `#${tag} `;
}

function submitSettlement() {
    if (!activeNode.value) {
        return;
    }

    if (actionType.value === 'objective') {
        normalizeObjective();
        if (objective.totalCount <= 0) {
            uni.showToast({ title: '请先填写总刷题数', icon: 'none' });
            return;
        }
    }

    const payload = actionType.value === 'objective'
        ? { ...objective }
        : actionType.value === 'recite'
            ? { mastery: reciteMastery.value }
            : { ...comprehensive };

    store.settleTask(activeNode.value.id, actionType.value, payload, trapMemo.value);
    uni.showToast({ title: '已完成', icon: 'success' });
    closeSheet();
}

function openCheckin() {
    if (!canCheckin.value) {
        return;
    }

    showCheckinModal.value = true;
}

function closeCheckin() {
    if (!savingCheckin.value) {
        showCheckinModal.value = false;
    }
}

async function saveCheckin(input: CreateDailyCheckinInput) {
    savingCheckin.value = true;
    try {
        await store.saveDailyCheckin(input);
        uni.showToast({ title: '打卡已保存', icon: 'success' });
        showCheckinModal.value = false;
    } finally {
        savingCheckin.value = false;
    }
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    /* 底部预留 200rpx，刚好让最后一张任务卡片可以滚出固定按钮区域。 */
    padding: 32rpx 32rpx 200rpx;
}

.hero,
.section-head,
.task-card,
.week-strip,
.alert {
    display: flex;
}

.hero,
.section-head,
.task-card {
    align-items: center;
    justify-content: space-between;
}

.hero {
    gap: 16rpx;
    align-items: flex-start;
}

.hero > view:first-child {
    flex: 1;
    min-width: 0;
}

.title {
    display: block;
    margin-top: 8rpx;
    color: #1f2933;
    font-size: 40rpx;
    font-weight: 800;
    line-height: 1.25;
    word-break: break-all;
}

.eyebrow,
.task-priority,
.memo,
.alert-meta {
    display: block;
    color: #6b7280;
    font-size: 24rpx;
}

/* 原 .title 已在 .hero block 里重新定义，这里占位避免重复 */

.ghost-button,
.primary-button {
    border-radius: 999rpx;
    font-size: 28rpx;
}

.primary-button {
    width: 100%;
    height: 88rpx;
    background: #0f766e !important;
    color: #fff !important;
    line-height: 88rpx;
    font-weight: 700;
}

.primary-button::after {
    display: none;
    border: none;
}

.ghost-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    width: 188rpx;
    height: 64rpx;
    margin: 8rpx 0 0;
    padding: 0 16rpx;
    border: none !important;
    background: transparent !important;
    color: #6b7280 !important;
    line-height: 60rpx;
    font-size: 26rpx;
    font-weight: 500;
}

.ghost-button::after {
    display: none;
    border: none;
}

.ghost-icon {
    color: #6b7280;
    font-size: 30rpx;
    font-weight: 600;
}

.ghost-text {
    color: #6b7280;
    font-size: 26rpx;
}

.text-button {
    width: 100%;
    height: 72rpx;
    background: transparent !important;
    color: #6b7280 !important;
    font-size: 26rpx;
    line-height: 72rpx;
}

.text-button::after {
    display: none;
    border: none;
}

.week-strip {
    gap: 8rpx;
    margin: 32rpx 0;
    padding: 0;
    background: transparent;
}

.week-day {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 12rpx 0;
    border-radius: 999rpx;
    background: transparent;
    text-align: center;
}

.week-day.active {
    background: #0f766e;
}

.week-label {
    color: #1f2933;
    font-size: 28rpx;
    font-weight: 600;
}

.week-date {
    color: #1f2933;
    font-size: 30rpx;
    font-weight: 700;
}

.week-day.active .week-label,
.week-day.active .week-date {
    color: #fff;
}

.week-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: transparent;
}

.week-dot.checked {
    background: #22c55e;
}

.week-day.active .week-dot.checked {
    background: #fff;
}

.alert {
    flex-direction: column;
    gap: 8rpx;
    padding: 24rpx;
    border-radius: 28rpx;
    background: #fff7ed;
    color: #9a3412;
}

.alert-title,
.section-head {
    font-weight: 700;
}

.section-head {
    margin: 32rpx 0 20rpx;
}

.task-card {
    margin-bottom: 20rpx;
    padding: 28rpx;
    border-radius: 32rpx;
    background: #fff;
    box-shadow: 0 12rpx 40rpx rgba(31, 41, 51, 0.06);
}

.task-title {
    display: block;
    margin: 10rpx 0;
    font-size: 34rpx;
    font-weight: 700;
}

.duration {
    color: #0f766e;
    font-weight: 700;
}

.drill-tag {
    margin-right: 10rpx;
    padding: 2rpx 14rpx;
    border-radius: 999rpx;
    background: #ecfdf5;
    color: #0f766e;
    font-size: 20rpx;
    font-weight: 700;
}

.task-card.is-drill {
    box-shadow: 0 12rpx 40rpx rgba(15, 118, 110, 0.12);
}

.empty {
    padding: 48rpx;
    border-radius: 32rpx;
    background: #fff;
    text-align: center;
}

.sheet-mask {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.35);
}

.sheet {
    width: 100%;
    max-height: 86vh;
    padding: 40rpx 36rpx 48rpx;
    border-radius: 36rpx 36rpx 0 0;
    background: #fff;
    overflow-y: auto;
}

.sheet-head {
    margin-bottom: 28rpx;
}

.sheet-title-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.sheet-icon {
    font-size: 36rpx;
}

.sheet-title {
    font-size: 38rpx;
    font-weight: 800;
}

.sheet-subtitle {
    display: block;
    margin-top: 8rpx;
    color: #6b7280;
    font-size: 26rpx;
}

.segment {
    display: flex;
    padding: 6rpx;
    border-radius: 999rpx;
    background: #f3f4f6;
}

.segment-item {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 999rpx;
    color: #6b7280;
    font-size: 28rpx;
    text-align: center;
    transition: all 0.2s ease;
}

.segment-item.active {
    background: #fff;
    color: #0f766e;
    font-weight: 700;
    box-shadow: 0 6rpx 18rpx rgba(15, 118, 110, 0.12);
}

.block {
    margin-top: 32rpx;
}

.block-label {
    display: block;
    margin-bottom: 16rpx;
    color: #1f2933;
    font-size: 26rpx;
    font-weight: 700;
}

.metric-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    border-radius: 28rpx;
    background: #f8fafc;
}

.metric-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx 12rpx;
    border-radius: 22rpx;
    background: #fff;
    box-shadow: inset 0 0 0 2rpx #e5e7eb;
}

.metric-name {
    color: #6b7280;
    font-size: 24rpx;
}

.metric-input {
    width: 100%;
    margin: 10rpx 0 6rpx;
    color: #0f766e;
    font-size: 52rpx;
    font-weight: 800;
    text-align: center;
}

.metric-input.danger {
    color: #b91c1c;
}

.metric-hint {
    color: #9ca3af;
    font-size: 20rpx;
}

.accuracy {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 168rpx;
}

.ring {
    width: 132rpx;
    height: 132rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ring-hole {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ring-value {
    font-size: 30rpx;
    font-weight: 800;
    color: #1f2933;
}

.accuracy-label {
    margin-top: 12rpx;
    color: #6b7280;
    font-size: 24rpx;
}

.anchor-group {
    display: flex;
    gap: 16rpx;
}

.anchor {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx 8rpx;
    border-radius: 22rpx;
    background: #f8fafc;
    box-shadow: inset 0 0 0 2rpx #e5e7eb;
}

.anchor.active {
    background: #ecfdf5;
    box-shadow: inset 0 0 0 4rpx #0f766e;
}

.anchor-value {
    font-size: 32rpx;
    font-weight: 800;
    color: #1f2933;
}

.anchor.active .anchor-value {
    color: #0f766e;
}

.anchor-label {
    margin-top: 6rpx;
    color: #6b7280;
    font-size: 20rpx;
}

.memo-area {
    width: 100%;
    height: 150rpx;
    box-sizing: border-box;
    padding: 22rpx;
    border-radius: 22rpx;
    background: #f3f4f6;
    font-size: 28rpx;
}

.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 18rpx;
}

.tag {
    padding: 10rpx 22rpx;
    border-radius: 999rpx;
    background: #ecfdf5;
    color: #0f766e;
    font-size: 24rpx;
}

.insight {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 32rpx;
    padding: 24rpx;
    border-radius: 22rpx;
    background: #f0fdfa;
}

.insight-icon {
    font-size: 28rpx;
}

.insight-text {
    flex: 1;
    color: #0f766e;
    font-size: 24rpx;
    line-height: 1.5;
}

.sheet .primary-button {
    margin-top: 32rpx;
}

.sheet .text-button {
    margin-top: 12rpx;
}

.checkin-bar {
    position: fixed;
    right: 0;
    /* 紧贴 tabBar 顶部，去掉原 50px 间距，让按钮真正"置于底部"。 */
    bottom: env(safe-area-inset-bottom);
    left: 0;
    z-index: 8;
    padding: 12rpx 32rpx 16rpx;
    background: linear-gradient(180deg, rgba(247, 250, 252, 0), #f7fafc 28%);
}

.checkin-button {
    width: 100%;
    min-height: 52px;
    padding: 0;
    border: none;
    border-radius: 999rpx;
    background: #d1d5db !important;
    color: #4b5563 !important;
    font-size: 16px;
    font-weight: 700;
    line-height: 52px;
}

.checkin-button.ready {
    background: #0f766e !important;
    color: #fff !important;
}

.checkin-button[disabled] {
    opacity: 1;
}

.checkin-button::after {
    display: none;
    border: none;
}
</style>
