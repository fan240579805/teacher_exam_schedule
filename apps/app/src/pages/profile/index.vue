<template>
    <view class="page">
        <!-- 1. 顶部：极简用户卡片 -->
        <view class="profile-card">
            <view class="avatar">{{ avatarInitial }}</view>
            <view class="profile-info">
                <text class="profile-name">{{ profileName }}</text>
                <text class="profile-target">{{ store.workspace.title }}</text>
                <view class="sync-row" :class="{ pending: store.cloudSyncStatus === 'pending' }">
                    <view class="sync-dot" />
                    <text class="sync-text">{{ syncText }}</text>
                </view>
            </view>
        </view>

        <view class="exam-card">
            <view>
                <text class="exam-label">距离考试还有</text>
                <text class="exam-days">{{ store.daysUntilExam }} <text class="exam-unit">天</text></text>
            </view>
            <view class="exam-side">
                <text class="exam-side-text">考试日期</text>
                <text class="exam-side-date">{{ store.workspace.examDate }}</text>
            </view>
        </view>

        <!-- Group 1：复习计划管理 -->
        <view class="group">
            <text class="group-title">复习计划管理</text>
            <view class="list">
                <view class="list-item" @click="onSwitchTarget">
                    <text class="item-label">当前备考目标</text>
                    <view class="item-right">
                        <text class="item-value">{{ store.workspace.title }}</text>
                        <text class="item-arrow">›</text>
                    </view>
                </view>
                <view class="list-item" @click="onScheduleSetup">
                    <text class="item-label">倒计时与时间分配</text>
                    <view class="item-right">
                        <text class="item-value">考试 {{ store.workspace.examDate }}</text>
                        <text class="item-arrow">›</text>
                    </view>
                </view>
                <view class="list-item">
                    <text class="item-label">每日任务上限提醒</text>
                    <view class="item-right">
                        <view class="cap-control">
                            <button class="cap-btn" @click.stop="adjustCap(-1)">−</button>
                            <text class="cap-value">{{ store.dailyTaskCapHours }} 小时</text>
                            <button class="cap-btn" @click.stop="adjustCap(1)">＋</button>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Group 2：考点库管理 -->
        <view class="group">
            <text class="group-title">考点库管理</text>
            <view class="list">
                <view class="list-item archived-row">
                    <view class="archived-head">
                        <text class="item-label">暂不复习考点库</text>
                        <text class="archived-count">{{ store.archivedLeaves.length }} 个考点</text>
                    </view>
                    <view v-if="store.archivedLeaves.length === 0" class="archived-empty">
                        <text>当前没有放进回收站的考点。</text>
                    </view>
                    <view v-else class="archived-list">
                        <view v-for="leaf in store.archivedLeaves" :key="leaf.id" class="archived-item">
                            <text class="archived-title">{{ leaf.title }}</text>
                            <button class="restore-btn" @click.stop="onRestoreOne(leaf.id)">恢复</button>
                        </view>
                        <button class="restore-all-btn" @click="onRestoreAll">一键全部恢复</button>
                    </view>
                </view>
                <view class="list-item danger" @click="onClearLocalCache">
                    <text class="item-label danger-text">本地日志清理</text>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 预留广告位 -->
        <view class="ad-slot">
            <text class="ad-text">[ 预留广告位 / Ad Slot ]</text>
        </view>

        <!-- Group 3：关于与帮助 -->
        <view class="group">
            <text class="group-title">关于与帮助</text>
            <view class="list">
                <view class="list-item" @click="onFeedback">
                    <text class="item-label">问题反馈 / 吐槽</text>
                    <view class="item-right">
                        <text class="item-arrow">›</text>
                    </view>
                </view>
                <view class="list-item" @click="onAbout">
                    <text class="item-label">关于深教考通</text>
                    <view class="item-right">
                        <text class="item-value">v1.0.0</text>
                        <text class="item-arrow">›</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="footer">
            <text>本应用仅作为备考进度追踪工具，不内置题库、不内置网课。</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const profileName = '考编战士 · 微光';
