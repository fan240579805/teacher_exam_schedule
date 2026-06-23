<template>
    <view class="page">
        <view class="header">
            <view class="header-text">
                <text class="eyebrow">复习书架</text>
                <text class="title">我的复习书目</text>
                <text class="desc">添加你正在复习的教材，点击书本进入可编辑思维导图。</text>
            </view>
            <button class="add-button" @click="openCreate">+ 新增书目</button>
        </view>

        <view class="shelf">
            <view
                v-for="book in store.orderedBooks"
                :key="book.id"
                class="book"
                hover-class="book-hover"
                @click="openBook(book)"
                @longpress="openEdit(book)"
            >
                <view class="cover" :style="{ backgroundColor: book.coverColor }">
                    <view class="spine" />
                    <text class="cover-title">{{ book.title }}</text>
                    <text v-if="book.author" class="cover-author">{{ book.author }}</text>
                    <text class="cover-count">{{ store.nodeCount(book.id) }} 个知识点</text>
                </view>
                <text class="book-name">{{ book.title }}</text>
            </view>

            <view v-if="store.orderedBooks.length === 0" class="empty">
                <text>书架还空着，点击右上角“新增书目”开始搭建知识树。</text>
            </view>
        </view>

        <view class="hint">
            <text>提示：长按书本可以编辑书名、作者、封面色或删除。</text>
        </view>

        <view v-if="sheetVisible" class="sheet-mask" @click="closeSheet">
            <view class="sheet" @click.stop>
                <view class="sheet-head">
                    <text class="sheet-title">{{ isEditing ? '编辑书目' : '新增书目' }}</text>
                    <button class="icon-button" @click="closeSheet">×</button>
                </view>

                <text class="field-label">书名</text>
                <input v-model="formTitle" class="field-input" placeholder="例如：教育心理学" />

                <text class="field-label">作者（选填）</text>
                <input v-model="formAuthor" class="field-input" placeholder="例如：陈琦 刘儒德" />

                <text class="field-label">封面色</text>
                <view class="swatches">
                    <view
                        v-for="color in palette"
                        :key="color"
                        class="swatch"
                        :class="{ active: color === formColor }"
                        :style="{ backgroundColor: color }"
                        @click="formColor = color"
                    />
                </view>

                <button class="primary-button" @click="saveBook">保存</button>
                <button v-if="isEditing" class="danger-button" @click="confirmRemove">删除书目</button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Book } from '@teacher-exam/types';
import { bookCoverPalette } from '../../data/library';
import { useLibraryStore } from '../../stores/library';

const store = useLibraryStore();
const palette = bookCoverPalette;

const sheetVisible = ref(false);
const editingId = ref('');
const formTitle = ref('');
const formAuthor = ref('');
const formColor = ref(palette[0]);

const isEditing = computed(() => editingId.value !== '');

function openBook(book: Book) {
    uni.navigateTo({
        url: `/pages/mindmap/index?bookId=${book.id}&title=${encodeURIComponent(book.title)}`
    });
}

function openCreate() {
    editingId.value = '';
    formTitle.value = '';
    formAuthor.value = '';
    formColor.value = palette[store.orderedBooks.length % palette.length];
    sheetVisible.value = true;
}

function openEdit(book: Book) {
    editingId.value = book.id;
    formTitle.value = book.title;
    formAuthor.value = book.author ?? '';
    formColor.value = book.coverColor;
    sheetVisible.value = true;
}

function closeSheet() {
    sheetVisible.value = false;
}

function saveBook() {
    if (!formTitle.value.trim()) {
        uni.showToast({ title: '请先填写书名', icon: 'none' });
        return;
    }

    if (editingId.value) {
        store.updateBook(editingId.value, {
            title: formTitle.value,
            author: formAuthor.value,
            coverColor: formColor.value
        });
        uni.showToast({ title: '已保存', icon: 'success' });
    } else {
        store.addBook({
            title: formTitle.value,
            author: formAuthor.value,
            coverColor: formColor.value
        });
        uni.showToast({ title: '已新增书目', icon: 'success' });
    }

    sheetVisible.value = false;
}

