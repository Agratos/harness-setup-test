# ADR-002: 북마크 추가 폼 + 목록 UI 레이어 설계 (features/add-bookmark + widgets/bookmark-list + pages/home)

상태: proposed

연결단계: planSteps[1] `02-add-list` / 브랜치 `step/02-add-list` / phaseSeq design
제기자: architect
관련 규약: `docs/fsd/features.md` §2·§3·§4·§6, `docs/fsd/widgets.md` §2·§3·§5, `docs/fsd/pages.md` §1·§2·§3, `docs/fsd/app.md` §3.1, `docs/fsd/naming.md`
선행 ADR: `harness/decisions/01-entity-bookmark-arch.md` (ADR-001 — 엔티티 레이어; 본 ADR 이 그 위에 UI 를 올린다)
참조 실재 코드: `src/entities/bookmark/index.ts`(완성된 public API), `src/pages/home/index.tsx`(교체 대상 스캐폴드), `src/app/App.tsx`·`src/app/providers/index.tsx`(현 골격), `scripts/eval-scenario.mjs`(E2E 러너), `harness/eval-scenario.example.json`

---

## 컨텍스트

step 01 에서 bookmark 엔티티 레이어가 완성되었습니다. 실측한 public API(`src/entities/bookmark/index.ts`)는:

```
export { type BookmarkInputSchema, bookmarkInputSchema } from './model/schema/bookmark.schema';
export { type BookmarkFilter, countStats, filterBookmarks, selectAllTags, useBookmarkStore } from './model/store/bookmark.store';
export type { Bookmark, BookmarkInput } from './model/types/bookmark.types';
```

- `useBookmarkStore` 액션: `add(input: BookmarkInput)`, `remove(id)`, `toggleFavorite(id)`, `clear()`.
  `add` 는 `{ title, url, tags }` 를 받아 id/createdAt/favorite 을 **store 가 자동 보정**해 맨 앞에 prepend.
- `bookmarkInputSchema` (zod): `title` trim+min(1), `url` `.url()`, `tags` `string[]` 기본 `[]`. 한국어 에러 메시지 내장.
- **중대 발견**: ADR-001 결정 3 은 "엔티티 `add` 가 스키마로 parse 해 부정 데이터를 차단"한다고 설계했으나, **구현된 `add` 는 zod parse 를 하지 않고 입력을 그대로 prepend** 합니다(`bookmark.store.ts` line 77-93). 즉 **데이터 무결성의 1차이자 유일한 방어선은 step 02 의 폼 검증**입니다. 폼이 `bookmarkInputSchema` 로 막지 않으면 빈 title·잘못된 url 이 그대로 localStorage 에 저장됩니다. → 본 ADR 의 결정 2(폼)에서 이 검증을 의무화합니다.

step 02 범위: 엔티티 위에 **UI** 를 올린다 — 추가 폼(제목·URL·태그 입력 → 추가), 목록(렌더·삭제·즐겨찾기 토글), 추가 성공 후 폼 초기화. 필터·검색·통계는 step 03(범위 밖).

**환경 제약 (실측 — 설계에 결정적 영향)**:
- `src/app/providers/index.tsx` 에는 **`QueryClientProvider` 만** 있고 **MantineProvider 가 없습니다**. `@mantine/core/styles.css` import 도 없습니다(`docs/fsd/app.md` §3.1 의 "3종 배선" 은 목표 문서이고 실제 코드는 최소 골격).
- `src/shared/ui/` 에 공용 컴포넌트가 없습니다 → 직접 `@mantine/core` 를 사용.
- `App.tsx` 가 라우터 없이 `<main><h1>bookmark-manager</h1> … <HomePage /></main>` 를 직접 렌더. **스모크 테스트(`src/app/app.test.tsx`)가 `getByRole('heading', { name: 'bookmark-manager' })` 를 단언** → 이 h1 은 반드시 유지.
- 의존성: `@mantine/core` `@mantine/form` `@mantine/hooks` `mantine-form-zod-resolver` `zod` 모두 설치됨(package.json). 신규 설치 불필요.

---

## 결정 1 — FSD 세그먼트 배치 (features/add-bookmark + widgets/bookmark-list + pages/home 조립)

