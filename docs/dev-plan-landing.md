# Landing V2 최종 구현 계획 (코딩 전)

## 0) 문서 목적
- 본 문서는 `docs/req-landing.md`를 1차 기준으로 랜딩페이지 V1 구현 계획을 확정한다.
- `docs/requirements.md`는 전역 제약/일관성/향후 확장 참고로만 사용한다.
- 본 문서는 구현 지시 전 전달용 계획 문서이며, 코드 변경 지침이 아닌 실행 순서/검증 기준 문서다.

## 1) 기준 문서 및 우선순위
1. `docs/req-landing.md` 본문(Section 1~12)
2. `docs/requirements.md` 전역 제약
3. `docs/req-landing.md` 부록(Appendix)

## 2) 사전 확정 의사결정(역질문 응답 반영)
- 최신 Next.js App Router 표준 규칙 적용:
  - App Router 루트는 단일 경로만 사용한다.
  - 본 계획의 기본 루트는 `app/`를 사용한다.
  - `proxy.ts`는 프로젝트 루트(`./proxy.ts`)에 둔다.
  - `app/`와 `src/app` 동시 운영은 금지한다(동시 존재 시 `src/app` 무시).
  - 추후 `src` 전략으로 전환 시 `src/app` + `src/proxy.ts`를 함께 이동한다.
- Hero row 선별: **정렬된 카드 목록의 앞 `N`개 자동 배치**
- 카드 정렬 기준: **fixture 배열 순서 그대로 사용**
- Hero 의미 확정: **Hero는 상단 카드 row이며, 카드 동작은 Main과 동일하게 적용**
- `HOVER_LOCK` 적용 범위: **`width >= 768 && hover-capable` 전체(태블릿 포함)**
- Tablet Landing/Blog GNB + Desktop Blog GNB: **Desktop Landing GNB 규칙 재사용**
- Tablet 설정 레이어 열기 규칙: **hover-capable이면 hover open, 아니면 click/focus open**
- `availableWidth` 기준: **컨테이너 내부폭(뷰포트 - 좌우 패딩)**
- `/history` 범위: **라우트/페이지 셸만 구현**

## 3) 구현 범위 요약

### 3.1 이번 세션 구현 범위(In Scope)
- App Router + i18n 라우팅/레이아웃 계약(2-layer layout, `proxy.ts`, typedRoutes)
- 랜딩 카탈로그 레이아웃(2-stage hero/main, 반응형, 카드 높이 정책)
- GNB 계약(Desktop/Tablet 설정 레이어, Mobile 햄버거/overlay, route별 구성)
- 카드 콘텐츠 계약(Normal/Expanded/Unavailable 슬롯/클램프/오버레이)
- 상태기계(PageState/CardState/HOVER_LOCK)와 capability gate 기반 상호작용
- 랜딩→목적지 전환 잠금 및 Test Q1 pre-answer 핸드셰이크/롤백
- 최소 텔레메트리/프라이버시/consent 상태기계
- Fixture + Adapter 데이터 구조 및 최소 데이터 다양성
- SSR/Hydration/성능/A11y/QA 게이트 충족

### 3.2 이번 세션 비구현 범위(Out of Scope)
- 배경 동적 연출(강도 0/정지), 카드 tilt, 대체 시각 패키지 A/C
- REQ-F-016 전체 이벤트 택소노미(본 문서 11.2 최소 이벤트셋만)
- Google Sheets 실연동/운영 Sync/Admin 분석
- 테스트/블로그 본문 고도화 기능
- `/history` 실제 데이터 기능(목록/삭제/정렬) 구현

## 4) 요구사항 매핑 (기능 단위)

