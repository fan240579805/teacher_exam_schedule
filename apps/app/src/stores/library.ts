import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Book, BookNode, CreateBookInput, UpsertBookNodeInput } from '@teacher-exam/types';
import { buildBookTree, collectSubtreeIds, nextOrderIndex } from '@teacher-exam/core';
import { bookCoverPalette, mockBookNodes, mockBooks } from '../data/library';
import { mockWorkspace } from '../data/mock';

const BOOKS_KEY = 'teacher-exam:books';
const NODES_KEY = 'teacher-exam:book-nodes';

export const useLibraryStore = defineStore('library', () => {
    const books = ref<Book[]>(restoreBooks());
    const bookNodes = ref<BookNode[]>(restoreBookNodes());

    const orderedBooks = computed(() => [...books.value].sort((a, b) => a.orderIndex - b.orderIndex));

    function getBook(bookId: string): Book | null {
        return books.value.find((book) => book.id === bookId) ?? null;
    }

    function nodesOfBook(bookId: string): BookNode[] {
        return bookNodes.value.filter((node) => node.bookId === bookId);
    }

    function bookTree(bookId: string) {
        return buildBookTree(nodesOfBook(bookId));
    }

    function nodeCount(bookId: string): number {
        return nodesOfBook(bookId).length;
    }

    function rootNode(bookId: string): BookNode | null {
        return nodesOfBook(bookId).find((node) => node.parentId === null) ?? null;
    }

    function addBook(input: CreateBookInput): Book {
        const timestamp = new Date().toISOString();
        const id = `book-${Date.now()}`;
        const title = input.title.trim() || '未命名书目';
        const coverColor = input.coverColor ?? bookCoverPalette[books.value.length % bookCoverPalette.length];

        const book: Book = {
            id,
            workspaceId: mockWorkspace.id,
            title,
            author: input.author?.trim() || null,
            coverColor,
            orderIndex: nextBookOrderIndex(),
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const root: BookNode = {
            id: `${id}-root`,
            bookId: id,
            parentId: null,
            title,
            subtitle: '备考主线',
            orderIndex: 1,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        books.value = [...books.value, book];
        bookNodes.value = [...bookNodes.value, root];
        persist();
        return book;
    }

    function updateBook(bookId: string, patch: Partial<Pick<Book, 'title' | 'author' | 'coverColor'>>) {
        const timestamp = new Date().toISOString();
        books.value = books.value.map((book) => {
            if (book.id !== bookId) {
                return book;
            }

            return {
                ...book,
                title: patch.title?.trim() ? patch.title.trim() : book.title,
                author: patch.author === undefined ? book.author : (patch.author?.trim() || null),
                coverColor: patch.coverColor ?? book.coverColor,
                updatedAt: timestamp
            };
        });
        persist();
    }

    function removeBook(bookId: string) {
        books.value = books.value.filter((book) => book.id !== bookId);
        bookNodes.value = bookNodes.value.filter((node) => node.bookId !== bookId);
        persist();
    }

    function addNode(bookId: string, parentId: string, input: UpsertBookNodeInput): BookNode {
        const timestamp = new Date().toISOString();
        const node: BookNode = {
            id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bookId,
            parentId,
            title: input.title.trim() || '新节点',
            subtitle: input.subtitle?.trim() || null,
            orderIndex: nextOrderIndex(nodesOfBook(bookId), parentId),
            createdAt: timestamp,
            updatedAt: timestamp
        };

        bookNodes.value = [...bookNodes.value, node];
        persist();
        return node;
    }

    function updateNode(nodeId: string, input: UpsertBookNodeInput) {
        const timestamp = new Date().toISOString();
        bookNodes.value = bookNodes.value.map((node) => {
            if (node.id !== nodeId) {
                return node;
            }

            return {
                ...node,
                title: input.title.trim() || node.title,
                subtitle: input.subtitle?.trim() || null,
                updatedAt: timestamp
            };
        });
        persist();
    }

    function removeNode(nodeId: string): boolean {
        const target = bookNodes.value.find((node) => node.id === nodeId);
        if (!target || target.parentId === null) {
            return false;
        }

        const removeIds = new Set(collectSubtreeIds(nodesOfBook(target.bookId), nodeId));
        bookNodes.value = bookNodes.value.filter((node) => !removeIds.has(node.id));
        persist();
        return true;
    }

    function resetLibraryMock() {
        books.value = mockBooks.map((book) => ({ ...book }));
        bookNodes.value = mockBookNodes.map((node) => ({ ...node }));
        persist();
    }

    function nextBookOrderIndex(): number {
        if (books.value.length === 0) {
            return 1;
        }

        return Math.max(...books.value.map((book) => book.orderIndex)) + 1;
    }

    function persist() {
        uni.setStorageSync(BOOKS_KEY, books.value);
        uni.setStorageSync(NODES_KEY, bookNodes.value);
    }

    return {
        books,
        bookNodes,
        orderedBooks,
        getBook,
        nodesOfBook,
        bookTree,
        nodeCount,
        rootNode,
        addBook,
        updateBook,
        removeBook,
        addNode,
        updateNode,
        removeNode,
        resetLibraryMock
    };
});

function restoreBooks(): Book[] {
    const saved = uni.getStorageSync(BOOKS_KEY) as Book[] | '';
    return Array.isArray(saved) ? saved : mockBooks.map((book) => ({ ...book }));
}

function restoreBookNodes(): BookNode[] {
    const saved = uni.getStorageSync(NODES_KEY) as BookNode[] | '';
    return Array.isArray(saved) ? saved : mockBookNodes.map((node) => ({ ...node }));
}