**결정**: 추가 폼은 `features` 슬라이스, 목록은 `widgets` 슬라이스, 둘의 조립과 폼/스토어 배선은 `pages/home` 이 담당합니다.

```
src/features/add-bookmark/
├── ui/
│   ├── add-bookmark-form.tsx        ← 폼 컴포넌트 (form 을 props 로 받아 입력만 그림)
│   └── add-bookmark-form.module.css ← CSS Modules (Mantine 만으로 충분하면 생략 가능)
├── model/
│   └── form.ts                      ← bookmarkInputSchema 재사용 + 초기값 + 폼 타입(z.infer)
└── index.ts                         ← public API 배럴 (컴포넌트 + 폼 헬퍼/타입)

src/widgets/bookmark-list/
├── ui/
│   ├── bookmark-list.tsx            ← 목록 컴포넌트 (bookmarks + 콜백을 props 로 받음)
│   └── bookmark-list.module.css     ← CSS Modules (선택)
└── index.ts                         ← public API 배럴 (BookmarkList)

src/pages/home/
└── index.tsx                        ← HomePage 교체: 폼 인스턴스 소유 + store 배선 + feature/widget 조립
```

**근거**:
- `features.md` §1 — "사용자가 무언가를 한다"가 한 슬라이스. **북마크 추가**(폼 제출)는 정확히 인터랙션 단위이므로 `features/add-bookmark`. §2 의 기본 구조(`ui/ + index.ts`, 폼 있으면 `model/`)를 그대로 적용 — 폼이 있으므로 `model/form.ts` 를 둡니다.
- `widgets.md` §1 — "페이지에 배치되는 독립적 UI 블록"(데이터 테이블 등). **북마크 목록**은 데이터를 렌더하고 각 행에 삭제·즐겨찾기 토글을 합성하는 블록이므로 `widgets/bookmark-list`. §2 단순 위젯 구조(`ui/ + index.ts`).
- `pages.md` §1·§3 — page 는 **폼 인스턴스(`useForm`+`zodResolver`)와 상태를 소유**하고 feature/widget 에 `form`·`data`·콜백을 props 로 내려주는 오케스트레이터. → `pages/home` 이 `useForm` 과 `useBookmarkStore` 를 소유합니다.
- **import 방향 합법성**(features.md §6 / widgets.md §5 / pages.md §6, `shared<entities<features<widgets<pages<app`):
  - `features/add-bookmark` → `@/entities/bookmark`(폼 스키마 재사용), `@/shared`, `@/mantine` ✅ (하향)
  - `widgets/bookmark-list` → `@/entities/bookmark`(`Bookmark` 타입), `@/features/*`(필요 시 합성), `@/shared` ✅
  - `pages/home` → `@/features/add-bookmark`, `@/widgets/bookmark-list`, `@/entities/bookmark` ✅
  - `node scripts/check:arch` 는 import 방향만 검사 → 위 배치는 전부 합법(역방향 0건).

**데이터/콜백 흐름 (page 가 소유, 하위는 순수)**:
```
pages/home (소유):
  const form = useForm<AddBookmarkValues>({ initialValues: getInitialAddBookmarkValues(), validate: zodResolver(bookmarkInputSchema) });
  const { bookmarks, add, remove, toggleFavorite } = useBookmarkStore();
  const handleSubmit = form.onSubmit((values) => { add(values); form.reset(); });   // 결정 2 참조
  →  <AddBookmarkForm form={form} onSubmit={handleSubmit} />
  →  <BookmarkList bookmarks={bookmarks} onRemove={remove} onToggleFavorite={toggleFavorite} />
```

- **폼 인스턴스를 page 가 소유하는 이유**(features.md §3·§4 명시): 폼 검증 결과·초기화 시점을 page 가 통제해야 추가 성공 직후 `form.reset()` 을 호출할 수 있습니다. feature 가 폼을 자체 소유하면 page 가 reset 타이밍을 제어하지 못합니다.
- **태그 입력 형태**: `tags: string[]` 이지만 폼 UI 는 단일 텍스트 입력(쉼표 구분)으로 받고 `model/form.ts` 또는 submit 시 `string → string[]` 정규화(`split(',').map(trim).filter(Boolean)`)합니다. 이 정규화는 feature `model/` 또는 page submit 핸들러에 둡니다(엔티티 침범 금지). 대안(Mantine `TagsInput`)은 결정 5의 라벨 컨벤션과 충돌 가능 → 단순 TextInput 권장.

