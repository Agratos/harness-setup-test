# ADR-001: bookmark 엔티티 레이어 설계 (서버 없는 로컬 전용 SPA)

상태: proposed

연결단계: planSteps[0] `01-entity-bookmark` / phaseSeq 2 (design)
제기자: architect
관련 규약: `docs/fsd/entities.md` §2·§5·§7, `docs/fsd/naming.md` §1·§3·§4, `docs/fsd/features.md` §4
참조 실재 예시: `src/entities/example/`, `src/shared/lib/zustand/create-store-with-devtool.ts`

---

## 컨텍스트

bookmark-manager 는 **서버가 없는** 개인용 북마크 관리 SPA 입니다. 모든 상태는
localStorage 로 로컬 지속됩니다. 그러나 이 베이스 프로젝트의 엔티티 표준(`docs/fsd/entities.md`,
canonical 예시 `src/entities/example/`)은 **서버 API 를 전제**로 한 구조입니다:
`model/dto/` (서버 원본) ↔ `model/mapper/` (변환 단일 통로) ↔ `model/types/` (클라이언트 타입),
그리고 `api/` 의 react-query 훅(`queryApi`/`useQueryApi`/`useMutationApi`).

step 01 의 범위는 **bookmark 엔티티 레이어만** 입니다 (UI 없음):
타입 + zod 스키마 + zustand persist 스토어 + CRUD/조회 셀렉터. 따라서
"서버 전제 표준을 서버 없는 도메인에 어떻게 적용/생략할 것인가"가 본 ADR 의 중심 결정입니다.

bookmark 엔티티 형태(요구사항 제안):
`{ id: string(uuid), title: string, url: string, tags: string[], favorite: boolean, createdAt: string(ISO) }`.

후속 단계(범위 밖, 단 본 설계가 영향을 줌):
- step 02: 추가 폼 + 목록 위젯(추가/삭제/폼초기화)
- step 03: 태그 필터 + 텍스트 검색 + 즐겨찾기 토글 + 통계

---

## 결정 1 — FSD 세그먼트 배치 (DTO/mapper 생략, model/ 하위 store·types·schema)

**결정**: `src/entities/bookmark/` 를 아래 구조로 둡니다. 서버가 없으므로
`api/`·`model/dto/`·`model/mapper/` 는 **만들지 않습니다**. `model/` 하위에 `types/`·`schema/`·`store/` 만 둡니다.

```
src/entities/bookmark/
├── model/
│   ├── types/
│   │   └── bookmark.types.ts          # Bookmark, NewBookmarkInput, BookmarkUpdateInput
│   ├── schema/
│   │   └── bookmark.schema.ts         # zod 스키마 (도메인 불변식) + z.infer 보조
│   └── store/
│       └── bookmark.store.ts          # zustand + persist + 액션 + 셀렉터
└── index.ts                           # public API 배럴 (스토어 훅 + 클라이언트 타입만)
```

**근거**:
- `docs/fsd/entities.md` §2 는 `model/` 아래에 `dto/·types/·mapper/·store/` 를 묶고 "필요한 세그먼트만
  생성, 빈 폴더는 만들지 않는다"(`naming.md` §4)고 규정합니다. DTO/mapper 는 **서버 원본↔클라이언트
  변환을 위한 장치**(§3)이므로 서버가 없는 본 도메인에는 변환 대상이 없습니다. 억지로 빈 DTO/mapper 를
  만들면 규약(§3 "변환의 단일 통로")이 무의미해지고 죽은 코드가 됩니다.
- `entities.md` §5 는 store 를 "클라이언트 측 도메인 상태가 실제로 있을 때만 `model/store/` 에 둔다"고
  명시합니다. bookmark 는 정확히 이 케이스(서버 상태 없음, 클라이언트 도메인 상태가 진실의 원천)이므로
  store 가 엔티티의 1차 산출물이 됩니다.
- `schema/` 세그먼트는 `naming.md` §4 의 세그먼트 목록에 명시되지 않은 신규 폴더입니다. 본 ADR 에서
  엔티티 도메인 불변식(zod)을 담을 세그먼트로 `model/schema/` 를 채택합니다 (대안: `model/types/` 에
  타입과 스키마를 함께 두기 — 결정 3 참조). check-arch 는 import 방향만 검사하므로 세그먼트 추가는
  게이트에 영향이 없습니다.
