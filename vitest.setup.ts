// vitest 전역 셋업 — @testing-library/jest-dom 매처를 vitest expect 에 등록합니다.
// vite.config.ts 의 test.setupFiles 가 매 테스트 파일 전에 이 파일을 로드합니다.
import '@testing-library/jest-dom/vitest';

// jsdom polyfill — Mantine(MantineProvider·Combobox 계열)이 사용하는 브라우저 API 가
// jsdom 에 없어 컴포넌트 테스트가 깨지는 것을 방지한다(window.matchMedia 등).
if (typeof window !== 'undefined') {
	if (!window.matchMedia) {
		window.matchMedia = (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		});
	}
	if (!window.ResizeObserver) {
		window.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
	if (!Element.prototype.scrollIntoView) {
		Element.prototype.scrollIntoView = () => {};
	}
}
