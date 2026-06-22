import { ActionIcon, Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core';

import { filterBookmarks, useBookmarkStore } from '@/entities/bookmark';

import { useFilterStore } from '@/features/filter-bookmarks';

export const BookmarkList = () => {
	const bookmarks = useBookmarkStore((s) => s.bookmarks);
	const remove = useBookmarkStore((s) => s.remove);
	const toggleFavorite = useBookmarkStore((s) => s.toggleFavorite);

	const query = useFilterStore((s) => s.query);
	const tag = useFilterStore((s) => s.tag);
	const favoriteOnly = useFilterStore((s) => s.favoriteOnly);

	const filtered = filterBookmarks(bookmarks, {
		query: query || undefined,
		tag: tag ?? undefined,
		favoriteOnly,
	});

	if (bookmarks.length === 0) {
		return (
			<Text c="dimmed" ta="center" py="xl">
				아직 북마크가 없습니다
			</Text>
		);
	}

	if (filtered.length === 0) {
		return (
			<Text c="dimmed" ta="center" py="xl">
				조건에 맞는 북마크가 없습니다
			</Text>
		);
	}

	return (
		<Stack gap="sm">
			{filtered.map((bookmark) => (
				<Card key={bookmark.id} shadow="sm" padding="md" radius="md" withBorder>
					<Group justify="space-between" align="flex-start" wrap="nowrap">
						<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
							<Text fw={600} truncate>
								{bookmark.title}
							</Text>
							<Anchor
								href={bookmark.url}
								target="_blank"
								rel="noopener noreferrer"
								size="sm"
								truncate
							>
								{bookmark.url}
							</Anchor>
							{bookmark.tags.length > 0 && (
								<Group gap={4} mt={4}>
									{bookmark.tags.map((tagName) => (
										<Badge key={tagName} size="sm" variant="light">
											{tagName}
										</Badge>
									))}
								</Group>
							)}
						</Stack>
						<Group gap="xs" wrap="nowrap">
							<ActionIcon
								variant={bookmark.favorite ? 'filled' : 'subtle'}
								color="yellow"
								aria-label="즐겨찾기"
								onClick={() => toggleFavorite(bookmark.id)}
							>
								<span>★</span>
							</ActionIcon>
							<ActionIcon
								variant="subtle"
								color="red"
								aria-label="삭제"
								onClick={() => remove(bookmark.id)}
							>
								<span>✕</span>
							</ActionIcon>
						</Group>
					</Group>
				</Card>
			))}
		</Stack>
	);
};
