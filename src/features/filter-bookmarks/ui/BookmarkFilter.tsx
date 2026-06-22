import { Checkbox, Chip, Group, Stack, Text, TextInput } from '@mantine/core';

import type { Bookmark } from '@/entities/bookmark';
import { countStats, selectAllTags } from '@/entities/bookmark';

import { useFilterStore } from '../model/filter.store';

type BookmarkFilterProps = {
	bookmarks: Bookmark[];
};

export const BookmarkFilter = ({ bookmarks }: BookmarkFilterProps) => {
	const query = useFilterStore((s) => s.query);
	const tag = useFilterStore((s) => s.tag);
	const favoriteOnly = useFilterStore((s) => s.favoriteOnly);
	const setQuery = useFilterStore((s) => s.setQuery);
	const setTag = useFilterStore((s) => s.setTag);
	const toggleFavoriteOnly = useFilterStore((s) => s.toggleFavoriteOnly);

	const allTags = selectAllTags(bookmarks);
	const stats = countStats(bookmarks);

	const handleChipChange = (value: string) => {
		setTag(value === '전체' ? null : value);
	};

	const chipValue = tag ?? '전체';

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				전체 {stats.total} · 즐겨찾기 {stats.favorite}
			</Text>
			<TextInput
				label="검색"
				placeholder="제목 또는 URL 검색"
				value={query}
				onChange={(e) => setQuery(e.currentTarget.value)}
			/>
			{allTags.length > 0 && (
				<Chip.Group multiple={false} value={chipValue} onChange={handleChipChange}>
					<Group gap="xs">
						<Chip value="전체">전체</Chip>
						{allTags.map((t) => (
							<Chip key={t} value={t}>
								{t}
							</Chip>
						))}
					</Group>
				</Chip.Group>
			)}
			<Checkbox
				label="즐겨찾기만"
				checked={favoriteOnly}
				onChange={() => toggleFavoriteOnly()}
			/>
		</Stack>
	);
};
