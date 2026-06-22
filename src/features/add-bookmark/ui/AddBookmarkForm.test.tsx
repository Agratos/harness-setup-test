import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useBookmarkStore } from '@/entities/bookmark';

import { AddBookmarkForm } from '@/features/add-bookmark';

const Wrapper = ({ children }: { children: ReactNode }) => (
	<MantineProvider>{children}</MantineProvider>
);

describe('AddBookmarkForm', () => {
	it('입력 후 추가 클릭 시 북마크가 스토어에 추가되고 입력이 비워진다', async () => {
		// 스토어 초기화
		useBookmarkStore.setState({ bookmarks: [] });

		const user = userEvent.setup();
		render(<AddBookmarkForm />, { wrapper: Wrapper });

		const titleInput = screen.getByLabelText('제목');
		const urlInput = screen.getByLabelText('URL');
		const submitButton = screen.getByRole('button', { name: '추가' });

		await user.type(titleInput, '테스트 북마크');
		await user.type(urlInput, 'https://example.com');
		await user.click(submitButton);

		await waitFor(() => {
			const { bookmarks } = useBookmarkStore.getState();
			expect(bookmarks).toHaveLength(1);
			expect(bookmarks[0].title).toBe('테스트 북마크');
			expect(bookmarks[0].url).toBe('https://example.com');
		});

		// 폼이 리셋되어 입력이 비워졌는지 확인
		expect((titleInput as HTMLInputElement).value).toBe('');
		expect((urlInput as HTMLInputElement).value).toBe('');
	});

	it('제목 없이 제출하면 인라인 에러가 표시된다', async () => {
		useBookmarkStore.setState({ bookmarks: [] });

		const user = userEvent.setup();
		render(<AddBookmarkForm />, { wrapper: Wrapper });

		const urlInput = screen.getByLabelText('URL');
		const submitButton = screen.getByRole('button', { name: '추가' });

		await user.type(urlInput, 'https://example.com');
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('제목을 입력해 주세요.')).toBeInTheDocument();
		});
	});
});
