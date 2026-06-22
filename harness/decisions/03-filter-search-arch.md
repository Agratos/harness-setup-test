# ADR-003: 필터·검색·통계 UI 설계 (엔티티 셀렉터 소비)

상태: accepted
연결단계: planSteps[2] `03-filter-search` / design
제기자: orchestrator (architect 에이전트가 API 529 로 중단되어 오케스트레이터가 확정 — 설계는 ADR-001 결정4 에서 이미 도출됨)
참조: `01-entity-bookmark-arch.md`(결정4: 파생 로직=엔티티 셀렉터, UI 상태=feature), `src/entities/bookmark`(filterBookmarks·selectAllTags·countStats 완성), `src/widgets/bookmark-list`

## 컨텍스트
step 03 은 태그 필터 + 텍스트 검색 + 즐겨찾기만 + 통계. 순수 파생 로직(filterBookmarks/selectAllTags/countStats)은 **step01 에서 엔티티 셀렉터로 이미 구현**됨. 이번 범위는 그것을 소비하는 **UI + 필터 상태**뿐.

## 결정 1 — 필터 상태는 feature 로컬 store
`features/filter-bookmarks/model/filter.store.ts` 에 zustand 스토어(`createStoreWithDevtool`, **persist 불필요** — 필터는 세션 한정 UI 상태). state `{ query, tag, favoriteOnly }` + 액션(setQuery/setTag/toggleFavoriteOnly/reset).
- 근거: ADR-001 결정4 — "사용자 입력 상태·인터랙션은 feature". 검색어/선택태그/즐겨찾기여부는 UI 로컬 상태이지 도메인 데이터가 아니다.

## 결정 2 — widget 이 필터 상태를 읽어 엔티티 셀렉터 적용
`widgets/bookmark-list` 가 `useBookmarkStore` 의 bookmarks + `filter.store` 의 {query,tag,favoriteOnly} 를 읽어 `filterBookmarks(bookmarks, filter)` 로 렌더. 통계는 `countStats` 로 표시.
- 근거: widget 은 features/entities 를 조립하는 상위 레이어이므로 feature store·entity 셀렉터를 모두 소비 가능(FSD 하향 참조 합법). filter 계산은 엔티티 셀렉터 재사용(중복 0).
- 빈 상태 2종 구분: 전체 0건 "아직 북마크가 없습니다" vs 필터 결과 0건 "조건에 맞는 북마크가 없습니다".

## 결정 3 — E2E 구동 가능한 컨트롤 (⚠️ 4차 발견 반영)
태그 필터는 **`Chip.Group`**(텍스트 클릭 가능), 즐겨찾기만은 **`Checkbox`**(role checkbox), 검색은 **`TextInput`**(label '검색'). **`SegmentedControl` 금지** — eval-scenario 러너가 hidden radio input 을 못 눌러 E2E 가 깨짐(harness 백로그 A, 4차 실측).

## 결정 4 — 통계 표시
`countStats(bookmarks)` → "전체 N · 즐겨찾기 M" 텍스트. 필터 UI 영역(BookmarkFilter) 또는 인접에 배치.

## 협의 발언 (orchestrator → PM)
주장: 필터 상태는 features/filter-bookmarks 로컬 zustand(persist 없음), 계산은 엔티티 셀렉터(filterBookmarks/countStats) 재사용, 컨트롤은 Chip·Checkbox·TextInput(SegmentedControl 금지)로 둔다.
이유: ADR-001 결정4(파생=엔티티, UI상태=feature)와 일관되고, 셀렉터 단일 구현을 widget 이 소비해 중복을 막는다. SegmentedControl 은 eval-scenario 가 못 눌러(4차 실측) 상호작용 E2E 가 불가하므로 클릭 가능한 컨트롤로 한정해 검증 가능성을 보장한다.
