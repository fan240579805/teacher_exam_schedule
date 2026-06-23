<template>
    <view class="page">
        <view class="summary">
            <text class="eyebrow">个人复习看板</text>
            <text class="title">深教考通 · 我的统计</text>
            <text class="desc">所有数据都来自你在首页的真实结算，不掺水。</text>
        </view>

        <!-- 1. 顶部：打卡日历（GitHub Contributions Style 热力图） -->
        <view class="card">
            <view class="card-head">
                <text class="card-title">打卡日历</text>
                <text class="card-sub">最近 5 周</text>
            </view>
            <view class="heat-grid">
                <view
                    v-for="day in heatmapCells"
                    :key="day.date"
                    class="heat-cell"
                    :class="day.levelClass"
                >
                    <text v-if="day.memoFlag" class="badge memo">★</text>
                    <text v-if="day.imageFlag" class="badge image">▣</text>
                </view>
            </view>
            <view class="heat-legend">
                <text class="legend-text">少</text>
                <view class="legend-cell hot-0" />
                <view class="legend-cell hot-1" />
                <view class="legend-cell hot-2" />
                <view class="legend-cell hot-3" />
                <text class="legend-text">多</text>
                <text class="legend-extra">★ 当日有随笔　▣ 当日有照片</text>
            </view>
        </view>

        <!-- 2. 中上部：核心数据概览 (2x2 卡片网格) -->
        <view class="metric-grid">
            <view class="metric-card">
                <text class="metric-label">完美达标天数</text>
                <text class="metric-value">{{ store.perfectDays }}<text class="metric-unit"> 天</text></text>
                <text class="metric-hint">100% 完成当日配额的天数</text>
            </view>
            <view class="metric-card">
                <text class="metric-label">日均学习时长</text>
                <text class="metric-value">{{ store.avgStudyHours }}<text class="metric-unit"> 小时</text></text>
                <text class="metric-hint">基于实际录入时长</text>
            </view>
            <view class="metric-card">
                <text class="metric-label">已掌握考点</text>
                <text class="metric-value">{{ store.masteredCount }}<text class="metric-unit"> / {{ store.totalLeafCount }}</text></text>
                <text class="metric-hint">叶子节点 100% 掌握</text>
            </view>
            <view class="metric-card">
                <text class="metric-label">刷题正确率</text>
                <text class="metric-value">{{ store.objectiveAccuracy }}<text class="metric-unit">%</text></text>
                <text class="metric-hint">客观题加权正确率</text>
            </view>
        </view>

        <!-- 3a. 最近打卡随笔 -->
        <view class="card">
            <text class="card-title">最近打卡随笔</text>
            <view v-if="recentMemos.length === 0" class="empty-row">
                <text>还没有随笔，今天完成所有任务后去首页底部打卡试试。</text>
            </view>
            <view v-for="item in recentMemos" :key="item.id" class="memo-card">
                <view class="memo-head">
                    <text class="memo-date">{{ formatDate(item.checkinDate) }}</text>
                    <text class="memo-streak">已坚持 {{ item.streakDays }} 天</text>
                </view>
                <text class="memo-body">{{ item.memo || '当天没写文字，只完成了打卡。' }}</text>
                <view v-if="item.imageUrl" class="memo-image">
                    <text class="image-placeholder">📷 战果照片（{{ item.imageUrl.startsWith('mock://') ? '本地占位' : '已上传' }}）</text>
                </view>
            </view>
        </view>

        <!-- 3b. 各科通关进度 -->
        <view class="card">
            <text class="card-title">各科通关进度</text>
            <text class="desc">按 L2 大模块统计，对应你在首页结算的考点。</text>
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
                <text class="module-percent">{{ module.percent }}% （掌握 {{ module.doneLeaves }}/{{ module.totalLeaves }} 考点）</text>
            </view>
            <view v-if="store.moduleBurndown.length === 0" class="empty-row">
                <text>还没有模块数据，去"我的"页面切换备考目标。</text>
            </view>
        </view>

        <!-- 4. 面试能力雷达图（CSS 五维雷达） -->
        <view class="card">
            <text class="card-title">面试能力雷达</text>
            <text class="desc">基于已掌握考点估算，越向外圈越成熟。</text>
            <view class="radar-wrap">
                <view class="radar-bg" />
                <view class="radar-bg radar-bg-2" />
                <view class="radar-bg radar-bg-3" />
                <view
                    v-for="(point, index) in store.interviewRadar"
                    :key="point.label"
                    class="radar-axis"
                    :style="{ transform: `rotate(${index * 72}deg)` }"
                />
                <view
                    v-for="(point, index) in radarLayoutPoints"
                    :key="point.label"
                    class="radar-label"
                    :style="{ left: `${point.x}%`, top: `${point.y}%` }"
                >
                    <text class="radar-label-text">{{ point.label }}</text>
                    <text class="radar-label-score">{{ point.score }}</text>
                </view>
                <view class="radar-poly" :style="{ clipPath: radarClipPath }" />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();

// 把 heatmap 整理成 5 行 x 7 列的网格，每个单元格携带强度等级与"是否有随笔/照片"标记。
const heatmapCells = computed(() => {
    const memoSet = new Set(store.dailyCheckins.filter((c) => c.memo.trim().length > 0).map((c) => c.checkinDate));
    const imageSet = new Set(store.dailyCheckins.filter((c) => !!c.imageUrl).map((c) => c.checkinDate));

    return store.heatmap.slice(-35).map((day) => ({
        date: day.date,
        levelClass: levelClassByMinutes(day.minutes),
        memoFlag: memoSet.has(day.date),
        imageFlag: imageSet.has(day.date)
    }));
});

