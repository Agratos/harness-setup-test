import { beforeEach, describe, expect, it } from 'vitest';

import { useFilterStore } from './filter.store';

describe('useFilterStore', () => {
	beforeEach(() => {
		useFilterStore.getState().reset();
	});

	it('초기 상태가 올바르다', () => {
		const state = useFilterStore.getState();
		expect(state.query).toBe('');
		expect(state.tag).toBeNull();
		expect(state.favoriteOnly).toBe(false);
	});

	it('setQuery 로 검색어를 변경한다', () => {
		useFilterStore.getState().setQuery('react');
		expect(useFilterStore.getState().query).toBe('react');
	});

	it('setTag 로 태그 필터를 변경한다', () => {
		useFilterStore.getState().setTag('typescript');
		expect(useFilterStore.getState().tag).toBe('typescript');
	});

	it('setTag(null) 로 태그 필터를 해제한다', () => {
		useFilterStore.getState().setTag('typescript');
		useFilterStore.getState().setTag(null);
		expect(useFilterStore.getState().tag).toBeNull();
	});

	it('toggleFavoriteOnly 로 즐겨찾기만 토글한다', () => {
		expect(useFilterStore.getState().favoriteOnly).toBe(false);
		useFilterStore.getState().toggleFavoriteOnly();
		expect(useFilterStore.getState().favoriteOnly).toBe(true);
		useFilterStore.getState().toggleFavoriteOnly();
		expect(useFilterStore.getState().favoriteOnly).toBe(false);
	});

	it('reset 으로 모든 상태를 초기화한다', () => {
		useFilterStore.getState().setQuery('검색어');
		useFilterStore.getState().setTag('react');
		useFilterStore.getState().toggleFavoriteOnly();

		useFilterStore.getState().reset();

		const state = useFilterStore.getState();
		expect(state.query).toBe('');
		expect(state.tag).toBeNull();
		expect(state.favoriteOnly).toBe(false);
	});
});
