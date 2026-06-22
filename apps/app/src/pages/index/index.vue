<template>
    <view class="page">
        <view class="hero">
            <view>
                <text class="eyebrow">{{ store.workspace.region }} · {{ store.workspace.subject }}</text>
                <text class="title">{{ store.workspace.title }}</text>
            </view>
            <button class="ghost-button" @click="store.resetMock">重置</button>
        </view>

        <view class="week-strip">
            <view v-for="day in weekDays" :key="day.label" class="week-day" :class="{ active: day.active }">
                <text>{{ day.label }}</text>
                <view class="dot" />
            </view>
        </view>

        <view v-if="store.amberAlert.level !== 'none'" class="alert">
            <text class="alert-title">航向修正预警 · {{ store.amberAlert.level.toUpperCase() }}</text>
            <text class="alert-text">{{ store.amberAlert.message }}</text>
            <text class="alert-meta">预计今日 {{ store.amberAlert.estimatedMinutes }} 分钟，Quota {{ store.amberAlert.quota.toFixed(1) }}</text>
        </view>

        <view class="section-head">
            <text>今日任务</text>
            <text>{{ store.todayTasks.length }} 项</text>
        </view>

        <view v-for="task in store.todayTasks" :key="task.node.id" class="task-card" @click="openSheet(task.node.id)">
            <view>
                <text class="task-priority">{{ task.priority }} · {{ task.reason === 'review' ? '复测' : '新学' }}</text>
                <text class="task-title">{{ task.node.title }}</text>
                <text v-if="task.node.trapMemo" class="memo">避坑：{{ task.node.trapMemo }}</text>
            </view>
            <text class="duration">{{ task.node.estimatedMinutes ?? 30 }}min</text>
        </view>

        <view v-if="store.todayTasks.length === 0" class="empty">
            <text>今日任务已闭环，可以上传战果照片。</text>
        </view>

        <view v-if="activeNode" class="sheet-mask" @click="closeSheet">
            <view class="sheet" @click.stop>
                <text class="sheet-title">动作结算台</text>
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

                <input v-model="trapMemo" class="memo-input" placeholder="非必填：记录避坑口诀" />

                <button class="primary-button" @click="submitSettlement">闭环此节点</button>
                <button class="text-button" @click="closeSheet">取消</button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { ActionType } from '@teacher-exam/types';
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

const actionType = computed(() => actionTypes[actionIndex.value]);
const activeNode = computed(() => store.nodes.find((node) => node.id === activeNodeId.value));
const weekDays = ['一', '二', '三', '四', '五', '六', '日'].map((label, index) => ({
    label,
    active: index < 4
}));

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
    uni.showToast({ title: '已闭环', icon: 'success' });
    closeSheet();
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 32rpx;
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

.eyebrow,
.task-priority,
.memo,
.alert-meta {
    display: block;
    color: #6b7280;
    font-size: 24rpx;
}

.title {
    display: block;
    margin-top: 8rpx;
    font-size: 42rpx;
    font-weight: 800;
}

.ghost-button,
.primary-button {
    border-radius: 999rpx;
    background: #0f766e;
    color: #fff;
    font-size: 26rpx;
}

.week-strip {
    gap: 16rpx;
    margin: 32rpx 0;
}

.week-day {
    flex: 1;
    padding: 20rpx 0;
    border-radius: 28rpx;
    background: #fff;
    text-align: center;
}

.week-day.active .dot {
    background: #22c55e;
}

.dot {
    width: 12rpx;
    height: 12rpx;
    margin: 10rpx auto 0;
    border-radius: 50%;
    background: #d1d5db;
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

.primary-button {
    margin-top: 20rpx;
}

.text-button {
    margin-top: 12rpx;
    background: transparent;
    color: #6b7280;
}
</style>
