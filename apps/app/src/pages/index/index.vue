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

        <view v-for="task in store.todayTasks" :key="task.node.id" class="task-card" @click="openSheet(task.node.id)">
            <view>
                <text class="task-priority">{{ task.priority }} · {{ task.reason === 'review' ? '复习' : '新学' }}</text>
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
                <text class="sheet-title">完成本节</text>
                <text class="sheet-subtitle">{{ activeNode.title }}</text>

                <picker :range="actionLabels" @change="onActionChange">
                    <view class="picker">当前动作：{{ actionLabels[actionIndex] }}</view>
                </picker>

                <view v-if="actionType === 'objective'" class="form-row">
                    <input v-model.number="objective.totalCount" type="number" placeholder="总题数" />
                    <input v-model.number="objective.wrongCount" type="number" placeholder="错题数" />
                </view>

                <slider
                    v-if="actionType === 'recite'"
                    :value="reciteMastery"
                    :min="20"
                    :max="100"
                    :step="30"
                    show-value
                    @change="onReciteChange"
                />

                <view v-if="actionType === 'comprehensive'" class="form-row">
                    <input v-model.number="comprehensive.durationMinutes" type="number" placeholder="耗时分钟" />
                    <input v-model.number="comprehensive.scorePoints" type="number" placeholder="踩分(0-100)" />
                </view>

                <input v-model="trapMemo" class="memo-input" placeholder="选填：记下一句避坑口诀" />

                <button class="primary-button" @click="submitSettlement">标记完成</button>
                <button class="text-button" @click="closeSheet">取消</button>
            </view>
        </view>

        <view class="checkin-bar">
            <button class="checkin-button" :class="{ ready: canCheckin }" :disabled="!canCheckin" @click="openCheckin">
                {{ checkinButtonText }}
            </button>
        </view>

        <DailyCheckinModal
            v-if="showCheckinModal"
            :workspace-title="store.workspace.title"
            :streak-days="store.currentStreakDays"
            :saving="savingCheckin"
            @close="closeCheckin"
            @save="saveCheckin"
        />
    </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { ActionType, CreateDailyCheckinInput } from '@teacher-exam/types';
import DailyCheckinModal from '../../components/DailyCheckinModal.vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const actionLabels = ['客观题刷题', '主观背诵', '综合/泛读'];
const actionTypes: ActionType[] = ['objective', 'recite', 'comprehensive'];
const actionIndex = ref(0);
const activeNodeId = ref('');
const trapMemo = ref('');
const reciteMastery = ref<20 | 50 | 80 | 100>(80);
const objective = reactive({ totalCount: 10, wrongCount: 0 });
const comprehensive = reactive({ durationMinutes: 30, scorePoints: 80 });
const showCheckinModal = ref(false);
const savingCheckin = ref(false);

const actionType = computed(() => actionTypes[actionIndex.value]);
const activeNode = computed(() => store.nodes.find((node) => node.id === activeNodeId.value));
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
    activeNodeId.value = nodeId;
}

function closeSheet() {
    activeNodeId.value = '';
    trapMemo.value = '';
}

function onActionChange(event: { detail: { value: number } }) {
    actionIndex.value = Number(event.detail.value);
}

function onReciteChange(event: { detail: { value: number } }) {
    reciteMastery.value = event.detail.value as 20 | 50 | 80 | 100;
}

function submitSettlement() {
    if (!activeNode.value) {
        return;
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
    padding: 32rpx 32rpx 280rpx;
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
    padding: 36rpx;
    border-radius: 36rpx 36rpx 0 0;
    background: #fff;
}

.sheet-title,
.sheet-subtitle {
    display: block;
}

.sheet-title {
    font-size: 36rpx;
    font-weight: 800;
}

.sheet-subtitle {
    margin: 8rpx 0 24rpx;
    color: #6b7280;
}

.picker,
.memo-input,
.form-row input {
    margin-bottom: 20rpx;
    padding: 22rpx;
    border-radius: 20rpx;
    background: #f3f4f6;
}

.form-row {
    display: flex;
    gap: 16rpx;
}

.form-row input {
    flex: 1;
}

.sheet .primary-button {
    margin-top: 20rpx;
}

.sheet .text-button {
    margin-top: 12rpx;
}

.checkin-bar {
    position: fixed;
    right: 0;
    bottom: calc(50px + env(safe-area-inset-bottom));
    left: 0;
    z-index: 8;
    padding: 8px 32rpx 10px;
    background: linear-gradient(180deg, rgba(247, 250, 252, 0), #f7fafc 32%);
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