---

## 결정 2 — 폼 초기화 정책 (@mantine/form controlled + 추가 성공 후 form.reset())

**결정**: `@mantine/form` 을 사용하되,

1. **`mode: 'controlled'` 를 명시**합니다(@mantine/form v8 기본은 uncontrolled — 이것이 본 사고의 원인).
2. 추가 **성공 후** page 의 submit 핸들러에서 **`form.reset()`** 을 호출해 모든 필드를 `initialValues`(빈 값)로 되돌립니다.
3. uncontrolled 모드를 굳이 유지할 경우, 각 입력에 **`key={form.key('title')}`** 를 부여하는 것을 **의무**로 합니다(누락 시 reset 후에도 DOM input 이 갱신되지 않아 "추가 후 미초기화·재추가 불가" 재현).

**근거 (실제 사고 근원 분석)**:
- @mantine/form v8 의 **기본 모드는 uncontrolled** 입니다. uncontrolled 폼은 입력 DOM 을 React state 와 분리해 리렌더를 줄이는 대신, `form.reset()`/`setValues` 로 값을 프로그램적으로 바꿔도 **`form.key(path)` 로 부여된 `key` 가 바뀌어야만** input 이 재마운트되며 새 값을 반영합니다. `key` 누락 시 reset 은 내부 store 값만 비우고 화면 input 은 옛 값을 유지 → 사용자가 보기에 "초기화 안 됨", 같은 값 재입력 시 dirty 판정 꼬임으로 "재추가 불가"가 발생합니다. **이것이 task 가 적시한 실제 사고의 정확한 메커니즘입니다.**
- **controlled 모드 채택 이유**: `useForm({ mode: 'controlled' })` 로 두면 입력값이 매 변경마다 React state 와 동기화되어 `form.reset()` 호출 즉시 input 이 빈 값으로 리렌더됩니다 — `form.key()` 의존성이 사라져 사고 클래스를 **구조적으로 제거**합니다. 북마크 폼은 필드 3개의 소형 폼이라 controlled 의 리렌더 비용이 무의미하고, 정확성·E2E 통과 안정성이 우선입니다.
- **reset 위치를 page submit 핸들러에 두는 이유**(features.md §3·§4): 폼 소유자는 page 이고, `add(values)` 는 동기 액션(서버 없음)이라 실패 케이스가 없어 호출 직후 reset 이 안전합니다. feature 컴포넌트 내부에서 reset 하면 page 가 통제권을 잃습니다.
- **E2E 직접 연계**: `scripts/eval-scenario.mjs` 의 `assert: inputEmpty` (line 139-142)가 `getByLabel(...).inputValue() === ''` 를 검사합니다. controlled + reset 이면 이 단언이 통과하고, uncontrolled + key 누락이면 **이 단언이 정확히 실패**해 done-gate 가 rework 로 잡습니다(이 러너가 만들어진 목적 그 자체).

**검증 진입점 명세 (구현·QA 대상)**:
- 폼은 `validate: zodResolver(bookmarkInputSchema)` 로 연결 — 컨텍스트에서 적시한 "엔티티 add 가 parse 안 함" 때문에 **이 폼 검증이 데이터 무결성의 유일 방어선**.
- 빈/공백 title, 비-URL url 은 `form.onSubmit` 이 막아 `add` 가 호출되지 않아야 합니다(에러 메시지는 스키마 내장 한국어 문구 노출).
- 정상 제출 → `add(values)` → `form.reset()` → 입력 3개 모두 빈 값.

---

## 결정 3 — pages/home 스캐폴드 교체 + Mantine 레이아웃 + MantineProvider 선행 배선

