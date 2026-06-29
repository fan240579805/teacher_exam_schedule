<template>
    <view class="modal-mask" @click="$emit('close')">
        <view class="modal" @click.stop>
            <view class="modal-header">
                <text class="title">打卡随笔</text>
                <button class="close-button" aria-label="关闭打卡随笔" @click="$emit('close')">×</button>
            </view>

            <view class="streak-card">
                <view>
                    <text class="workspace">{{ workspaceTitle }}</text>
                    <text class="streak">今天是你连续打卡的第 {{ streakDays }} 天</text>
                </view>
                <text class="history">历史记录</text>
            </view>

            <view v-if="aiComment" class="ai-comment-card">
                <text class="ai-comment-icon">✨</text>
                <text class="ai-comment-text">今日 AI 点评：{{ aiComment }}</text>
            </view>

            <textarea
                v-model="memo"
                class="memo-input"
                maxlength="500"
                placeholder="记下此刻的心情、今日避坑总结或执行感悟..."
            />

            <button class="upload-card" @click="chooseImage">
                <text>{{ imagePath ? '已选择 1 张图片' : '添加一张今天的笔记或实拍' }}</text>
                <text class="upload-tip">{{ imagePath ? '点击可以重新选择' : '可以是草稿、笔记本、录音截图任你' }}</text>
            </button>

            <view class="footer">
                <button class="later-button" :disabled="saving" @click="$emit('close')">以后再说</button>
                <button class="save-button" :disabled="saving" @click="submit">
                    {{ saving ? '保存中...' : '保存记录' }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CreateDailyCheckinInput } from '@teacher-exam/types';

defineProps<{
    workspaceTitle: string;
    streakDays: number;
    saving: boolean;
    aiComment?: string;
}>();

const emit = defineEmits<{
    close: [];
    save: [CreateDailyCheckinInput];
}>();

const memo = ref('');
const imagePath = ref<string | null>(null);

function chooseImage() {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result) => {
            imagePath.value = result.tempFilePaths[0] ?? null;
        }
    });
}

function submit() {
    emit('save', {
        memo: memo.value,
        imagePath: imagePath.value
    });
}
</script>

<style scoped>
.modal-mask {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.38);
}

.modal {
    width: 100%;
    padding: 36rpx;
    border-radius: 36rpx 36rpx 0 0;
    background: #fff;
}

.modal-header,
.streak-card,
.footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.title {
    font-size: 36rpx;
    font-weight: 800;
}

.close-button {
    flex-shrink: 0;
    width: 64rpx;
    height: 64rpx;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #f3f4f6 !important;
    color: #6b7280 !important;
    font-size: 36rpx;
    line-height: 64rpx;
    text-align: center;
}

.close-button::after {
    display: none;
    border: none;
}

.streak-card {
    margin-top: 28rpx;
    padding: 28rpx;
    border-radius: 28rpx;
    background: #f9fafb;
}

.workspace,
.streak {
    display: block;
}

.workspace {
    font-size: 30rpx;
    font-weight: 800;
}

.streak {
    margin-top: 8rpx;
    color: #0f766e;
    font-size: 24rpx;
}

.history,
.upload-tip {
    color: #6b7280;
    font-size: 24rpx;
}

.ai-comment-card {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 20rpx;
    padding: 22rpx;
    border-radius: 22rpx;
    background: #f0fdfa;
}

.ai-comment-icon {
    font-size: 26rpx;
}

.ai-comment-text {
    flex: 1;
    color: #0f766e;
    font-size: 24rpx;
    line-height: 1.5;
}

.memo-input {
    width: 100%;
    min-height: 220rpx;
    box-sizing: border-box;
    margin-top: 24rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: #f3f4f6;
    font-size: 28rpx;
}

.upload-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 120rpx;
    margin-top: 24rpx;
    padding: 24rpx;
    border: 2rpx dashed #d1d5db;
    border-radius: 24rpx;
    background: #fff;
    color: #1f2933;
    font-size: 28rpx;
    text-align: left;
}

.footer {
    gap: 20rpx;
    margin-top: 28rpx;
}

.later-button,
.save-button {
    flex: 1;
    min-height: 88rpx;
    padding: 0;
    border: none;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 88rpx;
    font-weight: 600;
}

.later-button::after,
.save-button::after {
    display: none;
    border: none;
}

.later-button {
    background: #f3f4f6 !important;
    color: #4b5563 !important;
}

.save-button {
    background: #0f766e !important;
    color: #fff !important;
}
</style>
