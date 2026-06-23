<template>
    <view class="page">
        <view class="header">
            <text class="eyebrow">七层知识树</text>
            <text class="title">首页只看 L1-L3，章节页穿透到底层叶子</text>
        </view>

        <view class="card">
            <text class="card-title">模板库克隆</text>
            <text class="desc">当前 mock 模板：深圳教综官方标准大纲。真实联调时将调用 `clone_template` 实例化个人知识树。</text>
            <button class="clone-button" @click="cloneTemplate">重新载入官方模板</button>
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
                <button v-if="node.isLeaf && node.status !== 'archived'" class="prune-button" @click="pruneLeaf(node.id)">移入回收站</button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudyStore } from '../../stores/study';

const store = useStudyStore();
const deepNodes = computed(() => store.nodes.filter((node) => node.level >= 4));

function pruneLeaf(nodeId: string) {
    store.pruneLeaf(nodeId);
    uni.showToast({ title: '已移入回收站', icon: 'success' });
}

function cloneTemplate() {
    store.resetMock();
    uni.showToast({ title: '模板已载入', icon: 'success' });
}
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

.desc {
    display: block;
    margin-top: 12rpx;
    color: #6b7280;
    font-size: 24rpx;
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

.clone-button,
.prune-button {
    min-height: 72rpx;
    border-radius: 999rpx;
    font-size: 24rpx;
}

.clone-button {
    margin-top: 24rpx;
    background: #0f766e;
    color: #fff;
}

.prune-button {
    margin-left: 12rpx;
    background: #fee2e2;
    color: #b91c1c;
}
</style>
