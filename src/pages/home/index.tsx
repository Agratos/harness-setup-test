import { Container, Stack, Title } from '@mantine/core';

import { AddBookmarkForm } from '@/features/add-bookmark';

import { BookmarkList } from '@/widgets/bookmark-list';

/**
 * page = 라우트 단위 화면. feature/widget 을 조립만 하고 비즈니스 로직을 갖지 않는다.
 */
export const HomePage = () => {
	return (
		<Container size="sm" py="xl">
			<Stack gap="lg">
				<Title order={2}>북마크 관리</Title>
				<AddBookmarkForm />
				<BookmarkList />
			</Stack>
		</Container>
	);
};