| 기능 묶음 | 구현 포인트 | 1차 근거 (`req-landing`) | 전역 참고 (`requirements.md`) |
|---|---|---|---|
| 라우팅/레이아웃 계약 | App Router 단일 루트(`app/`), root layout(`html/body`), locale 단일 prefix, typed route helper(locale-free), `proxy.ts` 단일 엔트리 | §2.2~2.4, §3.1~3.3, §12.1, §12.4 | REQ-F-027, REQ-F-031, REQ-F-036 |
| SSG Search Params 안전성 | SSG 경로 `useSearchParams` 사용 시 Suspense 경계 또는 dynamic rendering 전략 필수 | §2.5 | REQ-F-021 |
| URL 무결성/실패 처리 | `/en/en` 등 중복 locale URL 즉시 fail + rollback + fail reason 기록 | §2.3, §3.2, §10.6, §12.4 | REQ-F-031 |
| IA/경로 표면 | `/{locale}`, `/test/[variant]/question`, `/blog?source=<cardId>`, `/history` | §3.1 | REQ-F-001 |
| 컨테이너/그리드 | max-width 1280, side padding, vertical rhythm, D/T 2-stage, M 1열, threshold(1160/900), minCardWidth 기본 280 | §4.1~4.4, Appendix C | REQ-F-001 |
| Hero row 해석 | 정렬 목록 앞 N개를 hero row로 분리하되 Main과 동일 interaction/CTA 게이팅 적용 | §4.3, §4.4 | REQ-F-001, REQ-F-027 |
| 카드 높이 정책 | Normal row equal-height, Expanded만 유동 증가, non-expanded 고정, fixed height 금지 | §4.5 | REQ-F-034, REQ-F-035 |
| GNB 공통/컨텍스트 | sticky/height/z-index, Landing/Test/Blog 컨텍스트별 구성, swap timing | §5.1~5.5, §3.3 | REQ-F-036 |
| 설정 UI 계약 | Desktop/Tablet: hover-capable hover-open, non-hover-capable click/focus-open, Esc/outside/focus-out close, hover-gap 금지 | §5.3, §12.4 | REQ-F-033 |
| Mobile 메뉴 계약 | fixed overlay + backdrop, body scroll lock, close transition 종료 후 unlock, 우측 끝 inset 고정 | §5.4, §12.4 | REQ-F-033, REQ-F-036 |
| 테마/언어 상태 | system-follow 초기 + 수동 변경 localStorage 고정, 언어 변경 위치 제한 | §5.6 | REQ-F-026 |
| 카드 슬롯 계약 | Normal 필수 슬롯/썸네일 6:1, Expanded 슬롯 분기(Test/Blog), front/back title 일치 | §6.1~6.6 | REQ-F-001, REQ-F-029 |
| 누락/불가용 정책 | required 누락 시 빈값 유지, optional tags 컨테이너 유지, unavailable blog 금지, unavailable test 진입 차단 | §6.7~6.8 | REQ-F-030 |
| 상호작용 모드 결정 | SSR 초기 tap-mode, mount 후 capability 동기화 | §4.2A | REQ-F-027 |
| 상태기계/우선순위 | PageState/CardState/HOVER_LOCK, 우선순위와 반응 정책 | §7.1~7.5 | REQ-F-034, REQ-F-035 |
| Expanded 모션 계약 | scale 1.1, transform-origin 규칙, opacity 1.0 고정, alpha 애니메이션 금지 | §8.1~8.4 | REQ-F-027 |
| Mobile Expanded 계약 | in-flow full-bleed, top jump 금지, page lock + inner scroll, X sticky, layer order | §9.1~9.4 | REQ-F-035 |
| 전환 잠금/복원 | CTA 시점 transition start, source GNB 유지, 완료 후 swap, scrollY 필수 복원 | §10.1~10.2 | REQ-F-031, REQ-F-032, REQ-F-036 |
| Test 핸드셰이크 | Q1 pre-answer 저장, landing ingress flag, instruction 독립 시작 규칙, consume/read 분리, rollback 3케이스 | §10.3~10.7 | REQ-F-003, REQ-F-028 |
| 텔레메트리/프라이버시 | 최소 이벤트셋, transition 상호배타, consent UNKNOWN->확정, anon ID 우선순위, PII 경계 | §11.1~11.6 | REQ-F-014, REQ-F-015 |
| 데이터 소스 | Fixture + Adapter, 최소 카드 수/다양성, required 누락 금지 | §11.7 | REQ-F-001, REQ-F-022 |
| 성능/A11y/릴리스 게이트 | reduced motion 범위, cursor 정책, build/hydration/playwright checklist | §12.1~12.4 | REQ-F-033, REQ-F-034, REQ-F-035 |

