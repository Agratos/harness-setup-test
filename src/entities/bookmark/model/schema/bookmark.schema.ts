import { z } from 'zod';

/**
 * 북마크 입력 검증 스키마.
 * - title: 공백 trim 후 1자 이상
 * - url: http/https URL 형식 (zod v4 z.string().url())
 * - tags: string 배열 (기본값 [])
 */
export const bookmarkInputSchema = z.object({
	title: z.string().trim().min(1, '제목을 입력해 주세요.'),
	url: z.string().url('올바른 URL 형식(http/https)을 입력해 주세요.'),
	tags: z.array(z.string()).default([]),
});

export type BookmarkInputSchema = z.infer<typeof bookmarkInputSchema>;
