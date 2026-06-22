import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFilterStore } from '../model/filter.store';

import { BookmarkFilter } from './BookmarkFilter';

const Wrapper = ({ children }: { children: ReactNode }) => (
	<MantineProvider>{children}</MantineProvider>
);

const sampleBookmarks = [
	{
		id: '1',
		title: 'React 공식',
		url: 'https://react.dev',
		tags: ['react', 'frontend'],
		favorite: true,
		createdAt: new Date().toISOString(),
	},
	{
		id: '2',
		title: 'TypeScript 핸드북',
		url: 'https://typescriptlang.org',
		tags: ['typescript'],
		favorite: false,
		createdAt: new Date().toISOString(),
	},
];

describe('BookmarkFilter', () => {
	beforeEach(() => {
		useFilterStore.getState().reset();
	});

	it('검색 입력창이 렌더된다', () => {
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });
		expect(screen.getByLabelText('검색')).toBeInTheDocument();
	});

	it('통계 텍스트가 표시된다', () => {
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });
		expect(screen.getByText(/전체 2/)).toBeInTheDocument();
		expect(screen.getByText(/즐겨찾기 1/)).toBeInTheDocument();
	});

	it('태그 칩들이 렌더된다', () => {
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });
		expect(screen.getByText('전체')).toBeInTheDocument();
		expect(screen.getByText('frontend')).toBeInTheDocument();
		expect(screen.getByText('react')).toBeInTheDocument();
		expect(screen.getByText('typescript')).toBeInTheDocument();
	});

	it('검색어 입력 시 store query 가 업데이트된다', async () => {
		const user = userEvent.setup();
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });

		const input = screen.getByLabelText('검색');
		await user.type(input, 'react');

		expect(useFilterStore.getState().query).toBe('react');
	});

	it('즐겨찾기만 체크박스가 렌더되고 클릭 시 토글된다', async () => {
		const user = userEvent.setup();
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });

		const checkbox = screen.getByRole('checkbox', { name: '즐겨찾기만' });
		expect(checkbox).not.toBeChecked();

		await user.click(checkbox);
		expect(useFilterStore.getState().favoriteOnly).toBe(true);
	});

	it('태그 칩 클릭 시 store tag 가 업데이트된다', async () => {
		const user = userEvent.setup();
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });

		const reactChip = screen.getByText('react');
		await user.click(reactChip);

		expect(useFilterStore.getState().tag).toBe('react');
	});

	it('"전체" 칩 클릭 시 tag 가 null 로 초기화된다', async () => {
		const user = userEvent.setup();
		useFilterStore.getState().setTag('react');
		render(<BookmarkFilter bookmarks={sampleBookmarks} />, { wrapper: Wrapper });

		const allChip = screen.getByText('전체');
		await user.click(allChip);

		expect(useFilterStore.getState().tag).toBeNull();
	});
});