## 5) 구현 아키텍처 계획

### 5.1 라우팅/레이아웃 구조
- 최신 App Router 파일 규칙 기준으로 단일 루트 전략을 사용한다.
- `app/layout.tsx`
  - 전체 App Router root layout
  - `<html>`, `<body>`를 포함하고 전역 스타일/전역 provider shell만 담당
- `app/[locale]/layout.tsx`
  - locale 검증, i18n 메시지 주입, page-level shell/provider 담당
- `proxy.ts` (프로젝트 루트)
  - locale 매칭/리다이렉트 단일 진입점
- `app/`와 `src/app` 동시 운영 금지
- 라우트 표면
  - `/{locale}`: Landing
  - `/{locale}/test/[variant]/question`: Test question entry
  - `/{locale}/blog`: Blog
  - `/{locale}/history`: shell only

### 5.2 typed route 전략
- `typedRoutes: true` 전제
- route builder는 locale-free path만 반환
- locale 주입은 i18n 라우팅 계층 단일 책임
- `router.push/replace`, `Link href`에서 수동 문자열 결합 금지
- SSG 경로에서 `useSearchParams` 사용 시 Suspense 경계 또는 dynamic rendering 전략을 명시

### 5.3 페이지/컴포넌트 경계
- Landing Page Shell
  - Hero row + Main grid 구성
  - Hero는 정렬된 카드 목록 앞 N개로 구성하며 Main과 동일한 카드 동작 계약 적용
  - capability gate, card state orchestration
- GNB Layer
  - `LandingDesktopOrTabletNav`
  - `LandingMobileNav`
  - `TestNavDesktop`, `TestNavMobile`
  - `BlogDesktopOrTabletNav`, `BlogMobileNav`
- Card Layer
  - `CatalogCard` (type: `test|blog`, availability: `available|unavailable`)
  - `CardNormalFace`, `CardExpandedFaceTest`, `CardExpandedFaceBlog`
  - `UnavailableOverlay`
- Transition/Handshake Layer
  - `TransitionController`
  - `PreAnswerStore` + `TransitionCorrelation`
- Telemetry Layer
  - `EventQueue` + `ConsentResolver` + `AnonymousIdProvider`
- Data Layer
  - `LandingFixtureAdapter` (UI 모델 변환, hero 분리 포함)

### 5.4 GNB 동작 확정 규칙
- Desktop/Tablet 설정 레이어 open:
  - hover-capable이면 hover open
  - hover-capable이 아니면 click/focus open
- Desktop/Tablet 설정 레이어 close:
  - Esc / outside click / focus out
  - Tab/Shift+Tab focus out 시 즉시 close
  - trigger-layer 사이 hover gap 금지
- Mobile 햄버거:
  - fixed overlay + backdrop
  - body scroll lock
  - close transition 종료 시점에만 unlock

## 6) 상태/이벤트/데이터 흐름 설계

### 6.1 상태 모델
- `PageState`: `ACTIVE | INACTIVE | REDUCED_MOTION | SENSOR_DENIED | TRANSITIONING`
- `CardState`: `NORMAL | EXPANDED | FOCUSED`
- `InteractionMode`:
  - `TAP_MODE`
  - `HOVER_MODE` (`width >= 768 && hover: hover && pointer: fine`)
