<template>
    <view class="page">
        <view class="summary">
            <text class="eyebrow">我的进度</text>
            <text class="title">备考节奏一目了然</text>
            <text class="desc">下面这些数据全部来自首页的真实结算，不掺一点掺水操作。</text>
        </view>

        <view class="card today">
            <view class="today-head">
                <text class="card-title">今日任务进度</text>
                <text class="today-count">{{ store.todayCompletedCount }} / {{ Math.max(store.todayTotalCount, 1) }}</text>
            </view>
            <view class="progress">
                <view class="bar" :style="{ width: `${todayPercent}%` }" />
            </view>
            <text class="desc">{{ todayHint }}</text>
        </view>

        <view class="card">
            <text class="card-title">月度打卡热力</text>
            <view class="heat-grid">
                <view v-for="day in store.heatmap" :key="day.date" class="heat-cell" :class="levelClass(day.minutes)">
                    <text>{{ day.date.slice(8) }}</text>
                    <text v-if="day.imageUrl" class="film">▣</text>
                </view>
            </view>
            <text class="desc">绿色越深表示当天投入时长越长，右上角▣表示当天上传了学习记录照片。</text>
        </view>

        <view class="card">
            <text class="card-title">最近打卡随笔</text>
            <view v-if="recentCheckins.length === 0" class="empty-row">
                <text>还没有随笔，今天完成所有任务后去首页底部打卡试试。</text>
            </view>
            <view v-for="item in recentCheckins" :key="item.id" class="checkin-row">
                <text class="checkin-date">{{ item.checkinDate }}</text>
                <text class="checkin-memo">{{ item.memo || '当天没写感悟，只完成了打卡。' }}</text>
            </view>
        </view>

        <view class="card">
            <text class="card-title">模块燃尽进度</text>
            <text class="desc">按三大模块独立追踪，对应你在首页结算的每个知识点。</text>
            <view v-for="module in store.moduleBurndown" :key="module.moduleId" class="burn-block">
                <view class="burn-row">
                    <text class="module-title">{{ module.title }}</text>
                    <text class="module-count">{{ module.doneLeaves }} / {{ module.totalLeaves }}</text>
                </view>
                <view class="progress">
                    <view
                        class="bar"
                        :class="burnLevelClass(module.percent)"
                        :style="{ width: `${module.percent}%` }"
                    />
                </view>
                <text class="module-percent">{{ module.percent }}%</text>
            </view>
            <view v-if="store.moduleBurndown.length === 0" class="empty-row">
                <text>还没有模块数据，点击右上角“重置”可以载入示例计划。</text>
            </view>
        </view>

        <view class="card">
            <text class="card-title">面试自评清单</text>
            <view v-for="item in checklist" :key="item" class="check-row">
                <text class="check">✓</text>
                <text>{{ item }}</text>
            </view>
            <text class="desc">正式上场前，这几项要逐条对一遍。</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const recentCheckins = computed(() => [...store.dailyCheckins].sort((a, b) => b.checkinDate.localeCompare(a.checkinDate)).slice(0, 3));
const checklist = ['耗时控制达标', '没有明显卡壳', '板书结构完整', '环节过渡自然'];

const todayPercent = computed(() => {
    const total = Math.max(store.todayTotalCount, 1);
    return Math.round((store.todayCompletedCount / total) * 100);
});

const todayHint = computed(() => {
    if (store.todayTotalCount === 0) {
        return '今天还没有派发任务，可以先去首页查看。';
    }

    if (store.todayCompletedCount >= store.todayTotalCount) {
        return store.todayCheckin ? '今天的打卡已记录，明天继续。' : '所有任务已完成，记得回首页底部打卡留念。';
    }

    return `还差 ${store.todayTotalCount - store.todayCompletedCount} 项就能解锁今天的打卡。`;
});

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

function burnLevelClass(percent: number) {
    if (percent >= 80) {
        return 'burn-strong';
    }

    if (percent >= 40) {
        return 'burn-mid';
    }

    return 'burn-weak';
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
    line-height: 1.5;
}

.today {
    background: #ecfdf5;
}

.today-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.today-count {
    color: #0f766e;
    font-size: 30rpx;
    font-weight: 800;
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

.burn-block {
    margin-top: 24rpx;
}

.burn-row,
.check-row,
.checkin-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
}

.checkin-row {
    align-items: flex-start;
    gap: 20rpx;
    justify-content: flex-start;
}

.checkin-date {
    color: #0f766e;
    font-size: 24rpx;
    font-weight: 700;
}

.checkin-memo {
    flex: 1;
    color: #4b5563;
    font-size: 24rpx;
    line-height: 1.5;
    text-align: left;
}

.empty-row {
    margin-top: 16rpx;
    padding: 28rpx;
    border-radius: 20rpx;
    background: #f9fafb;
    color: #6b7280;
    font-size: 24rpx;
    line-height: 1.5;
}

.module-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1f2933;
}

.module-count {
    color: #0f766e;
    font-size: 24rpx;
    font-weight: 700;
}

.module-percent {
    display: block;
    margin-top: 8rpx;
    color: #6b7280;
    font-size: 22rpx;
    text-align: right;
}

.progress {
    height: 18rpx;
    margin-top: 12rpx;
    overflow: hidden;
    border-radius: 999rpx;
    background: #e5e7eb;
}

.bar {
    height: 100%;
    border-radius: 999rpx;
    background: #0f766e;
    transition: width 0.3s ease;
}

.burn-weak {
    background: #fbbf24;
}

.burn-mid {
    background: #2dd4bf;
}

.burn-strong {
    background: #15803d;
}

.check {
    color: #16a34a;
    font-weight: 800;
}
</style>