const avatarInitial = computed(() => profileName.slice(0, 1));
const syncText = computed(() => store.cloudSyncStatus === 'synced' ? '云端数据已同步' : '离线数据待上传');

function adjustCap(delta: number) {
    const next = Math.min(Math.max(store.dailyTaskCapHours + delta, 2), 12);
    store.dailyTaskCapHours = next;
}

function onSwitchTarget() {
    uni.showActionSheet({
        itemList: ['深圳小学语文 · 暑期冲刺', '深圳教综 · 90 天冲刺（示例）', '广州小学数学 · 秋招（示例）'],
        success: (res) => {
            uni.showToast({ title: '示例：仅切换占位文案', icon: 'none' });
        },
        fail: () => {
            // 用户取消
        }
    });
}

function onScheduleSetup() {
    uni.showModal({
        title: '倒计时与时间分配',
        content: `当前考试日期：${store.workspace.examDate}\n距今 ${store.daysUntilExam} 天\n（设置面板将在后续接入 supabase 后开放）`,
        showCancel: false
    });
}

function onRestoreOne(nodeId: string) {
    store.restoreArchived(nodeId);
    uni.showToast({ title: '已恢复', icon: 'success' });
}

function onRestoreAll() {
    if (store.archivedLeaves.length === 0) {
        return;
    }
    store.restoreArchived();
    uni.showToast({ title: `已恢复 ${store.archivedLeaves.length === 0 ? '全部' : ''}考点`, icon: 'success' });
}

function onClearLocalCache() {
    uni.showModal({
        title: '本地日志清理',
        content: '将清空本地缓存并重新拉取示例数据，已结算的进度会重置。确定继续吗？',
        confirmText: '确认清理',
        confirmColor: '#dc2626',
        success: (res) => {
            if (res.confirm) {
                store.clearLocalCache();
                uni.showToast({ title: '已清理', icon: 'success' });
            }
        }
    });
}

function onFeedback() {
    uni.showModal({
        title: '问题反馈 / 吐槽',
        content: '感谢使用！可发送邮件至 feedback@deepteach.demo 反馈问题，或在小程序内提交工单。',
        showCancel: false
    });
}

function onAbout() {
    uni.showModal({
        title: '关于深教考通',
        content: '深教考通 v1.0.0\n备考进度追踪与高保真执行记录引擎。\n隐私协议：所有数据默认仅存储于本机，可选同步到你的 Supabase 账户。',
        showCancel: false
    });
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 32rpx 32rpx 60rpx;
}

/* ===== 用户卡 ===== */
.profile-card {
    display: flex;
    align-items: center;
    gap: 28rpx;
    padding: 32rpx;
    border-radius: 32rpx;
    background: #fff;
    box-shadow: 0 8rpx 24rpx rgba(31, 41, 51, 0.04);
}

.avatar {
    flex-shrink: 0;
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: #0f766e;
    color: #fff;
    text-align: center;
    line-height: 112rpx;
    font-size: 48rpx;
    font-weight: 800;
}

.profile-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.profile-name {
    color: #1f2933;
    font-size: 32rpx;
    font-weight: 800;
}

.profile-target {
    color: #6b7280;
    font-size: 24rpx;
}

.sync-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 8rpx;
}

.sync-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: #22c55e;
}

.sync-row.pending .sync-dot {
    background: #f59e0b;
}

.sync-text {
    color: #4b5563;
    font-size: 22rpx;
}

/* ===== 倒计时卡 ===== */
.exam-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24rpx;
    padding: 32rpx;
    border-radius: 32rpx;
    background: #ecfdf5;
    box-shadow: 0 8rpx 24rpx rgba(15, 118, 110, 0.06);
}

.exam-label {
    display: block;
    color: #0f766e;
    font-size: 24rpx;
    font-weight: 700;
}

