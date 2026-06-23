<template>
    <view class="page">
        <view class="toolbar">
            <view class="toolbar-text">
                <text class="book-title">{{ book?.title ?? '思维导图' }}</text>
                <text class="book-meta">{{ store.nodeCount(bookId) }} 个知识点 · 点击展开/收起，长按编辑</text>
            </view>
            <button class="branch-button" @click="addMainBranch">+ 主分支</button>
        </view>

        <scroll-view scroll-x scroll-y class="canvas" :show-scrollbar="false">
            <view class="stage" :style="{ width: layout.stageW + 'rpx', height: layout.stageH + 'rpx' }">
                <view
                    v-for="line in layout.connectors"
                    :key="line.key"
                    class="line"
                    :style="{ left: line.left + 'rpx', top: line.top + 'rpx', width: line.width + 'rpx', height: line.height + 'rpx' }"
                />
                <view
                    v-for="item in layout.nodeViews"
                    :key="item.id"
                    class="mnode"
                    :class="{ root: item.depth === 0, active: activeNodeId === item.id }"
                    hover-class="mnode-hover"
                    :style="{ left: item.left + 'rpx', top: item.top + 'rpx', width: NODE_W + 'rpx', height: NODE_H + 'rpx' }"
                    @click="onNodeTap(item)"
                    @longpress="openNodeSheet(item.node)"
                >
                    <text class="mnode-title">{{ item.node.title }}</text>
                    <text v-if="item.node.subtitle" class="mnode-subtitle">{{ item.node.subtitle }}</text>
                    <text v-if="item.hasChildren" class="mnode-badge">{{ item.collapsed ? '展开 ' + item.childCount : '收起' }}</text>
                </view>
            </view>
        </scroll-view>

        <view class="legend">
            <text>点击有子节点的卡片可展开/收起；点击叶子或长按任意节点进入编辑。</text>
        </view>

        <view v-if="sheetVisible" class="sheet-mask" @click="closeSheet">
            <view class="sheet" @click.stop>
                <view class="sheet-head">
                    <text class="sheet-title">编辑节点</text>
                    <button class="icon-button" @click="closeSheet">×</button>
                </view>

                <text class="field-label">主标题</text>
                <input v-model="editTitle" class="field-input" placeholder="例如：学习心理" />

                <text class="field-label">副标题（选填）</text>
                <input v-model="editSubtitle" class="field-input" placeholder="例如：高频核心模块" />

                <button class="primary-button" @click="saveNode">保存</button>

                <view class="action-row">
                    <button class="ghost-button" @click="addChild">新增子节点</button>
                    <button class="ghost-button" :disabled="activeIsRoot" @click="addSibling">新增同级节点</button>
                </view>

                <button v-if="!activeIsRoot" class="danger-button" @click="removeNode">删除节点及其子节点</button>
                <text v-else class="root-tip">根节点不可删除，可在书架中删除整本书。</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { BookTreeNode } from '@teacher-exam/types';
import { useLibraryStore } from '../../stores/library';

const NODE_W = 248;
const NODE_H = 140;
const STEP_X = 348;
const ROW_H = 184;
const PAD = 40;

const store = useLibraryStore();

const bookId = ref('');
const collapsedIds = ref<string[]>([]);
const activeNodeId = ref('');
const sheetVisible = ref(false);
const editTitle = ref('');
const editSubtitle = ref('');

const book = computed(() => (bookId.value ? store.getBook(bookId.value) : null));
const tree = computed(() => (bookId.value ? store.bookTree(bookId.value) : []));
const activeNode = computed(() => store.nodesOfBook(bookId.value).find((node) => node.id === activeNodeId.value) ?? null);
const activeIsRoot = computed(() => activeNode.value?.parentId === null);

interface NodeView {
    id: string;
    node: BookTreeNode;
    left: number;
    top: number;
    depth: number;
    hasChildren: boolean;
    collapsed: boolean;
    childCount: number;
}

