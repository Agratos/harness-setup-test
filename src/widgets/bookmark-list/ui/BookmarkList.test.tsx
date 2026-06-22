import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useBookmarkStore } from '@/entities/bookmark';

import { useFilterStore } from '@/features/filter-bookmarks';

import { BookmarkList } from '@/widgets/bookmark-list';

const Wrapper = ({ children }: { children: ReactNode }) => (
	<MantineProvider>{children}</MantineProvider>
);

const seedBookmark = () => {
	useBookmarkStore.setState({
		bookmarks: [
			{
				id: 'test-id-1',
				title: '테스트 북마크',
				url: 'https://example.com',
				tags: ['react', 'test'],
				favorite: false,
				createdAt: new Date().toISOString(),
			},
		],
	});
};

describe('BookmarkList', () => {
	beforeEach(() => {
		useFilterStore.getState().reset();
	});

	it('빈 목록이면 안내 문구를 표시한다', () => {
		useBookmarkStore.setState({ bookmarks: [] });
		render(<BookmarkList />, { wrapper: Wrapper });
		expect(screen.getByText('아직 북마크가 없습니다')).toBeInTheDocument();
	});

	it('북마크 카드가 제목·URL·태그와 함께 렌더된다', () => {
		seedBookmark();
		render(<BookmarkList />, { wrapper: Wrapper });

		expect(screen.getByText('테스트 북마크')).toBeInTheDocument();
		expect(screen.getByText('https://example.com')).toBeInTheDocument();
		expect(screen.getByText('react')).toBeInTheDocument();
		expect(screen.getByText('test')).toBeInTheDocument();
	});

	it('삭제 버튼 클릭 시 해당 북마크가 제거된다', async () => {
		seedBookmark();
		const user = userEvent.setup();
		render(<BookmarkList />, { wrapper: Wrapper });

		const deleteButton = screen.getByRole('button', { name: '삭제' });
		await user.click(deleteButton);

		expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
	});

	it('즐겨찾기 버튼 클릭 시 favorite 상태가 토글된다', async () => {
		seedBookmark();
		const user = userEvent.setup();
		render(<BookmarkList />, { wrapper: Wrapper });

		expect(useBookmarkStore.getState().bookmarks[0].favorite).toBe(false);

		const favButton = screen.getByRole('button', { name: '즐겨찾기' });
		await user.click(favButton);

		expect(useBookmarkStore.getState().bookmarks[0].favorite).toBe(true);
	});
});
