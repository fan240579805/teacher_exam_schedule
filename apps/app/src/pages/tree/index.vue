<template>
    <view class="page">
        <view class="header">
            <text class="eyebrow">七层知识树</text>
            <text class="title">首页只看 L1-L3，章节页穿透到底层叶子</text>
        </view>

        <view class="card">
            <text class="card-title">首页降维视图</text>
            <view v-for="node in store.homepageNodes" :key="node.id" class="node-row">
                <text class="level">L{{ node.level }}</text>
                <text>{{ node.title }}</text>
                <text class="status">{{ node.status }}</text>
            </view>
        </view>

        <view class="card">
            <text class="card-title">教材穿透页</text>
            <view v-for="node in deepNodes" :key="node.id" class="node-row" :style="{ paddingLeft: `${(node.level - 4) * 24}rpx` }">
                <text class="level">L{{ node.level }}</text>
                <text>{{ node.title }}</text>
                <text class="status">{{ node.status }}</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const deepNodes = computed(() => store.nodes.filter((node) => node.level >= 4));
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 32rpx;
}

.header,
.card {
    border-radius: 32rpx;
    background: #fff;
}

.header {
    padding: 32rpx;
    margin-bottom: 24rpx;
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

.card {
    margin-bottom: 24rpx;
    padding: 28rpx;
}

.node-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #eef2f7;
}

.level {
    min-width: 56rpx;
    color: #0f766e;
    font-weight: 700;
}

.status {
    margin-left: auto;
    color: #6b7280;
    font-size: 24rpx;
}
</style>
