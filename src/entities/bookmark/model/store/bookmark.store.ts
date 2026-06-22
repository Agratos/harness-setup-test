import { create } from 'zustand';

import { createStoreWithDevtool } from '@/shared/lib/zustand';

import type { Bookmark, BookmarkInput } from '../types/bookmark.types';

// ---------------------------------------------------------------------------
// 셀렉터 헬퍼 — 순수 함수, store 밖에서 독립적으로 export (테스트·재사용 용이)
// ---------------------------------------------------------------------------

/** 모든 북마크에서 태그를 수집해 중복 제거 후 알파벳·가나다 순 정렬한다 */
export function selectAllTags(bookmarks: Bookmark[]): string[] {
	const tagSet = new Set<string>();
	for (const b of bookmarks) {
		for (const t of b.tags) {
			tagSet.add(t);
		}
	}
	return [...tagSet].sort((a, b) => a.localeCompare(b, 'ko'));
}

/** 필터 옵션 */
export type BookmarkFilter = {
	tag?: string;
	query?: string;
	favoriteOnly?: boolean;
};

/**
 * 북마크 목록을 필터링한다.
 * - query: title + url 부분일치 (대소문자 무시)
 * - tag: 태그 배열에 정확히 포함된 것만
 * - favoriteOnly: favorite === true 인 것만
 */
export function filterBookmarks(bookmarks: Bookmark[], filter: BookmarkFilter): Bookmark[] {
	const { tag, query, favoriteOnly } = filter;
	return bookmarks.filter((b) => {
		if (favoriteOnly && !b.favorite) return false;
		if (tag !== undefined && !b.tags.includes(tag)) return false;
		if (query !== undefined && query !== '') {
			const q = query.toLowerCase();
			if (!b.title.toLowerCase().includes(q) && !b.url.toLowerCase().includes(q)) return false;
		}
		return true;
	});
}

/** 전체 북마크 수와 즐겨찾기 수를 반환한다 */
export function countStats(bookmarks: Bookmark[]): { total: number; favorite: number } {
	return {
		total: bookmarks.length,
		favorite: bookmarks.filter((b) => b.favorite).length,
	};
}

// ---------------------------------------------------------------------------
// Store — 프로젝트 표준 헬퍼(createStoreWithDevtool)로 생성.
// persist(localStorage, key 'bookmark-store') + partialize 로 데이터(bookmarks)만 저장
// (액션 함수는 직렬화 제외 — rehydrate 후 creator 최신 구현 사용). ADR-001 결정 2 준수.
// set(partial, actionName) 의 두 번째 인자는 devtools 타임라인 라벨(`bookmark-store/<action>`).
// ---------------------------------------------------------------------------

type BookmarkState = {
	bookmarks: Bookmark[];
	add: (input: BookmarkInput) => void;
	remove: (id: string) => void;
	toggleFavorite: (id: string) => void;
	clear: () => void;
};

export const useBookmarkStore = create<BookmarkState>()(
	createStoreWithDevtool<BookmarkState>(
		(set) => ({
			bookmarks: [],

			/** 새 북마크를 맨 앞에 추가한다 (id·createdAt 자동 생성, favorite 기본 false) */
			add: (input: BookmarkInput) =>
				set(
					(state) => ({
						bookmarks: [
							{
								id: crypto.randomUUID(),
								title: input.title,
								url: input.url,
								tags: input.tags,
								favorite: false,
								createdAt: new Date().toISOString(),
							},
							...state.bookmarks,
						],
					}),
					'add',
				),

			/** id 에 해당하는 북마크를 삭제한다 */
			remove: (id: string) =>
				set(
					(state) => ({
						bookmarks: state.bookmarks.filter((b) => b.id !== id),
					}),
					'remove',
				),

			/** 즐겨찾기 상태를 토글한다 */
			toggleFavorite: (id: string) =>
				set(
					(state) => ({
						bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b)),
					}),
					'toggleFavorite',
				),

			/** 전체 북마크를 초기화한다 */
			clear: () => set({ bookmarks: [] }, 'clear'),
		}),
		'bookmark-store',
		{ persist: true, storage: 'local', key: 'bookmark-store', partialize: ['bookmarks'] },
	),
);
