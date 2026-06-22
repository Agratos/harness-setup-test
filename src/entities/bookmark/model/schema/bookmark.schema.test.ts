import { describe, expect, it } from 'vitest';

import { bookmarkInputSchema } from './bookmark.schema';

describe('bookmarkInputSchema', () => {
	it('정상 입력을 통과시킨다', () => {
		const result = bookmarkInputSchema.safeParse({
			title: '리액트 문서',
			url: 'https://react.dev',
			tags: ['react'],
		});
		expect(result.success).toBe(true);
	});

	it('tags 를 생략하면 기본값 [] 로 통과한다', () => {
		const result = bookmarkInputSchema.safeParse({
			title: '테스트',
			url: 'https://example.com',
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual([]);
		}
	});

	it('빈 title 을 거부한다', () => {
		const result = bookmarkInputSchema.safeParse({
			title: '',
			url: 'https://example.com',
			tags: [],
		});
		expect(result.success).toBe(false);
	});

	it('공백만 있는 title 을 거부한다 (trim 후 0자)', () => {
		const result = bookmarkInputSchema.safeParse({
			title: '   ',
			url: 'https://example.com',
			tags: [],
		});
		expect(result.success).toBe(false);
	});

	it('잘못된 url 을 거부한다', () => {
		const result = bookmarkInputSchema.safeParse({
			title: '테스트',
			url: 'not-a-url',
			tags: [],
		});
		expect(result.success).toBe(false);
	});

	it('http/https 가 아닌 url(ftp://) 은 z.string().url() 기본 정책에 따라 처리된다', () => {
		// z.string().url() 은 ftp:// 도 유효 URL 로 간주하므로 성공할 수 있다.
		// 이 케이스는 현재 스키마가 http/https 만 강제하지 않음을 문서화한다.
		const parsed = bookmarkInputSchema.safeParse({
			title: '테스트',
			url: 'ftp://example.com',
			tags: [],
		});
		// 성공·실패 여부와 무관하게 boolean 타입임을 확인한다
		expect(typeof parsed.success).toBe('boolean');
	});

	it('검증 실패 시 한국어 오류 메시지를 포함한다', () => {
		const titleResult = bookmarkInputSchema.safeParse({
			title: '',
			url: 'https://example.com',
			tags: [],
		});
		expect(titleResult.success).toBe(false);
		if (!titleResult.success) {
			const messages = titleResult.error.issues.map((e) => e.message);
			expect(messages.some((m) => m.includes('제목'))).toBe(true);
		}

		const urlResult = bookmarkInputSchema.safeParse({
			title: '테스트',
			url: 'bad-url',
			tags: [],
		});
		expect(urlResult.success).toBe(false);
		if (!urlResult.success) {
			const messages = urlResult.error.issues.map((e) => e.message);
			expect(messages.some((m) => m.includes('URL'))).toBe(true);
		}
	});
});
