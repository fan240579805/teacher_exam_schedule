<template>
    <view class="page">
        <view class="summary">
            <text class="eyebrow">Dashboard & Asset Vault</text>
            <text class="title">进度、热力与偏科风险</text>
            <text class="desc">闭环后可引导上传战果照片；当前 mock 模式仅展示胶片标识。</text>
        </view>

        <view class="card">
            <text class="card-title">全局热力月历</text>
            <view class="heat-grid">
                <view v-for="day in store.heatmap" :key="day.date" class="heat-cell" :class="levelClass(day.minutes)">
                    <text>{{ day.date.slice(8) }}</text>
                    <text v-if="day.hasArtifact" class="film">▣</text>
                </view>
            </view>
        </view>

        <view class="card">
            <text class="card-title">分模块燃尽</text>
            <view class="burn-row">
                <text>教育综合知识</text>
                <text>{{ doneLeaves }}/{{ totalLeaves }}</text>
            </view>
            <view class="progress">
                <view class="bar" :style="{ width: `${progress}%` }" />
            </view>
        </view>

        <view class="card">
            <text class="card-title">面试规范 V1</text>
            <view v-for="item in checklist" :key="item" class="check-row">
                <text class="check">✓</text>
                <text>{{ item }}</text>
            </view>
            <text class="desc">正式闭环时必须检查单全绿。</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const totalLeaves = computed(() => store.nodes.filter((node) => node.isLeaf).length);
const doneLeaves = computed(() => store.nodes.filter((node) => node.isLeaf && node.status === 'done').length);
const progress = computed(() => totalLeaves.value === 0 ? 0 : Math.round((doneLeaves.value / totalLeaves.value) * 100));
const checklist = ['耗时控制达标', '无明显卡壳', '板书完整', '环节过渡自然'];

function levelClass(minutes: number) {
    if (minutes >= 180) {
        return 'hot-3';
    }

    if (minutes >= 90) {
        return 'hot-2';
    }

    if (minutes > 0) {
        return 'hot-1';
    }

    return 'hot-0';
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 32rpx;
}

.summary,
.card {
    margin-bottom: 24rpx;
    padding: 32rpx;
    border-radius: 32rpx;
    background: #fff;
}

.eyebrow {
    color: #0f766e;
    font-size: 24rpx;
    font-weight: 700;
}

.title,
.card-title {
    display: block;
    margin-top: 12rpx;
    font-size: 34rpx;
    font-weight: 800;
}

.desc {
    display: block;
    margin-top: 12rpx;
    color: #6b7280;
    font-size: 24rpx;
}

.heat-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12rpx;
    margin-top: 24rpx;
}

.heat-cell {
    position: relative;
    min-height: 64rpx;
    border-radius: 14rpx;
    text-align: center;
    line-height: 64rpx;
    color: #1f2933;
}

.hot-0 {
    background: #edf2f7;
}

.hot-1 {
    background: #bbf7d0;
}

.hot-2 {
    background: #4ade80;
}

.hot-3 {
    background: #15803d;
    color: #fff;
}

.film {
    position: absolute;
    right: 6rpx;
    top: -16rpx;
    font-size: 22rpx;
}

.burn-row,
.check-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20rpx;
}

.progress {
    height: 18rpx;
    margin-top: 20rpx;
    overflow: hidden;
    border-radius: 999rpx;
    background: #e5e7eb;
}

.bar {
    height: 100%;
    border-radius: 999rpx;
    background: #0f766e;
}

.check {
    color: #16a34a;
    font-weight: 800;
}
</style>