- `HOVER_LOCK`:
  - hover-capable에서만 활성
  - 대상 카드 외 입력 반응 차단 + `tabIndex=-1`

### 6.2 상태 우선순위 적용
- 우선순위: `INACTIVE > REDUCED_MOTION > TRANSITIONING > EXPANDED > HOVER_LOCK > NORMAL`
- 구현 원칙:
  - 상위 상태가 하위 상호작용을 덮어쓴다.
  - `TRANSITIONING` 중 카드/스크롤/입력 상태 변화 금지.
  - `TRANSITIONING` 시작 프레임의 시각 상태를 고정한다.
  - `INACTIVE`에서는 입력 기반 카드 반응/HOVER_LOCK 비활성.
  - `ACTIVE` 복귀 시 짧은 램프업 후 정상 반응으로 복귀.
  - `SENSOR_DENIED`는 sensor 의존 효과만 차단하고 핵심 카드 흐름은 유지.

### 6.3 카드 상호작용 흐름
- Hero row 카드와 Main grid 카드는 동일한 상호작용/CTA 게이팅 규칙을 적용한다.
- Available + Hover mode (`>=768` hover-capable)
  - hover enter(120~200ms) -> Expanded
  - CTA 활성화 시점에만 destination transition 시작
- Available + Tap mode
  - tap -> Expanded (Desktop/Tablet fallback 포함)
  - Mobile에서는 탭한 카드만 Expanded, backdrop/X로 닫힘
- Unavailable(Test)
  - Expanded 전이 없음
  - Hover mode: hover/focus 시에만 overlay
  - Hover mode: hover enter 120~200ms 유지 시 overlay 표시, out 시 0ms 해제
  - Hover mode: 글로벌 동시 overlay 금지(동시에 하나만 활성)
  - Tap mode: overlay 상시 표시
  - Overlay 시각 계약: black overlay + white "Coming Soon", 카드 정보 완전 차단 금지, focus ring 식별성 보장
  - CTA/네비게이션 항상 금지

### 6.4 모바일 full-bleed 흐름 (`width < 768`)
- Entry: 해당 카드만 in-flow full-bleed, top jump 금지
- Entry: 카드 폭 `100vw`, 컨테이너 패딩 상쇄
- During:
  - 전환 애니메이션 220~360ms
  - page scroll lock
  - expanded card 내부 스크롤만 허용(필요 시)
  - 타 카드 상호작용 차단
  - header `title + X` 1행, X sticky
  - layer order: `GNB > Expanded 카드 > backdrop > 기타 카드`
  - X 버튼은 backdrop보다 상위 레이어 유지
- Exit:
  - X 또는 backdrop 탭
  - 해당 카드만 Normal 복귀
  - 직전 스크롤/위치 자연 복귀
  - 자동 viewport 보정 스크롤 금지
  - unavailable 카드는 Expanded 진입/닫기 토글 대상에서 제외

### 6.5 전환/핸드셰이크 데이터 흐름
- Blog CTA:
  1) transition start(lock)
  2) correlation id(transitionId) 생성 + eventId 매칭
  3) `/blog?source=<cardId>` 이동
  4) complete/fail/cancel 상호배타 종료
- Test CTA(A/B):
  1) Q1 pre-answer 저장
  2) `variant+session` landing ingress flag 기록
  3) transition start(lock)
  4) `/test/[variant]/question` 이동
  5) instruction start 직후 consume
- Instruction 계약:
  - 동일 variant 최초 진입(랜딩/딥링크 공통)에서는 instruction 표시 필수
  - 동일 variant 재진입 시 instruction 재표시 금지
  - instructionSeen 여부는 Q1/Q2 시작 문항 결정 조건이 아님
- Pre-answer 계약:
  - read와 consume 분리(read 시 즉시 파기 금지)
  - instruction 생략 경로는 내부 test_start 시점 consume
  - 랜딩 전환 상관키 없는 유입에는 pre-answer 적용 금지