const recentMemos = computed(() => [...store.dailyCheckins]
    .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate))
    .slice(0, 3));

// 雷达图坐标布局（百分比，相对 240rpx 容器中心）。
const radarLayoutPoints = computed(() => {
    // 5 个轴对应 90°/162°/234°/306°/378°(=18°) 的方位（顶端开始顺时针）
    // 用 CSS 百分比定位标签即可，不依赖 canvas。
    const positions = [
        { x: 50, y: -2 },
        { x: 99, y: 32 },
        { x: 80, y: 92 },
        { x: 20, y: 92 },
        { x: 1, y: 32 }
    ];
    return store.interviewRadar.map((point, index) => ({
        ...point,
        x: positions[index].x,
        y: positions[index].y
    }));
});

// 把 5 个分数转为 polygon clip-path（基于 240rpx 容器，相对 0~100 % 坐标）。
const radarClipPath = computed(() => {
    const cx = 50;
    const cy = 50;
    const radius = 45; // 与 .radar-bg 半径同步
    const angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI / 5), -Math.PI / 2 + (4 * Math.PI / 5), -Math.PI / 2 + (6 * Math.PI / 5), -Math.PI / 2 + (8 * Math.PI / 5)];
    const points = store.interviewRadar.map((point, i) => {
        const r = (point.score / 100) * radius;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    });
    return `polygon(${points.join(', ')})`;
});

function levelClassByMinutes(minutes: number) {
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

function formatDate(iso: string) {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')} 月 ${String(d.getDate()).padStart(2, '0')} 日`;
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
    box-shadow: 0 8rpx 24rpx rgba(31, 41, 51, 0.04);
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

.card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-sub {
    color: #6b7280;
    font-size: 22rpx;
}

/* ====== 热力日历 ====== */
.heat-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10rpx;
    margin-top: 24rpx;
}

.heat-cell {
    position: relative;
    aspect-ratio: 1 / 1;
    min-height: 64rpx;
    border-radius: 12rpx;
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
}

.badge {
    position: absolute;
    right: 4rpx;
    top: 4rpx;
    font-size: 18rpx;
    line-height: 1;
}

.badge.memo {
    color: #facc15;
}

.badge.image {
    right: 22rpx;
    color: #fff;
    text-shadow: 0 0 4rpx rgba(0, 0, 0, 0.6);
}

.heat-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
    margin-top: 18rpx;
}

.legend-text {
    color: #6b7280;
    font-size: 22rpx;
}

.legend-cell {
    width: 24rpx;
    height: 24rpx;
    border-radius: 6rpx;
}

.legend-extra {
    margin-left: auto;
    color: #6b7280;
    font-size: 22rpx;
}

/* ====== 核心指标 2x2 ====== */
.metric-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18rpx;
    margin-bottom: 24rpx;
}

.metric-card {
    padding: 28rpx 24rpx;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 4rpx 18rpx rgba(31, 41, 51, 0.04);
}

.metric-label {
    display: block;
    color: #6b7280;
    font-size: 24rpx;
}

.metric-value {
    display: block;
    margin-top: 12rpx;
    color: #0f766e;
    font-size: 44rpx;
    font-weight: 800;
}

.metric-unit {
    color: #1f2933;
    font-size: 26rpx;
    font-weight: 600;
}

.metric-hint {
    display: block;
    margin-top: 8rpx;
    color: #9ca3af;
    font-size: 20rpx;
}

/* ====== 最近随笔 ====== */
.memo-card {
    margin-top: 20rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: #f9fafb;
}

.memo-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.memo-date {
    color: #1f2933;
    font-size: 26rpx;
    font-weight: 700;
}

.memo-streak {
    color: #0f766e;
    font-size: 22rpx;
    font-weight: 600;
}

.memo-body {
    display: block;
    color: #374151;
    font-size: 26rpx;
    line-height: 1.6;
}

.memo-image {
    margin-top: 14rpx;
    padding: 16rpx;
    border: 2rpx dashed #d1d5db;
    border-radius: 16rpx;
    background: #fff;
}

.image-placeholder {
    color: #6b7280;
    font-size: 22rpx;
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

/* ====== 模块进度 ====== */
.burn-block {
    margin-top: 24rpx;
}

.burn-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.module-title {
    color: #1f2933;
    font-size: 28rpx;
    font-weight: 700;
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

/* ====== 雷达图 ====== */
.radar-wrap {
    position: relative;
    width: 480rpx;
    height: 480rpx;
    margin: 32rpx auto 0;
}

.radar-bg {
    position: absolute;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    border: 2rpx solid #e5e7eb;
    border-radius: 50%;
}

.radar-bg-2 {
    top: 20%;
    left: 20%;
    width: 60%;
    height: 60%;
}

.radar-bg-3 {
    top: 35%;
    left: 35%;
    width: 30%;
    height: 30%;
}

.radar-axis {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2rpx;
    height: 45%;
    background: #e5e7eb;
    transform-origin: top center;
}

.radar-poly {
    position: absolute;
    inset: 0;
    background: rgba(15, 118, 110, 0.35);
    border: 2rpx solid #0f766e;
}

.radar-label {
    position: absolute;
    transform: translate(-50%, -50%);
    text-align: center;
}

.radar-label-text {
    display: block;
    color: #1f2933;
    font-size: 22rpx;
    font-weight: 700;
}

.radar-label-score {
    display: block;
    color: #0f766e;
    font-size: 22rpx;
    font-weight: 800;
}
</style>
