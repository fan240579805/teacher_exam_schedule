<template>
    <view class="sheet-mask" @click="onMaskClick">
        <view class="sheet drill-sheet" @click.stop>
            <view class="sheet-head">
                <view class="sheet-title-row">
                    <text class="sheet-icon">🎙️</text>
                    <text class="sheet-title">AI 演练结算</text>
                </view>
                <text class="sheet-subtitle">{{ node.title }}</text>
                <text class="drill-hint">逻辑骨架：{{ frameworkText }}</text>
            </view>

            <!-- 录音区 -->
            <view v-if="stage !== 'result'" class="record-area">
                <button
                    class="mic-button"
                    :class="{ recording: stage === 'recording', busy: stage === 'analyzing' }"
                    :disabled="stage === 'analyzing'"
                    @click="onMicTap"
                >
                    <text class="mic-icon">🎤</text>
                </button>
                <text class="drill-timer">{{ timerText }}</text>
                <text class="record-tip">{{ recordTip }}</text>
                <button
                    v-if="stage === 'recording'"
                    class="primary-button drill-submit"
                    @click="stopAndSubmit"
                >结束并提交</button>
            </view>

            <!-- AI 结果卡片 -->
            <view v-else-if="result" class="drill-result">
                <view class="verdict" :class="result.verdict">
                    <text class="verdict-icon">{{ result.verdict === 'pass' ? '✅' : '🔁' }}</text>
                    <text class="verdict-text">{{ result.verdict === 'pass' ? '已达标 · 自动闭环' : '需复盘 · 再练一次' }}</text>
                </view>

                <view class="metric-list">
                    <view class="metric-item">
                        <text class="metric-k">耗时把控</text>
                        <text class="metric-v">{{ durationText }}</text>
                    </view>
                    <view class="metric-item">
                        <text class="metric-k">流畅度</text>
                        <text class="metric-v" :class="{ warn: result.fillerCount > 8 }">口头禅 {{ result.fillerCount }} 次</text>
                    </view>
                    <view class="metric-item">
                        <text class="metric-k">逻辑骨架</text>
                        <text class="metric-v" :class="{ warn: !result.hasFramework }">{{ result.hasFramework ? '完整' : '待加强' }}</text>
                    </view>
                    <view class="metric-item">
                        <text class="metric-k">踩分点遗漏</text>
                        <text class="metric-v" :class="{ warn: result.missingPoints.length > 0 }">{{ result.missingPoints.length === 0 ? '无' : result.missingPoints.join('；') }}</text>
                    </view>
                </view>

                <view class="drill-comment">
                    <text class="comment-icon">✨</text>
                    <text class="comment-text">AI 点评：{{ result.comment }}</text>
                </view>

                <button class="primary-button" @click="$emit('close')">{{ result.verdict === 'pass' ? '完成' : '知道了' }}</button>
                <button class="text-button" @click="restart">再练一次</button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type { AiDrillResult, KnowledgeNode } from '@teacher-exam/types';
import { frameworkHint } from '@teacher-exam/core';
import { useStudyStore } from '../stores/study';

const props = defineProps<{ node: KnowledgeNode }>();
const emit = defineEmits<{ close: [] }>();

const store = useStudyStore();

type Stage = 'idle' | 'recording' | 'analyzing' | 'result';
const stage = ref<Stage>('idle');
const seconds = ref(0);
const result = ref<AiDrillResult | null>(null);

let timer: ReturnType<typeof setInterval> | null = null;
let recorder: { start: () => void; stop: () => void } | null = null;

const frameworkText = computed(() => frameworkHint(props.node.drillType ?? 'structured'));
const timerText = computed(() => formatClock(seconds.value));
const durationText = computed(() => formatClock(result.value?.durationSeconds ?? 0));
const recordTip = computed(() => {
    if (stage.value === 'idle') {
        return '点击麦克风，开始你的演练';
    }
    if (stage.value === 'recording') {
        return '正在录音，演练结束点下方按钮提交';
    }
    return 'AI 正在分析你的表达…';
});

function onMicTap() {
    if (stage.value === 'idle') {
        startRecording();
    } else if (stage.value === 'recording') {
        stopAndSubmit();
    }
}

function startRecording() {
    stage.value = 'recording';
    seconds.value = 0;
    timer = setInterval(() => {
        seconds.value += 1;
    }, 1000);

    // 真机/小程序尽量调用录音管理器；H5 无权限时静默降级，时长以计时器为准。
    try {
        const manager = uni.getRecorderManager?.();
        if (manager) {
            recorder = manager as unknown as { start: () => void; stop: () => void };
            recorder.start();
        }
    } catch (error) {
        recorder = null;
    }
}