- Rollback 트리거
  - 사용자 취소
  - locale_duplicate 실패
  - 목적지 route 진입 실패(타임아웃/로드 실패)

### 6.6 Test 시작 문항 결정 규칙
- landing ingress flag 있음 -> instruction seen 여부와 무관하게 Q2 시작
- landing ingress flag 없음 -> Q1 시작
- instructionSeen은 시작 문항 결정 조건이 아님
- landing ingress flag 있음 -> instruction Start 이전 진행표시도 `Question 2 of N`
- 동일 variant 재진입으로 instruction 생략 시에도 위 Q1/Q2 규칙 동일 적용
- Q1 수정 가능, 최종 제출값이 결과 기준
- dwell time: 포그라운드 여부 무관 누적, 재방문 합산

## 7) 데이터 계약 계획 (Fixture + Adapter)

### 7.1 fixture 최소 조건
- Test 카드 4개 이상
- Blog 카드 3개 이상
- unavailable Test 카드 2개 이상
- unavailable Blog 카드 0개
- 다양성 케이스 포함
  - 긴 텍스트
  - 빈 tags
  - debug/sample fixture
- required 슬롯 누락 금지(데이터 단계)

### 7.2 adapter 출력 모델
- 공통 필드
  - `id`, `type`, `availability`, `title`, `subtitle`, `thumbnailOrIcon`, `tags`
- test expanded용
  - `previewQuestion`, `answerChoiceA`, `answerChoiceB`, `meta(3)`
- blog expanded용
  - `summary`, `meta(3)`, `primaryCTA`
- 파생 필드
  - `isHero`(앞 N개 판정), `sourceParam`

### 7.3 hero/main 배치 알고리즘
- 입력: fixture 배열(이미 정렬된 순서)
- 단계:
  1) 표시 대상 필터링(디버그 가시성 정책 반영)
  2) 앞 `heroCount`개를 hero row로 분리
  3) 잔여를 main grid에 배치
- `heroCount` 결정
  - Desktop: `availableWidth >= 1160 ? 3 : 2`
  - Tablet: `2`

### 7.4 슬롯 렌더/클램프 규칙
- Normal:
  - title/subtitle 1줄 truncate
  - thumbnail 6:1, `object-fit: cover`
  - tags 컨테이너는 값이 없어도 1줄 고정 유지
  - tags chip은 정의된 값만 렌더(빈 chip 금지)
  - front face CTA 금지
- Expanded:
  - title만 헤더 유지
  - subtitle/thumbnail/tags는 숨김이 아닌 미렌더링(또는 접근성 트리 비노출) 처리
  - Test: previewQuestion/answerChoice는 줄바꿈 허용, truncate 금지
  - Blog: summary 4줄 clamp, primaryCTA 1줄 truncate
- Missing slot:
  - required 값 누락 시 영역 삭제 금지, 빈값 렌더로 레이아웃 유지

## 8) 단계별 구현 계획 (순서 고정)

### Phase 1. 기반 계약 고정
- App Router 2-layer layout, `proxy.ts`, locale/typedRoutes 계약 구현
- route builder 및 URL 무결성 검증 유틸 구축
- SSG 경로 `useSearchParams` 안전 규칙(Suspense 또는 dynamic rendering) 적용
- 완료 기준
  - `app/` 단일 루트 + `proxy.ts` 배치 규칙 충족
  - 중복 locale URL 생성 경로 없음
  - 빌드 통과 + typed route 오류 0

### Phase 2. 도메인 모델/데이터 계층
- card/interaction/transition 타입 정의
- fixture + adapter + hero 분리 로직 구현
- 완료 기준
  - fixture 최소 수량/다양성 충족
  - required 슬롯 누락 없는 검증 통과