**결정**:
1. `pages/home/index.tsx` 의 예시 블록(`<h2>예시 목록 (FSD 표준 패턴 데모)</h2><ExampleList />`)을 **bookmark UI 로 전면 교체**합니다. `@/features/example-list` import 는 제거합니다(example-list 슬라이스 파일 자체는 step 02 범위에서 삭제하지 않음 — import 만 끊음).
2. 레이아웃은 Mantine `Container` + `Stack` 으로 감쌉니다(step01 eval 의 "미스타일·좌측정렬 minor" 해소). 예: `<Container size="sm"><Stack gap="md"><AddBookmarkForm/><BookmarkList/></Stack></Container>`.
3. **App.tsx 의 `<h1>bookmark-manager</h1>` 는 반드시 유지**합니다(스모크 테스트 단언 대상). HomePage 는 그 아래에 들어가므로 h1 을 건드리지 않습니다.
4. **선행 조건(블로킹) — MantineProvider 배선**: 현재 `src/app/providers/index.tsx` 에 MantineProvider 와 `@mantine/core/styles.css` 가 **없습니다**. Mantine 컴포넌트(`Container`/`Stack`/`TextInput`/`Button`/`Checkbox`/`ActionIcon` 등)는 MantineProvider 컨텍스트와 styles.css 없이는 스타일이 적용되지 않고 일부는 정상 동작하지 않습니다. 따라서 **step 02 구현은 `Providers` 에 `MantineProvider` 합성 + `import '@mantine/core/styles.css'` 추가를 포함**해야 합니다(`app.md` §3.1 의 최소 형태 그대로).

**근거**:
- `pages.md` §1 — page 는 조립 오케스트레이터. 예시 데모 블록은 step 01 의 잔재이므로 제거하고 실제 도메인 UI 로 교체하는 것이 page 책임에 부합합니다.
- **레이아웃을 page 에 두는 이유**(pages.md §3): 화면 배치(Container/Stack)는 조립 책임이라 page 가, 개별 컴포넌트 내부 스타일은 feature/widget 의 CSS Modules 가 담당(features.md §3 / widgets.md §3 의 책임 분리).
- **h1 유지 근거**: `src/app/app.test.tsx` line 9 가 `name: 'bookmark-manager'` heading 을 단언. 이를 깨면 결정적 게이트(test:run)가 빨간불 → 게이트 통과 불가. HomePage 의 제목은 `h2` 이하 또는 섹션 제목으로 두어 h1 과 충돌하지 않게 합니다.
- **MantineProvider 선행이 블로킹인 이유**: app.md §3.1 은 "현재 빈 MantineProvider 로 감싸는 최소 골격"이라 서술하지만 **실측 결과 providers/index.tsx 에는 MantineProvider 가 아예 없습니다**(QueryClientProvider 만). styles.css 미import 상태로 Mantine 컴포넌트를 쓰면 eval-playwright 스크린샷에서 미스타일(step01 minor 재발)·jsdom 테스트에서 일부 컴포넌트 경고가 납니다. app 레이어 수정은 page/widget/feature 조립을 받치는 전제이므로 **구현 페이즈 첫 작업**으로 둡니다. (app.md §3.1 의 코드를 그대로 적용하면 되므로 신규 설계가 아니라 누락 배선 보강입니다.)

---

## 결정 4 — 접근성(a11y): 입력 라벨 + 토글·삭제의 접근가능 이름

**결정**: 모든 인터랙션 요소에 **접근가능 이름(accessible name)** 을 부여합니다.
- 입력: `TextInput label="제목"`, `TextInput label="URL"`, `TextInput label="태그"`. Mantine `label` prop 은 `<label htmlFor>` 를 자동 연결 → `getByLabel` 로 잡힙니다.
- 즐겨찾기 토글: `Checkbox`(권장) 또는 `ActionIcon`. **체크박스면 `aria-label`/`label` 에 "즐겨찾기"**(예: `Checkbox aria-label="즐겨찾기"` 또는 행 제목 포함 `"<title> 즐겨찾기"`). ActionIcon 이면 `aria-label="즐겨찾기 토글"`.
- 삭제: `Button` 또는 `ActionIcon` 에 접근가능 이름 **"삭제"**(아이콘만일 경우 `aria-label="삭제"` 필수 — 아이콘 버튼은 텍스트가 없어 이름이 비면 스크린리더·E2E 둘 다 못 잡음).
- 추가 버튼: `Button type="submit"` 텍스트 **"추가"**.

