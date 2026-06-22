import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { BookmarkInput } from '@/entities/bookmark';
import { bookmarkInputSchema } from '@/entities/bookmark';

export const useAddBookmarkForm = () => {
	return useForm<BookmarkInput>({
		initialValues: {
			title: '',
			url: '',
			tags: [],
		},
		validate: zod4Resolver(bookmarkInputSchema),
	});
};