function stopAndSubmit() {
    if (stage.value !== 'recording') {
        return;
    }
    clearTimer();
    try {
        recorder?.stop();
    } catch (error) {
        // 忽略录音器停止异常
    }
    recorder = null;

    stage.value = 'analyzing';
    const duration = seconds.value;
    // 模拟 AI 异步质检（真实环境为 Storage 上传 → Edge Function STT+LLM → 回填）。
    setTimeout(() => {
        result.value = store.settleDrill(props.node.id, duration);
        stage.value = 'result';
    }, 600);
}

function restart() {
    result.value = null;
    seconds.value = 0;
    stage.value = 'idle';
}

function onMaskClick() {
    if (stage.value === 'recording' || stage.value === 'analyzing') {
        return; // 录音/分析中不允许误触关闭
    }
    emit('close');
}

function clearTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function formatClock(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

onUnmounted(clearTimer);
</script>

<style scoped>
.sheet-mask {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.38);
}

.sheet {
    width: 100%;
    max-height: 86vh;
    padding: 40rpx 36rpx 48rpx;
    border-radius: 36rpx 36rpx 0 0;
    background: #fff;
    overflow-y: auto;
}

.sheet-head {
    margin-bottom: 24rpx;
}

.sheet-title-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.sheet-icon {
    font-size: 36rpx;
}

.sheet-title {
    font-size: 38rpx;
    font-weight: 800;
}

.sheet-subtitle {
    display: block;
    margin-top: 8rpx;
    color: #1f2933;
    font-size: 30rpx;
    font-weight: 600;
}

.drill-hint {
    display: block;
    margin-top: 6rpx;
    color: #6b7280;
    font-size: 24rpx;
}

.record-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0 8rpx;
}

.mic-button {
    width: 220rpx;
    height: 220rpx;
    border-radius: 50%;
    background: #0f766e !important;
    color: #fff !important;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 40rpx rgba(15, 118, 110, 0.28);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mic-button::after {
    display: none;
    border: none;
}

.mic-button.recording {
    background: #b91c1c !important;
    box-shadow: 0 0 0 12rpx rgba(185, 28, 28, 0.16);
}

.mic-button.busy {
    background: #9ca3af !important;
}

.mic-icon {
    font-size: 80rpx;
}

.drill-timer {
    margin-top: 28rpx;
    font-size: 64rpx;
    font-weight: 800;
    color: #1f2933;
    font-variant-numeric: tabular-nums;
}

.record-tip {
    margin-top: 12rpx;
    color: #6b7280;
    font-size: 26rpx;
}

.drill-result {
    padding-top: 8rpx;
}

.verdict {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx;
    border-radius: 22rpx;
}

.verdict.pass {
    background: #ecfdf5;
}

.verdict.review {
    background: #fef2f2;
}

.verdict-icon {
    font-size: 36rpx;
}

.verdict-text {
    font-size: 30rpx;
    font-weight: 800;
}

.verdict.pass .verdict-text {
    color: #0f766e;
}

.verdict.review .verdict-text {
    color: #b91c1c;
}

.metric-list {
    margin-top: 24rpx;
    border-radius: 22rpx;
    background: #f8fafc;
    overflow: hidden;
}

.metric-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 28rpx;
    border-bottom: 1rpx solid #eef2f7;
}

.metric-k {
    color: #6b7280;
    font-size: 26rpx;
}

.metric-v {
    color: #1f2933;
    font-size: 28rpx;
    font-weight: 700;
    max-width: 60%;
    text-align: right;
}

.metric-v.warn {
    color: #b91c1c;
}

.drill-comment {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 24rpx;
    padding: 24rpx;
    border-radius: 22rpx;
    background: #f0fdfa;
}

.comment-icon {
    font-size: 28rpx;
}

.comment-text {
    flex: 1;
    color: #0f766e;
    font-size: 26rpx;
    line-height: 1.5;
}

.primary-button {
    width: 100%;
    height: 96rpx;
    margin-top: 28rpx;
    border-radius: 999rpx;
    background: #0f766e !important;
    color: #fff !important;
    font-size: 30rpx;
    font-weight: 700;
    line-height: 96rpx;
}

.primary-button::after {
    display: none;
    border: none;
}

.text-button {
    width: 100%;
    height: 72rpx;
    margin-top: 12rpx;
    background: transparent !important;
    color: #6b7280 !important;
    font-size: 26rpx;
    line-height: 72rpx;
}

.text-button::after {
    display: none;
    border: none;
}
</style>