**근거**:
- a11y 원칙: 모든 폼 컨트롤은 라벨, 모든 버튼은 텍스트나 `aria-label` 을 가져야 스크린리더 사용자가 식별 가능. 아이콘 전용 버튼(ActionIcon)은 시각 텍스트가 없으므로 `aria-label` 이 **필수**입니다.
- **E2E·a11y 가 같은 메커니즘으로 수렴**: `eval-scenario.mjs` 는 `getByLabel`(입력)·`getByRole('button', { name })`(버튼)·`getByRole('checkbox', { name })`(체크박스)로 요소를 찾습니다(line 89·98·103). 접근가능 이름이 곧 E2E 셀렉터이므로 a11y 를 지키면 E2E 가 자동으로 통과합니다 — 결정 5와 동일 컨벤션.

---

## 결정 5 — 상호작용 E2E 대비 라벨/버튼 텍스트 컨벤션 (eval-scenario 러너 친화)

**결정**: `scripts/eval-scenario.mjs` 가 안정적으로 잡도록 아래 고정 텍스트 컨벤션을 권고(의무)합니다.

| 요소 | 타입 | 접근가능 이름(고정) | 러너 셀렉터 |
| --- | --- | --- | --- |
| 제목 입력 | TextInput | **제목** | `getByLabel('제목')` (fill) |
| URL 입력 | TextInput | **URL** | `getByLabel('URL')` (fill) |
| 태그 입력 | TextInput | **태그** | `getByLabel('태그')` (fill) |
| 추가 버튼 | Button(submit) | **추가** | `getByRole('button', { name: '추가' })` (click) |
| 삭제 버튼 | Button/ActionIcon | **삭제** | `getByRole('button', { name: '삭제' })` (click) |
| 즐겨찾기 토글 | Checkbox | **즐겨찾기** 포함 | `getByRole('checkbox', { name: '즐겨찾기' })` (check/uncheck) |

추가 권고:
- 러너의 `getByLabel`·버튼 name 매칭은 **`exact: false`**(부분일치, line 89·98)입니다. 따라서 라벨이 "URL (필수)" 처럼 부가 텍스트를 포함해도 `'URL'` fill 이 매칭됩니다. 다만 **서로 다른 라벨이 부분 문자열로 겹치지 않게** 주의(예: "태그"와 "태그 그룹"이 동시에 있으면 `getByLabel('태그')` 가 첫 매칭만 잡아 모호 — step 02 는 단일 폼이라 충돌 없음).
- 목록 카드를 Mantine `Card` 로 그리면 `minCount` 단언(`selector: '.mantine-Card-root'`, line 152)으로 "N개 추가됨" 검증이 가능 → 목록 항목을 `<Card>` 로 권장.
- `harness/eval-scenario.json` 시나리오 작성은 QA 담당이나, 본 컨벤션을 따르면 `harness/eval-scenario.example.json` 의 "추가 → inputEmpty → 재추가" 흐름을 그대로 채울 수 있습니다(라벨만 제목/URL/태그로 치환).

**근거**:
- `eval-scenario.mjs` 는 접근가능 이름 기반으로만 요소를 찾으므로(line 86-156), 라벨/버튼 텍스트가 시나리오 스펙과 1:1 로 맞아야 E2E 가 동작합니다. 컨벤션을 ADR 로 고정하면 feature/widget 구현자와 QA 의 시나리오 작성이 어긋나지 않습니다(이 러너가 만들어진 이유 = 상호작용 버그 차단).
- a11y(결정 4)와 **동일한 텍스트가 두 목적(스크린리더·E2E)을 동시에 만족** → 별도 test-id 가 불필요하고 마크업이 깔끔해집니다.

---

## 기술 트레이드오프 — 폼 모드 선택 (controlled vs uncontrolled+key)

| 선택지 | 장점 | 단점 | 사고 위험 | 채택 |
| --- | --- | --- | --- | --- |
| **A. controlled (`mode:'controlled'`)** | reset 즉시 input 반영, `form.key` 불필요, 사고 클래스 구조적 제거, E2E inputEmpty 안정 | 필드마다 리렌더(소형 폼이라 무시 가능) | **없음** | ✅ **채택** |
| B. uncontrolled + `key={form.key('x')}` | 리렌더 최소화(대형 폼 유리) | 모든 입력에 key 부여 의무, 하나라도 누락 시 사고 재발 | **높음**(누락 1건=버그) | 보조 허용(key 의무 시) |
| C. React useState 수동 관리 | 의존성 없음 | zodResolver·에러 표시 직접 구현, features.md §4 표준 이탈 | 중(수동 reset 누락) | ✗ |

