import type { KnowledgeLevel, KnowledgeNode, TreeNode, UUID } from '@teacher-exam/types';

export function buildTree(nodes: KnowledgeNode[]): TreeNode[] {
    const map = new Map<UUID, TreeNode>();

    nodes.forEach((node) => {
        map.set(node.id, { ...node, children: [] });
    });

    const roots: TreeNode[] = [];

    map.forEach((node) => {
        if (!node.parentId) {
            roots.push(node);
            return;
        }

        const parent = map.get(node.parentId);
        if (parent) {
            parent.children.push(node);
        }
    });

    const sortBranch = (branch: TreeNode[]) => {
        branch.sort((a, b) => a.orderIndex - b.orderIndex);
        branch.forEach((node) => sortBranch(node.children));
    };

    sortBranch(roots);
    return roots;
}

export function flattenTree(nodes: TreeNode[]): KnowledgeNode[] {
    return nodes.flatMap((node) => {
        const { children, ...plain } = node;
        return [plain, ...flattenTree(children)];
    });
}

export function getHomepageNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
    return nodes
        .filter((node) => node.level <= 3 && node.status !== 'archived')
        .sort((a, b) => a.level - b.level || a.orderIndex - b.orderIndex);
}

export function getSubtree(nodes: KnowledgeNode[], rootId: UUID): TreeNode | null {
    const root = nodes.find((node) => node.id === rootId);
    if (!root) {
        return null;
    }

    const collect = (parentId: UUID): KnowledgeNode[] => {
        const children = nodes.filter((node) => node.parentId === parentId);
        return children.flatMap((child) => [child, ...collect(child.id)]);
    };

    return buildTree([root, ...collect(rootId)])[0] ?? null;
}

export function canAddLeaf(parent: KnowledgeNode): boolean {
    return parent.level >= 4 && parent.level <= 6 && parent.status !== 'archived';
}

export function canDeleteLeaf(node: KnowledgeNode): boolean {
    return node.isLeaf && node.status !== 'done';
}

export function nextLevel(parent: KnowledgeNode): KnowledgeLevel {
    if (parent.level >= 7) {
        throw new Error('leaf nodes cannot have children');
    }

    return (parent.level + 1) as KnowledgeLevel;
}
