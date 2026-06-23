import type { BookNode, BookTreeNode, UUID } from '@teacher-exam/types';

export function buildBookTree(nodes: BookNode[]): BookTreeNode[] {
    const map = new Map<UUID, BookTreeNode>();

    nodes.forEach((node) => {
        map.set(node.id, { ...node, children: [] });
    });

    const roots: BookTreeNode[] = [];

    map.forEach((node) => {
        const parent = node.parentId ? map.get(node.parentId) : undefined;
        if (parent) {
            parent.children.push(node);
            return;
        }

        roots.push(node);
    });

    const sortBranch = (branch: BookTreeNode[]) => {
        branch.sort((a, b) => a.orderIndex - b.orderIndex);
        branch.forEach((node) => sortBranch(node.children));
    };

    sortBranch(roots);
    return roots;
}

export function collectSubtreeIds(nodes: BookNode[], rootId: UUID): UUID[] {
    const childrenByParent = new Map<UUID, BookNode[]>();

    nodes.forEach((node) => {
        if (!node.parentId) {
            return;
        }

        const siblings = childrenByParent.get(node.parentId) ?? [];
        siblings.push(node);
        childrenByParent.set(node.parentId, siblings);
    });

    const result: UUID[] = [];
    const stack: UUID[] = [rootId];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
            continue;
        }

        result.push(current);
        const children = childrenByParent.get(current) ?? [];
        children.forEach((child) => stack.push(child.id));
    }

    return result;
}

export function nextOrderIndex(nodes: BookNode[], parentId: UUID | null): number {
    const siblings = nodes.filter((node) => node.parentId === parentId);
    if (siblings.length === 0) {
        return 1;
    }

    return Math.max(...siblings.map((node) => node.orderIndex)) + 1;
}

export function isBookRootNode(node: BookNode): boolean {
    return node.parentId === null;
}
