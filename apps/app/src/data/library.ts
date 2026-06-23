import type { Book, BookNode } from '@teacher-exam/types';
import { mockWorkspace } from './mock';

const now = '2026-06-22T08:00:00.000Z';

export const bookCoverPalette = [
    '#0f766e',
    '#b45309',
    '#4338ca',
    '#be123c',
    '#15803d',
    '#0369a1'
];

export const mockBooks: Book[] = [
    book({ id: 'book-edu-psy', title: '教育心理学', author: '陈琦 刘儒德', coverColor: '#0f766e', orderIndex: 1 }),
    book({ id: 'book-special', title: '特殊教育学', author: '朴永馨', coverColor: '#b45309', orderIndex: 2 }),
    book({ id: 'book-pedagogy', title: '教育学基础', author: '十二院校', coverColor: '#4338ca', orderIndex: 3 })
];

export const mockBookNodes: BookNode[] = [
    node({ id: 'book-edu-psy-root', bookId: 'book-edu-psy', parentId: null, title: '教育心理学', subtitle: '备考主线', orderIndex: 1 }),
    node({ id: 'edu-psy-intro', bookId: 'book-edu-psy', parentId: 'book-edu-psy-root', title: '绪论', subtitle: '学科性质与研究方法', orderIndex: 1 }),
    node({ id: 'edu-psy-intro-1', bookId: 'book-edu-psy', parentId: 'edu-psy-intro', title: '研究对象', subtitle: '学与教的相互作用', orderIndex: 1 }),
    node({ id: 'edu-psy-intro-2', bookId: 'book-edu-psy', parentId: 'edu-psy-intro', title: '历史发展', subtitle: '初创—发展—成熟', orderIndex: 2 }),
    node({ id: 'edu-psy-learn', bookId: 'book-edu-psy', parentId: 'book-edu-psy-root', title: '学习心理', subtitle: '高频核心模块', orderIndex: 2 }),
    node({ id: 'edu-psy-learn-1', bookId: 'book-edu-psy', parentId: 'edu-psy-learn', title: '行为主义', subtitle: '经典/操作性条件作用', orderIndex: 1 }),
    node({ id: 'edu-psy-learn-2', bookId: 'book-edu-psy', parentId: 'edu-psy-learn', title: '认知主义', subtitle: '信息加工模型', orderIndex: 2 }),
    node({ id: 'edu-psy-learn-3', bookId: 'book-edu-psy', parentId: 'edu-psy-learn', title: '建构主义', subtitle: '最近发展区', orderIndex: 3 }),
    node({ id: 'edu-psy-teach', bookId: 'book-edu-psy', parentId: 'book-edu-psy-root', title: '教学心理', subtitle: '动机与迁移', orderIndex: 3 }),

    node({ id: 'book-special-root', bookId: 'book-special', parentId: null, title: '特殊教育学', subtitle: '备考主线', orderIndex: 1 }),
    node({ id: 'special-overview', bookId: 'book-special', parentId: 'book-special-root', title: '概述', subtitle: '对象与基本概念', orderIndex: 1 }),
    node({ id: 'special-inclusive', bookId: 'book-special', parentId: 'book-special-root', title: '融合教育', subtitle: '随班就读政策', orderIndex: 2 }),

    node({ id: 'book-pedagogy-root', bookId: 'book-pedagogy', parentId: null, title: '教育学基础', subtitle: '备考主线', orderIndex: 1 }),
    node({ id: 'pedagogy-1', bookId: 'book-pedagogy', parentId: 'book-pedagogy-root', title: '教育与教育学', subtitle: '本质属性', orderIndex: 1 }),
    node({ id: 'pedagogy-2', bookId: 'book-pedagogy', parentId: 'book-pedagogy-root', title: '教育目的', subtitle: '价值取向', orderIndex: 2 })
];

function book(partial: Partial<Book>): Book {
    return {
        id: '',
        workspaceId: mockWorkspace.id,
        title: '',
        author: null,
        coverColor: '#0f766e',
        orderIndex: 1,
        createdAt: now,
        updatedAt: now,
        ...partial
    };
}

function node(partial: Partial<BookNode>): BookNode {
    return {
        id: '',
        bookId: '',
        parentId: null,
        title: '',
        subtitle: null,
        orderIndex: 1,
        createdAt: now,
        updatedAt: now,
        ...partial
    };
}