- 슬라이스 루트 `index.ts` 는 `naming.md` §3·§4 상 **필수**입니다. DTO 가 없으므로 "DTO 숨김" 규칙은
  무관하지만, 내부 구현(스토어 set/get raw, schema 객체)을 노출하지 않고 **훅 + 셀렉터 + 클라이언트
  타입만** 공개하는 §3 원칙은 그대로 적용합니다.

**파일·심볼 네이밍** (`naming.md` §1·§2 준수):
- 폴더/파일: kebab-case. 스토어 파일은 규약상 `<name>.store.ts` → `bookmark.store.ts`.
- 타입: PascalCase (`Bookmark`, `NewBookmarkInput`). 스토어 훅: `use` + PascalCase (`useBookmarkStore`).
- `interface`·`React.FC`·`export default` 금지. props 가 아니므로 type 정의를 사용.

---

## 결정 2 — zustand persist 전략 (key·partialize·액션·셀렉터 위치)

**결정**:
- 스토어는 `shared/lib/zustand/create-store-with-devtool` 헬퍼로 생성합니다 (`entities.md` §5 지정 헬퍼).
- 옵션: `persist: true`, `storage: 'local'` (localStorage), `key: 'bookmark-store'`,
  `partialize: ['bookmarks']` — **데이터 배열만 persist**, 액션/셀렉터는 persist 대상에서 제외합니다.
- 상태 형태: `{ bookmarks: Bookmark[] }` (단일 배열을 진실의 원천으로).
- 액션 (엔티티에 위치): `add(input: NewBookmarkInput)`, `remove(id: string)`,
  `toggleFavorite(id: string)`, `update(id, patch)` (step 02·03 대비). 각 `set` 호출에는
  devtools 라벨용 actionName 을 부여 (`bookmark-store/add` 형태로 타임라인 표시).
- **조회 셀렉터는 엔티티 스토어 옆 순수 함수**로 둡니다 (결정 4 참조).

**근거**:
- `create-store-with-devtool.ts` 는 `storage:'local'` → `localStorage`, `key`, `partialize`(키 배열 형태
  지원, line 5·18·77·79)를 그대로 제공합니다. 새 인프라 없이 헬퍼만으로 persist 요구를 충족합니다.
- **partialize 로 데이터만 persist 하는 이유**: 함수(액션·셀렉터)는 직렬화 불가하며, persist 후
  rehydrate 시 함수가 사라지거나 stale 클로저로 덮일 위험이 있습니다. 배열 데이터만 저장하면
  rehydrate 후에도 액션은 `creator` 가 새로 제공하는 최신 구현을 사용합니다. (zustand persist 기본
  동작상 partialize 미지정 시 함수까지 저장 시도 → 불필요/위험.)
- **store key 를 `'bookmark-store'` 로 고정**하는 이유: localStorage 키는 앱 전역 네임스페이스이므로
  도메인 prefix 가 명확해야 충돌·디버깅이 용이합니다. storeName 도 동일 값으로 두어 devtools
  라벨(`bookmark-store/add`)과 일치시킵니다.
- **id 생성**: `crypto.randomUUID()` 를 액션 내부에서 호출합니다 (uuid 라이브러리 불필요, 브라우저
  네이티브). `createdAt` 은 `new Date().toISOString()`. 단, id/createdAt 부여는 **부수효과적 생성**이므로
  add 액션 한 곳에서만 수행해 결정론 경계를 명확히 합니다.

**액션 시그니처 초안** (코드는 implement 페이즈 산출):
```
add(input: NewBookmarkInput): void        // id·createdAt·favorite 기본값 부여 후 prepend
remove(id: string): void
toggleFavorite(id: string): void
update(id: string, patch: BookmarkUpdateInput): void
```

---

## 결정 3 — zod 검증 경계 (엔티티 도메인 불변식 vs feature 폼 검증)