→ 3-필드 소형 폼에서 정확성·E2E 안정성이 리렌더 비용을 압도하므로 **A(controlled)** 채택. B 는 향후 대형 폼에서만 `key` 의무 전제로 허용.

---

## 종합 결과 (영향)

- **구현 페이즈 작업 순서**(권고): (1) `app/providers` 에 MantineProvider + styles.css 배선(결정 3 블로킹) → (2) `features/add-bookmark`(form.ts + ui) → (3) `widgets/bookmark-list`(ui) → (4) `pages/home` 교체·조립.
- **게이트**: `typecheck` + `lint` + `test:run`(스모크 h1 유지) + `check:arch`(import 방향 합법) green 필수. 추가로 `eval:scenario`(추가→inputEmpty→재추가, 삭제 후 textGone, 즐겨찾기 check)로 상호작용 검증 — QA 담당.
- **엔티티 무결성 공백 인계**: ADR-001 설계와 달리 구현된 `add` 가 zod parse 를 하지 않으므로, **폼이 유일 방어선**임을 QA·executor 가 인지해야 합니다(빈 title/잘못된 url 차단 테스트 필수). 엔티티 `add` 에 parse 를 추가하는 것은 step 02 범위를 넘어 ADR-001 의 미해결 항목으로 별도 처리(본 ADR 에서는 폼 검증으로 커버).
- **example-list 처리**: pages/home 에서 import 만 제거. 슬라이스 파일 삭제 여부는 PM/플랜 결정(데모 잔재 정리 차원이면 후속 단계 권장).
- **미해결/구현 위임**: (a) 태그 입력을 단일 TextInput(쉼표) vs Mantine `TagsInput` 중 무엇으로 — 결정 1 은 라벨 컨벤션 안정성 위해 TextInput 권장, (b) 즐겨찾기를 Checkbox vs ActionIcon — 결정 4·5 는 E2E `check/uncheck` 단언 활용 위해 Checkbox 권장, (c) 빈 목록 안내 문구("저장된 북마크가 없습니다" 등) 노출 — UX 권장.

---

## 협의 발언 (architect → PM)

주장: step 02 구현은 `features/add-bookmark`(폼)·`widgets/bookmark-list`(목록)·`pages/home`(조립)으로 배치하되, **폼은 `@mantine/form` controlled 모드 + 추가 성공 후 page 의 `form.reset()`** 으로 두고, 첫 작업으로 `app/providers` 에 누락된 MantineProvider+styles.css 를 배선해야 합니다.
이유: `features.md` §1·§4 상 "추가"는 인터랙션 단위 feature, `widgets.md` §1 상 목록은 UI 블록, `pages.md` §3 상 폼 인스턴스는 page 가 소유(import 방향 features<widgets<pages 전부 하향이라 check-arch 합법). 폼 초기화 사고의 정확한 원인은 @mantine/form v8 의 **uncontrolled 기본 모드 + `form.key` 누락**이므로 controlled 모드를 명시하면 `key` 의존성을 없애 사고 클래스를 구조적으로 제거하고 `eval-scenario.mjs` 의 `inputEmpty` 단언을 안정 통과시킵니다(이 러너가 만들어진 목적). 또한 실측 결과 `providers/index.tsx` 에 MantineProvider 가 없어(QueryClientProvider 만) Mantine 컴포넌트가 미스타일/오동작하므로 app.md §3.1 최소 형태 배선이 page UI 의 블로킹 선행조건입니다. 끝으로 입력 라벨(제목/URL/태그)·버튼 텍스트(추가/삭제)·즐겨찾기 Checkbox 이름을 고정하면 a11y 접근가능 이름과 eval-scenario 셀렉터가 동일 텍스트로 수렴해 별도 test-id 없이 E2E 가 통과합니다. 다만 ADR-001 설계와 달리 구현된 엔티티 `add` 가 zod parse 를 하지 않아 폼 검증이 데이터 무결성의 유일 방어선이라는 점을 QA 에 인계합니다.
