/**
 * Types = 클라이언트가 실제로 쓰는 형태.
 * camelCase, boolean, ISO 날짜 등 프론트 친화적으로 정규화한다.
 * 컴포넌트/위젯/페이지는 항상 이 타입만 본다.
 */
export type Bookmark = {
	id: string;
	title: string;
	url: string;
	tags: string[];
	favorite: boolean;
	createdAt: string; // ISO
};

/** 북마크 생성 입력 타입 — id·favorite·createdAt 은 store 에서 자동 생성한다 */
export type BookmarkInput = {
	title: string;
	url: string;
	tags: string[];
};