.exam-days {
    display: block;
    margin-top: 8rpx;
    color: #0f766e;
    font-size: 64rpx;
    font-weight: 900;
    line-height: 1;
}

.exam-unit {
    font-size: 28rpx;
    font-weight: 700;
}

.exam-side {
    text-align: right;
}

.exam-side-text {
    display: block;
    color: #0f766e;
    font-size: 22rpx;
}

.exam-side-date {
    display: block;
    margin-top: 6rpx;
    color: #1f2933;
    font-size: 28rpx;
    font-weight: 700;
}

/* ===== 分组列表 ===== */
.group {
    margin-top: 32rpx;
}

.group-title {
    display: block;
    margin-bottom: 14rpx;
    padding-left: 8rpx;
    color: #6b7280;
    font-size: 24rpx;
    font-weight: 700;
}

.list {
    overflow: hidden;
    border-radius: 28rpx;
    background: #fff;
    box-shadow: 0 4rpx 18rpx rgba(31, 41, 51, 0.04);
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 32rpx;
    border-bottom: 2rpx solid #f3f4f6;
}

.list-item:last-child {
    border-bottom: none;
}

.item-label {
    color: #1f2933;
    font-size: 28rpx;
    font-weight: 600;
}

.item-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.item-value {
    color: #6b7280;
    font-size: 24rpx;
}

.item-arrow {
    color: #9ca3af;
    font-size: 32rpx;
    line-height: 1;
}

/* 每日上限调节器 */
.cap-control {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.cap-btn {
    width: 56rpx;
    height: 56rpx;
    padding: 0 !important;
    border: 2rpx solid #d1d5db !important;
    border-radius: 50%;
    background: #fff !important;
    color: #1f2933 !important;
    font-size: 32rpx;
    font-weight: 700;
    line-height: 52rpx;
}

.cap-btn::after {
    display: none;
    border: none;
}

.cap-value {
    min-width: 100rpx;
    color: #0f766e;
    font-size: 26rpx;
    font-weight: 700;
    text-align: center;
}

/* 暂不复习考点 */
.archived-row {
    flex-direction: column;
    align-items: stretch;
    padding: 28rpx 32rpx;
}

.archived-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.archived-count {
    color: #6b7280;
    font-size: 22rpx;
}

.archived-empty {
    margin-top: 16rpx;
    padding: 20rpx;
    border-radius: 16rpx;
    background: #f9fafb;
    color: #6b7280;
    font-size: 24rpx;
}

.archived-list {
    margin-top: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.archived-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18rpx 20rpx;
    border-radius: 16rpx;
    background: #f9fafb;
}

.archived-title {
    flex: 1;
    color: #4b5563;
    font-size: 24rpx;
}

.restore-btn,
.restore-all-btn {
    padding: 0 20rpx !important;
    height: 56rpx;
    border: 2rpx solid #0f766e !important;
    border-radius: 999rpx;
    background: transparent !important;
    color: #0f766e !important;
    font-size: 22rpx;
    font-weight: 600;
    line-height: 52rpx;
}

.restore-btn::after,
.restore-all-btn::after {
    display: none;
    border: none;
}

.restore-all-btn {
    margin-top: 8rpx;
    height: 64rpx;
    background: #0f766e !important;
    color: #fff !important;
    line-height: 60rpx;
}

/* 危险按钮 */
.danger-text {
    color: #dc2626 !important;
}

/* 广告位 */
.ad-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200rpx;
    margin-top: 32rpx;
    border: 4rpx dashed #d1d5db;
    border-radius: 28rpx;
    background: #f9fafb;
}

.ad-text {
    color: #9ca3af;
    font-size: 24rpx;
    font-weight: 500;
}

.footer {
    margin-top: 32rpx;
    padding: 0 16rpx;
    color: #9ca3af;
    font-size: 22rpx;
    text-align: center;
    line-height: 1.6;
}
</style>
