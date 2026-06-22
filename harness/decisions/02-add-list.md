# 협의 기록 — 02-add-list (사이클 2)

> PM 코디네이터 합성. (ADR 은 `02-add-list-arch.md` 참조)

## decompose / design
- 범위: 북마크 추가 폼(features/add-bookmark) + 목록(widgets/bookmark-list) + pages/home 조립. 엔티티(@/entities/bookmark)는 step01 완성분 재사용.
- ADR-002: features.md §4 폼 표준(@mantine/form + zod resolver, 엔티티 bookmarkInputSchema 재사용), 추가 후 form.reset() 의무, home 이 예시 스캐폴드 교체(Container/Stack), a11y label.

## implement (ui)
- features/add-bookmark(form.ts + AddBookmarkForm), widgets/bookmark-list(BookmarkList), pages/home 조립, app/providers 에 MantineProvider+styles.
- 결정: `zod4Resolver`(zod v4 + mantine-form-zod-resolver v4), entity index export type/value 분리(verbatimModuleSyntax).
- verify 가 적발해 오케스트레이터 보정: **vitest.setup.ts 에 Mantine 테스트용 jsdom polyfill(matchMedia·ResizeObserver·scrollIntoView) 추가** — 없어서 MantineProvider 렌더 컴포넌트 테스트 7건이 `window.matchMedia is not a function` 으로 실패하던 것(하네스 백로그 기록).

## verify (결정적 게이트)
- typecheck·lint·check-arch·test **전부 PASS**, 단위/컴포넌트 테스트 34/34(추가→폼초기화·검증에러·목록/삭제/토글 포함).

## evaluate
- eval-playwright 캡처 직접 확인: Mantine 스타일 폼·중앙 정렬·빈 상태 정상. 종합 **94**(fn98·quality96·ui90·ux93), major 0.
- **상호작용 E2E(eval-scenario) 15/15 통과**: 추가→폼초기화(inputEmpty)·카드2·즐겨찾기 토글·삭제(textGone). 스토리보드 16컷 → 🧪 테스트 관리 행에 File Upload API 로 첨부(신규 기능 dogfooding 성공).
- minor: App.tsx 스캐폴드 헤더 부제 잔존·좌측정렬(백로그 B) → step03 또는 폴리시에서 정리.

## debate (1라운드 — 합의)
- **qa** — 주장: 병합 가능. 이유: 결정적 4종 green + 컴포넌트 34/34 + **E2E 15/15**(폼 초기화·삭제·토글 실브라우저 검증). 기능 결함 0.
- **ui** — 주장: 병합 가능. 이유: Mantine 스타일·a11y(label·aria) 적용, FSD 의존성 방향 준수(check-arch 0).
- **customer** — 주장: 동의(조건). 이유: 추가/목록/삭제/즐겨찾기 사용 흐름이 실제로 동작. 단 스캐폴드 부제는 step03 에서 정리 권고.
- 🗳 합의: **pass**. 종합 94 ≥ 90, major 0 → merge. 스캐폴드 헤더(minor)는 step03 인수.
