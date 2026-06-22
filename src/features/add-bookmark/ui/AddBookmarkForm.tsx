import { Button, TagsInput, TextInput } from '@mantine/core';

import { useBookmarkStore } from '@/entities/bookmark';

import { useAddBookmarkForm } from '../model/form';

export const AddBookmarkForm = () => {
	const add = useBookmarkStore((s) => s.add);
	const form = useAddBookmarkForm();

	const handleSubmit = form.onSubmit((values) => {
		add(values);
		form.reset();
	});

	return (
		<form onSubmit={handleSubmit}>
			<TextInput
				label="제목"
				placeholder="북마크 제목"
				{...form.getInputProps('title')}
				mb="sm"
			/>
			<TextInput
				label="URL"
				placeholder="https://example.com"
				{...form.getInputProps('url')}
				mb="sm"
			/>
			<TagsInput
				label="태그"
				placeholder="태그 입력 후 Enter"
				{...form.getInputProps('tags')}
				mb="md"
			/>
			<Button type="submit">추가</Button>
		</form>
	);
};
