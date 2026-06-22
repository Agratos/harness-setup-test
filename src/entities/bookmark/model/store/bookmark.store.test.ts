import { beforeEach, describe, expect, it } from 'vitest';

import { countStats, filterBookmarks, selectAllTags, useBookmarkStore } from './bookmark.store';

// ---------------------------------------------------------------------------
// 스토어 초기화 헬퍼
// ---------------------------------------------------------------------------
beforeEach(() => {
	useBookmarkStore.setState({ bookmarks: [] });
});

// ---------------------------------------------------------------------------
// store actions
// ---------------------------------------------------------------------------
describe('useBookmarkStore — add', () => {
	it('새 항목을 맨 앞에 삽입한다', () => {
		useBookmarkStore.getState().add({ title: '첫 번째', url: 'https://first.com', tags: [] });
		useBookmarkStore.getState().add({ title: '두 번째', url: 'https://second.com', tags: [] });

		const { bookmarks } = useBookmarkStore.getState();
		expect(bookmarks[0].title).toBe('두 번째');
		expect(bookmarks[1].title).toBe('첫 번째');
	});

	it('favorite 기본값은 false 다', () => {
		useBookmarkStore.getState().add({ title: 'Test', url: 'https://test.com', tags: [] });
		const { bookmarks } = useBookmarkStore.getState();
		expect(bookmarks[0].favorite).toBe(false);
	});

	it('id 와 createdAt 을 자동 생성한다', () => {
		useBookmarkStore.getState().add({ title: 'Auto', url: 'https://auto.com', tags: [] });
		const { bookmarks } = useBookmarkStore.getState();
		expect(bookmarks[0].id).toBeTruthy();
		expect(bookmarks[0].createdAt).toBeTruthy();
	});
});

describe('useBookmarkStore — remove', () => {
	it('id 에 해당하는 항목을 삭제한다', () => {
		useBookmarkStore.getState().add({ title: 'A', url: 'https://a.com', tags: [] });
		useBookmarkStore.getState().add({ title: 'B', url: 'https://b.com', tags: [] });

		const { bookmarks } = useBookmarkStore.getState();
		const idToRemove = bookmarks[0].id; // 'B' (맨 앞)

		useBookmarkStore.getState().remove(idToRemove);

		const after = useBookmarkStore.getState().bookmarks;
		expect(after).toHaveLength(1);
		expect(after[0].title).toBe('A');
	});
});

describe('useBookmarkStore — toggleFavorite', () => {
	it('false → true → false 왕복 토글된다', () => {
		useBookmarkStore.getState().add({ title: 'Toggle', url: 'https://toggle.com', tags: [] });
		const id = useBookmarkStore.getState().bookmarks[0].id;

		useBookmarkStore.getState().toggleFavorite(id);
		expect(useBookmarkStore.getState().bookmarks[0].favorite).toBe(true);

		useBookmarkStore.getState().toggleFavorite(id);
		expect(useBookmarkStore.getState().bookmarks[0].favorite).toBe(false);
	});
});

describe('useBookmarkStore — clear', () => {
	it('모든 북마크를 초기화한다', () => {
		useBookmarkStore.getState().add({ title: 'X', url: 'https://x.com', tags: [] });
		useBookmarkStore.getState().clear();
		expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 셀렉터 헬퍼
// ---------------------------------------------------------------------------
const FIXTURES = [
	{
		id: '1',
		title: 'React 공식 문서',
		url: 'https://react.dev',
		tags: ['react', 'frontend'],
		favorite: true,
		createdAt: '2026-01-01T00:00:00Z',
	},
	{
		id: '2',
		title: 'Zustand GitHub',
		url: 'https://github.com/pmndrs/zustand',
		tags: ['react', 'state'],
		favorite: false,
		createdAt: '2026-01-02T00:00:00Z',
	},
	{
		id: '3',
		title: 'Vite 문서',
		url: 'https://vitejs.dev',
		tags: ['bundler', 'frontend'],
		favorite: false,
		createdAt: '2026-01-03T00:00:00Z',
	},
];

describe('filterBookmarks', () => {
	it('tag 로 정확 일치 필터링한다', () => {
		const result = filterBookmarks(FIXTURES, { tag: 'react' });
		expect(result).toHaveLength(2);
		expect(result.every((b) => b.tags.includes('react'))).toBe(true);
	});

	it('query 로 title+url 부분일치(대소문자 무시)한다', () => {
		const result = filterBookmarks(FIXTURES, { query: 'REACT' });
		// 'react' 가 id1 의 title('React 공식 문서')·url('react.dev')에 포함 — 대문자 쿼리로도 매칭(대소문자 무시).
		// id2(Zustand)·id3(Vite)는 title·url 어디에도 'react' 텍스트가 없어 제외된다.
		expect(result.map((b) => b.id)).toEqual(['1']);
	});

	it('favoriteOnly 로 favorite===true 만 필터링한다', () => {
		const result = filterBookmarks(FIXTURES, { favoriteOnly: true });
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('tag + favoriteOnly 조합 필터링한다', () => {
		const result = filterBookmarks(FIXTURES, { tag: 'react', favoriteOnly: true });
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('query + tag 조합 필터링한다', () => {
		// 'frontend' 태그 중 url 에 'react' 포함
		const result = filterBookmarks(FIXTURES, { tag: 'frontend', query: 'react' });
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('빈 배열에서도 오류 없이 빈 결과를 반환한다', () => {
		expect(filterBookmarks([], { tag: 'react' })).toHaveLength(0);
	});
});

describe('selectAllTags', () => {
	it('중복을 제거하고 정렬한 태그 배열을 반환한다', () => {
		const tags = selectAllTags(FIXTURES);
		// 고유 태그: bundler, frontend, react, state
		expect(tags).toEqual(['bundler', 'frontend', 'react', 'state']);
	});

	it('빈 배열에서는 빈 태그 배열을 반환한다', () => {
		expect(selectAllTags([])).toEqual([]);
	});
});

describe('countStats', () => {
	it('전체 수와 즐겨찾기 수를 반환한다', () => {
		const stats = countStats(FIXTURES);
		expect(stats.total).toBe(3);
		expect(stats.favorite).toBe(1);
	});

	it('빈 배열이면 모두 0이다', () => {
		expect(countStats([])).toEqual({ total: 0, favorite: 0 });
	});
});