function confirmRemove() {
    const id = editingId.value;
    if (!id) {
        return;
    }

    uni.showModal({
        title: '删除书目',
        content: '删除后该书的思维导图也会一并清除，确定继续吗？',
        success: (result) => {
            if (result.confirm) {
                store.removeBook(id);
                sheetVisible.value = false;
                uni.showToast({ title: '已删除', icon: 'success' });
            }
        }
    });
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 32rpx 32rpx 60rpx;
}

.header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 32rpx;
    border-radius: 32rpx;
    background: #fff;
}

.eyebrow {
    color: #0f766e;
    font-size: 24rpx;
    font-weight: 700;
}

.title {
    display: block;
    margin-top: 12rpx;
    font-size: 38rpx;
    font-weight: 800;
}

.desc {
    display: block;
    margin-top: 12rpx;
    color: #6b7280;
    font-size: 24rpx;
}

.add-button {
    flex-shrink: 0;
    margin-left: 20rpx;
    padding: 0 24rpx;
    height: 64rpx;
    line-height: 64rpx;
    border-radius: 999rpx;
    background: #0f766e;
    color: #fff;
    font-size: 24rpx;
}

.shelf {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
    margin-top: 28rpx;
}

.book {
    width: calc((100% - 48rpx) / 3);
}

.book-hover {
    opacity: 0.85;
}

.cover {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 280rpx;
    padding: 20rpx 18rpx;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 12rpx 30rpx rgba(31, 41, 51, 0.16);
}

.spine {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 10rpx;
    background: rgba(255, 255, 255, 0.32);
}

.cover-title {
    margin-left: 10rpx;
    color: #fff;
    font-size: 30rpx;
    font-weight: 800;
    line-height: 1.3;
}

.cover-author {
    margin: 8rpx 0 0 10rpx;
    color: rgba(255, 255, 255, 0.82);
    font-size: 20rpx;
}

.cover-count {
    margin-top: auto;
    margin-left: 10rpx;
    color: rgba(255, 255, 255, 0.92);
    font-size: 20rpx;
}

.book-name {
    display: block;
    margin-top: 12rpx;
    font-size: 24rpx;
    font-weight: 600;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.empty {
    width: 100%;
    padding: 60rpx 32rpx;
    border-radius: 28rpx;
    background: #fff;
    color: #6b7280;
    text-align: center;
    font-size: 26rpx;
}

.hint {
    margin-top: 28rpx;
    color: #9ca3af;
    font-size: 22rpx;
}

.sheet-mask {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.38);
}

.sheet {
    width: 100%;
    padding: 36rpx 36rpx 140rpx;
    border-radius: 36rpx 36rpx 0 0;
    background: #fff;
}

.sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sheet-title {
    font-size: 34rpx;
    font-weight: 800;
}

.icon-button {
    width: 64rpx;
    height: 64rpx;
    line-height: 64rpx;
    border-radius: 50%;
    background: #f3f4f6;
    color: #1f2933;
    font-size: 32rpx;
}

.field-label {
    display: block;
    margin: 24rpx 0 12rpx;
    color: #6b7280;
    font-size: 24rpx;
}

.field-input {
    padding: 22rpx;
    border-radius: 20rpx;
    background: #f3f4f6;
    font-size: 28rpx;
}

.swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.swatch {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    border: 4rpx solid transparent;
}

.swatch.active {
    border-color: #1f2933;
}

.primary-button {
    margin-top: 32rpx;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 999rpx;
    background: #0f766e;
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
}

.danger-button {
    margin-top: 16rpx;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 999rpx;
    background: #fee2e2;
    color: #b91c1c;
    font-size: 26rpx;
}
</style>
