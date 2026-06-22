import { create } from 'zustand';

import { createStoreWithDevtool } from '@/shared/lib/zustand';

// ---------------------------------------------------------------------------
// 필터 스토어 — persist 불필요, 세션 내 상태만 관리
// ---------------------------------------------------------------------------

type FilterState = {
	query: string;
	tag: string | null;
	favoriteOnly: boolean;
	setQuery: (query: string) => void;
	setTag: (tag: string | null) => void;
	toggleFavoriteOnly: () => void;
	reset: () => void;
};

export const useFilterStore = create<FilterState>()(
	createStoreWithDevtool<FilterState>(
		(set) => ({
			query: '',
			tag: null,
			favoriteOnly: false,

			setQuery: (query: string) => set({ query }, 'setQuery'),

			setTag: (tag: string | null) => set({ tag }, 'setTag'),

			toggleFavoriteOnly: () =>
				set((state) => ({ favoriteOnly: !state.favoriteOnly }), 'toggleFavoriteOnly'),

			reset: () => set({ query: '', tag: null, favoriteOnly: false }, 'reset'),
		}),
		'filter-store',
	),
);