interface Connector {
    key: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

const layout = computed(() => {
    const roots = tree.value;
    const positions = new Map<string, { depth: number; row: number }>();
    let rowCounter = 0;

    const place = (node: BookTreeNode, depth: number): number => {
        const collapsed = collapsedIds.value.includes(node.id);
        if (node.children.length === 0 || collapsed) {
            const row = rowCounter;
            rowCounter += 1;
            positions.set(node.id, { depth, row });
            return row;
        }

        const childRows = node.children.map((child) => place(child, depth + 1));
        const row = (childRows[0] + childRows[childRows.length - 1]) / 2;
        positions.set(node.id, { depth, row });
        return row;
    };

    roots.forEach((root) => place(root, 0));

    const visible: BookTreeNode[] = [];
    const collect = (node: BookTreeNode) => {
        visible.push(node);
        if (node.children.length > 0 && !collapsedIds.value.includes(node.id)) {
            node.children.forEach(collect);
        }
    };
    roots.forEach(collect);

    const positionOf = (id: string) => {
        const pos = positions.get(id);
        if (!pos) {
            return null;
        }

        return { left: PAD + pos.depth * STEP_X, top: PAD + pos.row * ROW_H };
    };

    const nodeViews: NodeView[] = visible.map((node) => {
        const pos = positions.get(node.id) ?? { depth: 0, row: 0 };
        return {
            id: node.id,
            node,
            left: PAD + pos.depth * STEP_X,
            top: PAD + pos.row * ROW_H,
            depth: pos.depth,
            hasChildren: node.children.length > 0,
            collapsed: collapsedIds.value.includes(node.id),
            childCount: node.children.length
        };
    });

    const connectors: Connector[] = [];
    visible.forEach((node) => {
        if (!node.parentId) {
            return;
        }

        const parent = positionOf(node.parentId);
        const child = positionOf(node.id);
        if (!parent || !child) {
            return;
        }

        const parentRight = parent.left + NODE_W;
        const parentCenter = parent.top + NODE_H / 2;
        const childCenter = child.top + NODE_H / 2;
        const midX = parentRight + (STEP_X - NODE_W) / 2;

        connectors.push({ key: `${node.id}-h1`, left: parentRight, top: parentCenter, width: midX - parentRight, height: 2 });
        connectors.push({ key: `${node.id}-v`, left: midX, top: Math.min(parentCenter, childCenter), width: 2, height: Math.abs(childCenter - parentCenter) });
        connectors.push({ key: `${node.id}-h2`, left: midX, top: childCenter, width: child.left - midX, height: 2 });
    });

    const stageW = Math.max(...nodeViews.map((view) => view.left + NODE_W), 0) + PAD;
    const stageH = Math.max(...nodeViews.map((view) => view.top + NODE_H), 0) + PAD;

    return { nodeViews, connectors, stageW, stageH };
});

onLoad((options) => {
    bookId.value = options?.bookId ?? '';
    const title = options?.title ? decodeURIComponent(options.title) : '思维导图';
    uni.setNavigationBarTitle({ title });
});

function onNodeTap(view: NodeView) {
    if (view.hasChildren) {
        toggleCollapse(view.id);
        return;
    }

    openNodeSheet(view.node);
}

function toggleCollapse(id: string) {
    if (collapsedIds.value.includes(id)) {
        collapsedIds.value = collapsedIds.value.filter((item) => item !== id);
        return;
    }

    collapsedIds.value = [...collapsedIds.value, id];
}

function expand(id: string) {
    collapsedIds.value = collapsedIds.value.filter((item) => item !== id);
}

function openNodeSheet(node: BookTreeNode) {
    activeNodeId.value = node.id;
    editTitle.value = node.title;
    editSubtitle.value = node.subtitle ?? '';
    sheetVisible.value = true;
}

function closeSheet() {
    sheetVisible.value = false;
    activeNodeId.value = '';
}

function saveNode() {
    if (!activeNodeId.value) {
        return;
    }

    if (!editTitle.value.trim()) {
        uni.showToast({ title: '主标题不能为空', icon: 'none' });
        return;
    }

    store.updateNode(activeNodeId.value, { title: editTitle.value, subtitle: editSubtitle.value });
    uni.showToast({ title: '已保存', icon: 'success' });
    closeSheet();
}

function addChild() {
    if (!activeNodeId.value) {
        return;
    }

    const parentId = activeNodeId.value;
    const created = store.addNode(bookId.value, parentId, { title: '新节点', subtitle: '' });
    expand(parentId);
    switchToNode(created.id, created.title, created.subtitle);
    uni.showToast({ title: '已新增子节点', icon: 'none' });
}

function addSibling() {
    const current = activeNode.value;
    if (!current || current.parentId === null) {
        uni.showToast({ title: '根节点无法新增同级', icon: 'none' });
        return;
    }

    const created = store.addNode(bookId.value, current.parentId, { title: '新节点', subtitle: '' });
    switchToNode(created.id, created.title, created.subtitle);
    uni.showToast({ title: '已新增同级节点', icon: 'none' });
}

function addMainBranch() {
    const root = store.rootNode(bookId.value);
    if (!root) {
        return;
    }

    const created = store.addNode(bookId.value, root.id, { title: '新分支', subtitle: '' });
    expand(root.id);
    switchToNode(created.id, created.title, created.subtitle);
    sheetVisible.value = true;
    uni.showToast({ title: '已新增主分支', icon: 'none' });
}

function removeNode() {
    const id = activeNodeId.value;
    if (!id) {
        return;
    }

    uni.showModal({
        title: '删除节点',
        content: '该节点及其全部子节点都会被删除，确定继续吗？',
        success: (result) => {
            if (result.confirm && store.removeNode(id)) {
                closeSheet();
                uni.showToast({ title: '已删除', icon: 'success' });
            }
        }
    });
}

function switchToNode(id: string, title: string, subtitle?: string | null) {
    activeNodeId.value = id;
    editTitle.value = title;
    editSubtitle.value = subtitle ?? '';
}
</script>

<style scoped>
.page {
    min-height: 100vh;
    padding: 24rpx 24rpx 60rpx;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 28rpx;
    border-radius: 28rpx;
    background: #fff;
}

.book-title {
    font-size: 32rpx;
    font-weight: 800;
}

.book-meta {
    display: block;
    margin-top: 6rpx;
    color: #6b7280;
    font-size: 22rpx;
}

.branch-button {
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

.canvas {
    margin-top: 24rpx;
    width: 100%;
    height: 68vh;
    border-radius: 28rpx;
    background: #fff;
    white-space: nowrap;
}

.stage {
    position: relative;
}

.line {
    position: absolute;
    background: #cbd5e1;
}

.mnode {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 14rpx 18rpx;
    border-radius: 18rpx;
    background: #f8fafc;
    box-shadow: 0 8rpx 22rpx rgba(31, 41, 51, 0.1);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mnode-hover {
    transform: scale(0.97);
    box-shadow: 0 4rpx 14rpx rgba(31, 41, 51, 0.16);
}

.mnode.root {
    background: #0f766e;
}

.mnode.active {
    box-shadow: 0 0 0 4rpx rgba(15, 118, 110, 0.5);
}

.mnode-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1f2933;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.mnode.root .mnode-title {
    color: #fff;
}

.mnode-subtitle {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: #6b7280;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.mnode.root .mnode-subtitle {
    color: rgba(255, 255, 255, 0.85);
}

.mnode-badge {
    margin-top: 8rpx;
    font-size: 20rpx;
    color: #0f766e;
}

.mnode.root .mnode-badge {
    color: rgba(255, 255, 255, 0.92);
}

.legend {
    margin-top: 24rpx;
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
    padding: 36rpx 36rpx 60rpx;
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

.action-row {
    display: flex;
    gap: 20rpx;
    margin-top: 20rpx;
}

.ghost-button {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 999rpx;
    background: #f0fdfa;
    color: #0f766e;
    font-size: 26rpx;
}

.ghost-button[disabled] {
    background: #f3f4f6;
    color: #9ca3af;
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

.root-tip {
    display: block;
    margin-top: 16rpx;
    color: #9ca3af;
    font-size: 22rpx;
    text-align: center;
}
</style>