### Phase 3. 페이지 셸/GNB 뼈대
- Landing/Test/Blog/History shell 생성
- 컨텍스트별 GNB 교체 구조와 source->destination swap timing 연결
- Desktop/Tablet 설정 레이어 open/close 규칙(capability 분기 포함) 반영
- Mobile Test back(`history.back` 우선, 없으면 `/{locale}` fallback) 반영
- 완료 기준
  - 라우트별 GNB 구성 계약 반영
  - focus-out close, hover-gap 금지, mobile unlock 타이밍 규칙 반영
  - `/history` shell 접근 가능

### Phase 4. 반응형 레이아웃/그리드
- container/padding/gap/threshold/minCardWidth/vertical-rhythm 규칙 적용
- hero/main 2-stage 및 1열 mobile 구현
- 완료 기준
  - breakpoint별 컬럼 수 계약 충족
  - Hero row(앞 N개)와 Main grid 카드 동작 계약 동일 적용
  - `availableWidth` 계산 컨테이너 내부폭 기준 일치

### Phase 5. 카드 콘텐츠 계약
- Normal/Expanded 슬롯 렌더링
- 썸네일 6:1, text clamp, missing slot 처리 적용
- unavailable overlay 규칙 적용
- 완료 기준
  - front/back title 불일치 없음
  - Expanded에서 subtitle/thumbnail/tags 미렌더링 보장
  - unavailable overlay 시각/동시성/focus ring 계약 충족

### Phase 6. 상호작용 모드 + 상태기계
- capability gate(SSR tap-mode 시작 -> mount 후 동기화)
- PageState/CardState/HOVER_LOCK reducer/store 구현
- keyboard path/포커스 제어 포함
- 완료 기준
  - `width/capability` 조합별 트리거 계약 100% 충족
  - HOVER_LOCK 중 비대상 카드 반응/CTA 차단 확인
  - ACTIVE 램프업/TRANSITIONING 시작 프레임 고정/SENSOR_DENIED 반응 반영

### Phase 7. 모션/시각 계약
- Expanded motion, transform-origin, opacity 1.0 고정
- alpha 애니메이션 금지, backdrop/dim 금지(Desktop/Tablet)
- reduced-motion 대체 경로 구현
- 완료 기준
  - 모션 수치 범위 계약 충족
  - reduced-motion 시 대형 이동 없음
  - 내부 이중 박스 시각 금지 반영

### Phase 8. 모바일 full-bleed/레이어
- in-flow full-bleed(`100vw` + 패딩 상쇄), scroll lock, inner scroll, sticky X, layer order 구현
- close 시 unlock 타이밍(transition 종료 후) 반영
- 완료 기준
  - `GNB > Expanded > backdrop > others` 계층 보장
  - top jump/자동 viewport 보정 스크롤 없음
  - unavailable 카드는 모바일 Expanded 토글 대상 제외

### Phase 9. 전환 잠금/핸드셰이크
- transition correlation/idempotency
- test pre-answer save/read/consume/rollback, blog source query 적용
- locale_duplicate 실패 처리 연결
- instruction 최초표시/재진입 미표시 및 시작문항 독립 규칙 반영
- 완료 기준
  - eventId/transitionId 매칭, 종료 이벤트 상호배타 보장
  - fail/cancel/complete 상호배타 종료 이벤트 보장
  - rollback 3케이스 재현 가능

### Phase 10. 텔레메트리/프라이버시
- 최소 이벤트셋 구현
- consent state machine(SSR UNKNOWN, 기본 확정 OPTED_IN), anon id 정책 적용
- payload 경계(PII/원문 금지) 적용
- 완료 기준
  - Landing view/Transition/Test 이벤트 횟수 계약 충족
  - anon id 생성 우선순위(randomUUID -> getRandomValues -> fallback) 반영
  - UNKNOWN 유예/확정 후 flush-discard 동작 검증
  - core UX는 tracking 실패와 독립