**결정**: zod 를 **두 곳에서 역할을 나눠** 사용합니다.
1. **엔티티 `model/schema/bookmark.schema.ts`** — 도메인 **불변식**(저장 가능한 bookmark 의 최소 조건)을
   정의합니다. `add`/`update` 액션이 이 스키마로 입력을 `parse` 하여 **부정 데이터가 스토어(=localStorage)에
   절대 들어가지 못하게** 막습니다. 규칙:
   - `title`: `z.string().trim().min(1)` — 공백만 있는 빈 제목 거부.
   - `url`: `z.string().trim().url()` — 잘못된 URL 거부 (zod v4 `.url()`).
   - `tags`: `z.array(z.string().trim().min(1))` 기본값 `[]`, 중복 제거는 액션에서 정규화.
   - `favorite`: `z.boolean()` 기본값 `false`.
2. **feature 폼 (step 02, 범위 밖)** — `docs/fsd/features.md` §4 의 `model/form.ts` 에 zod 스키마 +
   `zodResolver`(mantine-form-zod-resolver)로 **입력 UX 검증**(실시간 에러 메시지, 필드별 피드백)을 둡니다.

**근거**:
- `features.md` §4 는 폼 스키마를 feature `model/form.ts` 에 두고 `@mantine/form` + `zodResolver` 로
  연결하는 것을 표준으로 명시합니다. 따라서 **폼 UX 검증의 1차 위치는 feature** 입니다.
- 그러나 엔티티 스토어는 폼을 거치지 않는 경로(향후 import/seed, 직접 액션 호출, 테스트)로도 변경될 수
  있으므로, **도메인 불변식은 엔티티가 자기 자신을 보호**해야 합니다 (방어선 이중화 — feature 는 UX,
  엔티티는 데이터 무결성). 이는 `entities.md` §1 의 "비즈니스 도메인 모델 정의" 책임과 일치합니다.
- **중복이 아니라 책임 분리**입니다: feature 스키마는 "사용자가 보기 좋은 에러"를, 엔티티 스키마는
  "저장 불가 데이터 차단"을 담당합니다. step 02 에서 feature 폼 스키마는 엔티티 스키마 규칙을 재사용
  (`import` 또는 동일 규칙 정의)할 수 있으나, **엔티티 스키마를 feature 가 import 하는 방향만 허용**
  됩니다 (check-arch: features(2) → entities(1) 하향 import 합법). 역방향은 금지입니다.
- `title`/`url` 거부 규칙을 엔티티에 두면, 빈 title·잘못된 url 거부 정책이 **단일 진실 원천**이 되어
  step 02 폼과 향후 추가 진입점이 모두 같은 규칙을 따릅니다.

**거부 정책 명세** (테스트 대상):
- 빈/공백 title → `add`/`update` 가 throw 또는 no-op (구현 페이즈에서 정책 확정: throw 권장 — 호출부가
  명시적으로 try/catch 또는 safeParse 하게).
- 비-URL url → 동일하게 거부.
- 정상 입력 → id(uuid)·createdAt(ISO)·favorite(기본 false) 보정 후 저장.

---

## 결정 4 — 엔티티 셀렉터 vs feature 로직 (필터·검색·통계 위치)

**결정**: **순수 파생(derivation) 로직은 엔티티 셀렉터**(순수 함수)로, **사용자 입력 상태·인터랙션은
feature** 로 둡니다.
- 엔티티 `model/store/bookmark.store.ts` (또는 인접 `selectors`) 에 둘 것:
  `selectAll`, `selectById(id)`, `selectFavorites`, `filterByTags(bookmarks, tags)`,
  `searchByText(bookmarks, query)`, `selectStats(bookmarks)` — 모두 **입력→출력이 결정적인 순수 함수**.
- feature(step 03, 범위 밖)에 둘 것: 검색어/선택 태그 같은 **UI 로컬 상태**(`features.md` §4 의 zustand
  plain store 또는 폼), 디바운스, 입력 핸들러 — 즉 "사용자가 무엇을 한다"는 인터랙션.

