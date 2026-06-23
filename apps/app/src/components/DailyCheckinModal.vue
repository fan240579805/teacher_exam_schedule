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
                    <text class="streak">已连续坚持高保真执行 {{ streakDays }} 天</text>
                </view>
                <text class="history">历史记录</text>
            </view>

            <textarea
                v-model="memo"
                class="memo-input"
                maxlength="500"
                placeholder="记下此刻的心情、今日避坑总结或执行感悟..."
            />

            <button class="upload-card" @click="chooseImage">
                <text>{{ imagePath ? '已选择 1 张图片' : '添加图片（限 1 张）' }}</text>
                <text class="upload-tip">{{ imagePath ? '可重新选择替换' : '支持拍摄或上传今日战果照片' }}</text>
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
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #f3f4f6;
    color: #1f2933;
    line-height: 72rpx;
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
    color: #b91c1c;
    font-size: 24rpx;
}

.history,
.upload-tip {
    color: #6b7280;
    font-size: 24rpx;
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
    border-radius: 999rpx;
    font-size: 28rpx;
}

.later-button {
    background: #f3f4f6;
    color: #4b5563;
}

.save-button {
    background: #0f766e;
    color: #fff;
}
</style>