### Phase 11. QA 게이트 자동화
- build/hydration/typedRoutes 검사
- Playwright 핵심 스모크(중복 locale URL 0건, interaction mode, handshake, rollback)
- 완료 기준
  - §12.4 체크리스트 통과
  - blocking 조건(경고/중복 URL/핵심 시나리오 실패) 0건

## 9) 테스트/검증 계획

### 9.1 정적 검증
- lint/typecheck/build
- hydration warning 0건
- App Router 루트 단일성(`app/` only) 및 `proxy.ts` 위치 규칙 검증
- route builder 단위 테스트
  - `landing/blog/history/test-question` 경로 생성
  - locale prefix 단일성 보장
- SSG 경로 `useSearchParams` 사용 지점의 Suspense/dynamic 전략 명시 여부 검증

### 9.2 동작 검증(Playwright)
- URL 무결성
  - Home/History/Blog 이동 및 카드 CTA 이동에서 `/en/en`, `/kr/kr` 0건
- Settings UI
  - Desktop/Tablet: hover-capable hover-open, non-hover-capable click/focus-open
  - close 규칙(Esc/outside/focusout 즉시), hover-gap 없음
  - Mobile 햄버거 overlay/backdrop/scroll lock/unlock 타이밍
- Card/Expanded
  - Hero row 카드와 Main grid 카드 동작 동일성
  - 모드별 트리거 분기
  - unavailable overlay 노출 규칙
  - unavailable overlay 글로벌 동시 노출 금지
  - HOVER_LOCK 중 비대상 카드 `tabIndex=-1`
  - Mobile full-bleed 위치 유지/X sticky
- Transition/Test handshake
  - pre-answer 저장/consume 시점
  - landing ingress flag 기반 Q2 시작
  - instruction Start 전 `Question 2 of N` 표시
  - instruction 최초 표시/재진입 미표시 규칙
  - 랜딩 상관키 없는 유입에서 pre-answer 미적용
  - rollback 3케이스
- Telemetry/Privacy
  - transition start/complete|fail|cancel 상호배타 + transitionId 매칭
  - consent UNKNOWN 유예 -> OPTED_IN flush / OPTED_OUT discard
  - payload에 원문 텍스트/PII 부재 검증

### 9.3 회귀 검증 포인트
- theme 초기(system) -> 수동 변경 영속성
- language 변경 반영 위치 제한(Desktop layer / Mobile hamburger)
- cursor policy(커스텀 커서 미사용, pointer 대상 제한)

## 10) 리스크 및 대응
- 레이아웃 스로싱
  - 리스크: Expanded 높이 변화 + row 고정 정책 충돌
  - 대응: 측정 최소화, active row 기준 높이 스냅샷 사용
- capability 변동
  - 리스크: 하이브리드 기기에서 hover/tap 모드 튐
  - 대응: 모드 전환 시점에 상태 reset 규칙 명시(transition 중 전환 금지)
- 포커스 안정성
  - 리스크: HOVER_LOCK와 모바일 overlay에서 focus 유실
  - 대응: lock/unlock 시 focus 복귀 대상 저장
- 전환 idempotency
  - 리스크: 중복 CTA로 transition 이중 실행
  - 대응: correlation id + TRANSITIONING guard
- hydration 불일치
  - 리스크: 초기 렌더에서 storage/window/time 의존 분기
  - 대응: 중립 초기 상태 + mount 후 동기화

## 11) 완료 정의(Definition of Done)
- `req-landing` Section 1~12 기준 MUST 항목 충족
- 본 계획의 사전 의사결정(최신 App Router 규칙, Hero 해석, Tablet open 규칙 포함) 구현 반영
- 빌드/하이드레이션/URL 무결성/핸드셰이크 롤백 테스트 통과
- 랜딩 범위 외 항목(Out of Scope)이 코드/기능 범위로 새어 나오지 않음