**근거**:
- `entities.md` §1·§7 은 "도메인 비즈니스 로직·계산 함수"는 엔티티(`lib/` 또는 model 셀렉터)에,
  "사용자 액션 중심 기능(폼·토글 등)"은 features 에 둔다고 명시합니다. 필터링/검색/통계의 **계산
  자체**는 도메인 데이터에 대한 순수 파생이므로 엔티티 책임입니다. 반면 "검색창에 무엇을 입력했는가"는
  feature 의 로컬 UI 상태입니다.
- **중복 방지**: 셀렉터를 feature 에 두면 step 03 의 검색 feature, 통계 위젯, 향후 다른 소비자가 동일
  필터/통계 로직을 각자 재구현하게 됩니다 (`entities.md` §7 가 경계하는 안티패턴). 엔티티에 단일
  구현을 두면 모든 소비자가 재사용합니다.
- **순수 함수 형태로 두는 이유**: zustand 셀렉터를 `(state) => ...` 클로저로만 두면 입력 인자가 있는
  필터/검색을 표현하기 어렵고 테스트가 스토어에 결합됩니다. `filterByTags(bookmarks, tags)` 같은
  `(데이터, 조건) => 결과` 순수 함수로 두면 step 01 단계에서 스토어 없이도 단위 테스트가 가능하고
  (게이트 §7 의 test:run 친화), feature 는 `useBookmarkStore` 로 받은 배열에 이 함수를 합성합니다.
- check-arch 영향 없음: 셀렉터는 엔티티 내부 코드이며 import 방향(features→entities)도 합법입니다.

---

## 종합 결과 (영향)

- **이 베이스의 "서버 전제 엔티티 표준"에서 의도적으로 벗어나는 첫 슬라이스**입니다. 따라서 본 ADR 이
  "서버 없는 도메인은 DTO/mapper/api 를 생략하고 store+schema+selectors 로 구성한다"는 선례가 됩니다.
  향후 동일 성격 엔티티는 이 ADR 을 참조합니다.
- step 02: feature 폼은 엔티티 스키마 규칙을 재사용하고, 추가/삭제는 엔티티 액션을 호출합니다.
- step 03: 필터/검색/통계 feature 는 엔티티 셀렉터(순수 함수)를 소비하고, 입력 상태만 자체 보유합니다.
- 게이트(`entities.md` §6-7): `typecheck` + `lint` + `test:run` + `check:arch` green 을 충족해야 하며,
  schema 거부 규칙과 셀렉터 순수 함수는 단위 테스트 대상입니다 (구현 페이즈에서 QA 가 검증).
- **미해결/구현 페이즈 위임 사항**: (a) `model/schema/` 신규 세그먼트 채택을 PM·QA 가 수용할지
  (대안: `model/types/` 통합), (b) add/update 거부를 throw vs safeParse-반환 중 무엇으로 할지,
  (c) 셀렉터를 `store/` 내부 export 로 둘지 `lib/` 로 분리할지.

---

## 협의 발언 (architect → PM)

주장: bookmark 엔티티는 DTO·mapper·api 세그먼트를 생략하고 `model/` 하위에 `types`·`schema`·`store`(zustand persist)만 두며, 필터·검색·통계는 엔티티의 순수 셀렉터 함수로, 폼 UX 검증만 feature 에 둡니다.
이유: `docs/fsd/entities.md` §3 의 DTO↔mapper 는 서버 원본↔클라이언트 변환 장치인데 본 프로젝트는 서버가 없어 변환 대상이 없습니다(§5 는 "클라이언트 도메인 상태가 있을 때만 store 를 둔다"고 명시 — bookmark 가 바로 그 케이스). 필터·통계의 계산은 §1·§7 상 도메인 비즈니스 로직이므로 엔티티에 단일 구현을 두어 step 03 의 여러 소비자(검색 feature·통계 위젯)가 재사용하게 하고, 중복 구현(§7 안티패턴)을 막습니다. 검증은 엔티티 스키마(데이터 무결성·빈 title/잘못된 url 차단)와 feature 폼 스키마(UX 에러 메시지, `features.md` §4)로 책임을 분리하되, import 방향은 features→entities 하향만 허용하여 check-arch 경계를 지킵니다.
