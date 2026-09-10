# UX 리팩터 · step 1 — 스크롤은 확장을 닫지 않는다 · §8 을 계약과 조정값으로 가른다

**Date:** 2026-09-10 (2026-09-10 리뷰 반영 개정) · **Task mode:** Implementation · **Branch:** `claude/scroll-hold-and-contract-tiers` · **Wave:** rebaseline 프로그램 밖(5c 착지 뒤, 6 단계 착수 전) · **Opens `src/**`:** yes

**High-Risk 파일:** `src/features/landing/grid/use-hover-intent-controller.ts`. **SSOT 개정:** `docs/req-landing.md` §8.2 · §8.3 · §14.2 — 이 계획의 절반은 문서 개정이며 사용자가 2026-09-10 에 승인했다. **Ask-First 파일:** `docs/blocker-traceability.json` — **여는 것이 계획이 아니라 비상구다**(아래 P1 참조). `docs/design/ds/**` · `globals.css` · 시각 baseline 은 열지 않는다.

---

## Shared frame — 이 문서 혼자 읽어도 되도록 반복한다

**운영 방침 변경(2026-09-10).** 트랜지션·마이크로인터랙션·UX 판단에서 SSOT 요구사항 정의서보다 구현자의 판단을 우선하되, 기존 정의나 구현보다 나은 대안을 발견하면 **반드시 수면 위로 올려 결정 안건으로 제시한다.** 이 계획은 그 방침의 첫 적용이다.

**두 묶음.** step 1(이 문서) = R1 스크롤 유지 + R7 계약 계층 분리. step 2(`-step2-`) = R2 배너 겹침 · R3 reduced-motion · R4 spacer 과다 · R5 포커스 링 지면색. step 1 의 R7 이 step 2 의 R3 를 정당화하므로 순서를 바꾸지 않는다.

**Hard stops.** `BQ-07` 시각 baseline 재생성 금지 · `theme-matrix-smoke` 실행 금지 · `--update` 금지. 워크트리 금지, clone 만. `docs/design/ds/**` 은 열지 않는다.

**절 번호를 옮기지 않는다.** `tests/unit/contract-citations.test.ts:195` 가 `문서.md §N` 인용이 실재하는 절을 가리키는지 검사한다. `### 8.2` · `### 8.3` 제목 줄은 글자 그대로 보존하고 본문만 재구성한다.

---

## R1 — 스크롤은 확장을 닫지 않는다

### 지금 무엇이 잘못돼 있나

**실측 (2026-09-10, chromium preview 빌드, 1280×720).** 아래 행 카드를 확장하면 `top=469 bottom=721` 로 뷰포트(720)를 넘는다. 방금 편 카드의 아랫부분을 보려고 휠을 굴리면:

```
휠 60px → steady · 60px → steady · 60px → closing · 60px → idle
```

**180px 만에 닫힌다.** 포인터는 가만히 있는데 카드가 밑에서 빠져나가 `mouseout` 이 나고, §8.2 의 「실행 시점의 최신 경계 판정」이 그것을 이탈로 판정한다. 사용자가 스크롤하는 의도는 「그 콘텐츠를 더 보겠다」인데 제품은 정반대로 반응한다. `consent-smoke:152/176` 의 간헐적 붉음은 이 동작의 자동화 버전이었을 뿐이며 원본은 일상 경로다.

### 무엇으로 바꾸나 — 사용자 결정 2026-09-10

**스크롤로 카드가 포인터 밑에서 빠져나가도 열린 채 유지하고, 다음 실제 포인터 이동에서 재판정한다.** 유예를 두고 다시 닫는 대안은 기각됐다 — 스크롤한다는 것이 곧 「더 보겠다」이므로 유예 뒤에 닫는 것은 같은 오해를 늦출 뿐이다.

### 어떻게 가르나 — 이벤트 순서가 판별자다

실측한 순서는 `pointerout → pointerover → mouseout → mouseover → pointermove` 다. 포인터가 **실제로 움직여서** 생긴 이탈에는 곧이어 `pointermove` 가 따라오고, 스크롤이 만든 이탈에는 따라오지 않는다. 그 차이를 카운터 하나로 읽는다.

| 자리 | 무엇 |
|:---|:---|
| `pointerMoveSeqRef` (신규) | **`pointermove` 에서만** 1 증가 |
| `onMouseLeave` | 이탈 시점의 seq 를 잡아 collapse 예약에 실어 보낸다. 예약 자체는 지금과 같다 |
| collapse `run` 가드 | seq 가 그 사이 **증가하지 않았으면** collapse 하지 않고 `scrollHeldCardVariantRef` 에 그 카드를 적고 반환한다 |
| `recordPointerInput` | hold 가 걸린 카드가 있으면, 새 포인터 위치가 그 카드 경계 **안**이면 hold 해제(계속 열림), **밖**이면 collapse 예약 후 hold 해제 |

**seq 는 `pointermove` 전용이다.** `recordPointerInput` 은 window `pointermove` **와 `mousedown`** 둘 다에 물려 있다(`use-landing-interaction-controller.ts:516-528`). 그 함수 안에서 seq 를 올리면 클릭이 「포인터가 움직였다」로 세어져, 스크롤 hold 중에 들어온 클릭 한 번이 이동 없이 collapse 를 성립시킨다. `recordPointerInput` 이 이벤트 종류를 보고 `pointermove` 일 때만 올린다.

**정상 경로의 타이밍은 바뀌지 않는다.** 포인터가 움직여 생긴 이탈은 `pointermove` 가 같은 프레임(<16ms) 안에 도착하고 collapse 유예는 140ms 이므로, `run` 시점에는 seq 가 이미 증가해 있다. 즉 이 가드는 **스크롤 경로에서만 발화한다.**

### hold 를 해제하는 조건 — 사용자 결정 2026-09-10

⑴ **다음 실제 포인터 이동** — 경계 안이면 유지, 밖이면 collapse.
⑵ **카드가 뷰포트를 완전히 벗어나면 해제하고 그 시점 판정으로 collapse.** 「조금 스크롤해 읽는다」와 「지나쳐 버렸다」를 가시성으로 가른다.
⑶ `cancelPendingHoverIntent` · `clearHoverTimer` · 카드가 다른 이유로 접힐 때(Escape · handoff · 전환 시작) — hold 가 남아 다음 pointermove 에서 엉뚱한 카드를 닫는 일이 없어야 한다.

**⑵ 가 없으면 무엇이 남는가.** 사용자가 카드를 열고 한참 아래로 스크롤해 다른 행을 읽으면 그 카드는 화면 밖에서 열린 채 남는다. 결과 둘: `req-landing §14.2` 항목 4 의 **「Expanded/handoff 활성 중 grid plan freeze」** 가 계속 걸리고, 확장 본문의 답변 버튼·CTA 가 **화면 밖에서 탭 스톱으로 남는다**(`getExpandedFocusableElements` 가 그것들을 포커스 대상으로 센다). 키보드 사용자가 Tab 으로 보이지 않는 곳에 도달한다 — a11y 문제다.

**⑵ 의 수단: hold 가 걸린 동안만 다는 passive `scroll` 리스너 + `getBoundingClientRect` 교차 판정.** `IntersectionObserver` 를 쓰지 않는 이유는 둘이다. 이 저장소에 런타임 선례가 없고(주석 TODO 둘뿐), jsdom 이 그것을 제공하지 않아 단위 검사가 stub 을 하나 더 져야 한다. 반면 rect 교차 판정은 같은 파일의 `isPointerInsideCardBoundary` 가 이미 쓰는 방식이고 `ResizeObserver` 관측자 패턴 선례도 다섯 곳에 있다. 리스너는 hold 중에만 존재하며 하는 일은 rect 하나를 읽는 것이다.

### 경쟁하는 경로의 우선순위

스크롤 뒤 포인터 밑에 **다른 카드**가 와 있을 수 있다(2026-09-10 진단에서 실제로 `creativity-profile` 이 들어왔다). 그 상태에서 포인터가 1px 움직이면 B 의 `onMouseEnter`(handoff → A 를 collapse)와 A 의 hold 재판정이 같은 프레임에 경쟁한다. **handoff 가 우선한다** — hold 재판정은 handoff 가 이미 A 를 정리한 경우 no-op 이어야 하며, 두 경로가 각각 collapse 를 예약해 이중 전이를 만들면 안 된다.

### 범위 밖 — resize

`req-landing` 은 **「Expanded 활성 중 폭 변경 시 강제 종료 → Normal settled → 배치 재계산」**(§14.2 항목 4 · §6 Automated 5·11)을 요구한다. resize 도 포인터 이동 없이 경계를 바꾸므로, 새 가드가 무심코 그 강제 종료를 막으면 **계약을 깬다.** hold 는 **스크롤 한정**이며 resize 경로는 지금 동작을 그대로 유지한다. 검증에 resize 강제 종료를 명시적으로 포함한다.

### 왜 이 자리인가

지난 수정(`1a1ceb7`)이 `recordPointerInput` 에 이미 「직전 카드 → 지금 카드」 전이로 유실된 leave 를 복구하는 경로를 세워 뒀다. R1 의 「다음 실제 포인터 이동에서 재판정」은 **그 경로가 그대로 하는 일**이다. 새 기전을 만드는 것이 아니라 hold 상태 하나를 얹는다.

---

## R7 — §8 을 계약과 조정값으로 가른다

### 왜 필요한가

§8.3 첫 줄이 **「본 섹션 시간 범위는 권장이 아니라 검증 대상이다」** 라고 못 박고, §8.2 는 `120~200ms` · `100~180ms` · 「최신 경계 판정」까지 계약으로 고정한다. 그 문장들 때문에 R1 이 **계약 위반**이 되어, 운영 방침이 요구하는 UX 판단이 들어갈 자리가 없다. R1 은 이 분리가 있어야 정당하게 착지한다.

### 어디를 가르나 — 사용자 승인 경계 그대로

| 계약으로 남긴다(불변식) | 조정값으로 강등한다 |
|:---|:---|
| 열림/닫힘 대칭축·동일 곡선 · 닫힘 중 높이 non-increasing · 완료 시 `0px` 복귀 · 플리커 금지 · reduced-motion 준수 · `0ms` 는 handoff source 한정 · 키보드/포인터 동등성 · 단일 timer + intent token · 실행 직전 대상 재검증 | 확장 지연 `160ms` · collapse 유예 `140ms` · phase `280ms` · stagger `40/100/160ms` · **collapse 를 유발하는 입력의 정의** |

**강등은 값을 지우는 것이 아니다.** 조정값은 **문서에 지금 그대로 적힌 채 남는다**. 바뀌는 것은 값이 아니라 **누가 그것을 바꿀 수 있는가**뿐이다 — 계약값은 개정에 사용자 승인이 필요하고, 조정값은 구현자가 UX 판단으로 바꾸되 **바꾸는 즉시 `docs/decision-register.md` 에 등재한다.** 문서에서 값을 제거하는 것은 이 강등이 허용하지 않는다.

### 문서에서 바뀌는 줄

| 위치 | 무엇 |
|:---|:---|
| `req-landing.md` §8.2 | 불릿을 두 무리로 재구성. 「hover leave 로 경계를 벗어나면 collapse」를 **「포인터 이동으로 경계를 벗어나면 collapse」**로 좁히고, 스크롤이 만든 경계 변화는 유지 후 재판정이며 **뷰포트 완전 이탈에서 해제**임을 적는다. resize 강제 종료는 불변임을 함께 적는다 |
| `req-landing.md` §8.3 | 첫 줄 「권장이 아니라 검증 대상」을 두 계층 선언으로 교체. 시간·stagger 값은 조정값 무리로(값은 그대로 유지) |
| `req-landing.md` §14.2 항목 13 | `Hover-out Collapse Independence` 문구의 「최신 경계 판정」을 새 규칙에 맞게. 릴리스 블로킹 지위는 유지 |
| `req-landing.md` 동기화 의무(line 68) | 「Desktop hover-out collapse 경계/유예 정책 변경 시 Section 8.2, 14.2 를 동기화한다」는 그대로 유효하므로 유지 |
| `docs/decision-register.md` | **`## BQ-39` 는 이 계획서와 같은 커밋에 이미 등재됐다** — 결정이 구현에 앞서기 때문이다. step 1 은 그 절을 새로 만들지 않고 **구현 결과와 실측을 덧붙인다**. 변경 이력에도 한 줄이 이미 있다 |

---

## 바꾸는 파일

| 파일 | 무엇 |
|:---|:---|
| `src/features/landing/grid/use-hover-intent-controller.ts` | seq(`pointermove` 전용) · `scrollHeldCardVariantRef` · `run` 가드 · pointermove 재판정 · 뷰포트 이탈 해제 |
| `src/features/landing/grid/use-landing-interaction-controller.ts` | `recordPointerInput` 에 이벤트 종류를 넘기는 자리(필요할 때만) |
| `tests/unit/landing-interaction-controller-handlers.test.ts` | 결정론적 회귀 검사 6 건(아래) |
| `tests/e2e/state-smoke.spec.ts` | 스크롤 유지·왕복 E2E 2 건 |
| `docs/req-landing.md` | §8.2 · §8.3 · §14.2 |
| `docs/decision-register.md` | 이미 있는 `## BQ-39` 에 구현 결과 덧붙이기 |
| `docs/LESSONS_LEARNED.md` | 등재 여부 판정. 등재 불요면 보고에 한 줄 남긴다(`AGENTS.md §9`) |

**손대지 않되 반드시 확인하는 파일** — `tests/e2e/grid-smoke.spec.ts` 의 `assertion:B13-hover-collapse` 와 `tests/unit/landing-hover-intent.test.ts`. 둘 다 `docs/blocker-traceability.json:128-137` 이 blocker 13 으로 붙들고 있는 **릴리스 블로킹 추적 자산**이며, 이 계획이 바꾸는 바로 그 동작을 지킨다. 읽어 본 바로는 그 E2E 가 `unavailableCard.hover()` — 실제 포인터 이동 — 로 collapse 를 유발하므로 R1 후에도 통과할 것으로 보이지만, **「통과할 것으로 보인다」는 계획이 아니다.** 둘을 명시적 확인 대상으로 돌리고, 붉어지면 **멈추고 보고한다** — `docs/blocker-traceability.json` 은 Ask-First 이므로 추적 항목을 손대는 것은 이 계획의 권한 밖이다.

---

## 회귀 검사

**결정론적 고정은 단위 검사가 한다** — 브라우저에서는 「제거와 다음 hit-test 사이」 같은 시점 경쟁이 섞이므로(원장 `L14`) 조건을 jsdom 에서 직접 만든다. 여섯 다 `landing-interaction-controller-handlers.test.ts` 에 둔다.

1. **hold** — 확장 후 `onMouseLeave` 만 보내고 window `pointermove` 는 보내지 않는다. 유예를 넘겨도 **열린 채**.
2. **재판정 → 닫힘(정상 경로) · 시점까지** — `onMouseLeave` 뒤 카드 밖 좌표로 `pointermove`. **유예 −1ms 에서 아직 열려 있고 +1ms 에서 접힌다**를 둘 다 단언한다. 접힘 여부만 보면 「정상 경로 타이밍 무변경」이라는 주장이 검사되지 않는다.
3. **재판정 → 유지** — hold 중 카드 **안** 좌표로 `pointermove`. 열린 채이고 hold 가 해제된다.
4. **뷰포트 완전 이탈 → 해제·닫힘** — hold 중 카드 rect 를 뷰포트 밖으로 만들고 `scroll` 을 보낸다. 접힌다.
5. **hold 누수 없음 · handoff 우선** — hold 중 다른 카드로 handoff 가 일어나면 hold 가 지워지고, 이후 pointermove 가 이중 collapse 를 만들지 않는다.
6. **tap 모드 무영향** — `interactionMode === 'tap'`(width≥768 fallback)에서 위 경로가 전부 no-op 이고 기존 동작이 그대로다.

**E2E 2 건** — 둘 다 `state-smoke.spec.ts`, 시점 경쟁이 아니라 **입력 종류**로 갈리므로 결정론적이다.

- **유지**: 1280×720 에서 아래 행 카드를 확장하고 휠 180px → `steady`(수정 전 `idle`).
- **왕복**: 이어서 마우스를 카드 밖으로 실제 이동 → 평소처럼 `closing → idle`. 사용자가 실제로 얻는 것은 「스크롤해 읽고 나서 치우면 정상적으로 닫힌다」이고, 그 왕복이 검사되지 않으면 절반만 고친 것이다.

**기존 자산 확인** — `assertion:B13-hover-collapse`(E2E) · `landing-hover-intent.test.ts`(단위) · **resize 강제 종료**(§6 Automated 5·11 을 덮는 기존 검사) 셋이 수정 후에도 초록임을 확인하고 결과를 보고에 적는다.

**고장 주입** — 새 가드를 되돌린 상태에서 1·3·4·5 가 붉고 2·6 은 초록이어야 한다(2 는 기존 동작, 6 은 무영향 경로).

---

## Impact assessment

- **shared shell / GNB** — 열지 않는다. 변경은 랜딩 그리드 hover 컨트롤러와 그것을 물리는 한 자리.
- **localization** — 문자열·레이아웃 무관.
- **a11y** — 키보드 경로는 `hoverLock.keyboardMode` 가 지키고 이 변경은 `interactionMode !== 'hover'` · 모바일에서 빠져나온다. **개선 방향이다** — 스크롤로 콘텐츠가 사라지지 않고, hold 해제 조건 ⑵ 가 화면 밖 탭 스톱을 막는다.
- **state contracts** — `CARD_COLLAPSE` 의 발화 **조건**만 좁힌다. 이벤트·리듀서·상태 모양은 그대로. `grid plan freeze`(§14.2 항목 4)는 해제 조건 ⑵ 로 무한 유지되지 않는다.
- **core user flow** — 랜딩에서 카드를 열고 읽는 경로가 직접 개선된다. 진입(answer choice → test) 경로는 무변경.
- **위험 다섯 차원(High-Risk 파일)** — 커밋에 적는다. usability(개선) · a11y(개선) · responsiveness(resize 계약 불변 확인) · performance(hold 중에만 존재하는 passive 리스너 하나, 하는 일은 rect 하나) · design-system consistency(시각 토큰 미개방).

## 검증 명령

```bash
npm run lint && npm run typecheck && npm test && npm run build
PLAYWRIGHT_SERVER_MODE=preview npx playwright test --project=chromium --workers=1 tests/e2e/state-smoke.spec.ts tests/e2e/grid-smoke.spec.ts
PLAYWRIGHT_SERVER_MODE=preview npx playwright test --project=chromium --workers=1 tests/e2e/a11y-smoke.spec.ts tests/e2e/consent-smoke.spec.ts tests/e2e/gnb-smoke.spec.ts tests/e2e/qualifier-overlay.spec.ts tests/e2e/routing-smoke.spec.ts tests/e2e/transition-telemetry-smoke.spec.ts
PLAYWRIGHT_BASE_URL=… npx playwright test --project=chromium --repeat-each=8 tests/e2e/consent-smoke.spec.ts:152 tests/e2e/consent-smoke.spec.ts:176   # 인수 조건 3
node output/probe/ux-audit3.mjs      # 1280×720 휠 스크롤 재측정
```

`theme-matrix-smoke` 는 돌리지 않고 `--update` 도 치지 않는다(`BQ-07`, `L11`). E2E 실행 뒤 생성된 baseline 을 지워 추적 수와 디스크 수를 맞춘다.

## 인수 조건

1. 단위 검사 6 건이 고장 주입에서 1·3·4·5 붉고 2·6 초록, 복구 후 전부 초록.
2. 1280×720 휠 180px 에서 카드가 `steady` 유지(수정 전 `idle`)이고, 이어진 실제 포인터 이동에서 평소처럼 닫힌다.
3. **`consent-smoke:152/176` 이 병렬 `--repeat-each=8` 에서 0 실패** — 수정 전 16 중 2~3. R6 가 R1 로 해소되는지가 여기서 갈린다. 해소되지 않으면 별건으로 남기고 보고한다.
4. 정상 경로 타이밍 무변경 — 검사 2 의 유예 −1ms/+1ms 단언으로 고정.
5. **`assertion:B13-hover-collapse` · `landing-hover-intent.test.ts` · resize 강제 종료 검사가 전부 초록.** 하나라도 붉으면 멈추고 보고한다.
6. 기본 게이트 초록 + chromium E2E(theme-matrix 제외) 초록.
7. 값 불변 — 랜딩 전면 계산값 지문 불일치 0. 이 변경은 **언제 닫히는가**만 바꾸고 무엇이 어떻게 보이는가를 바꾸지 않는다.

## 사용자 확인이 필요한 결정

없다 — R7 의 경계선, R1 의 동작 정의, hold 해제 조건 ⑵ 를 2026-09-10 에 사용자가 확정했다. 다만 **인수 조건 3 또는 5 가 실패하면 멈추고 보고한다.**

## Execution prompt

> Read this document and `docs/LESSONS_LEARNED.md` L06 · L09 · L10 · L14 · L15. Write the six deterministic unit regressions and the two E2E first and watch them fail, then add the pointermove-only seq counter, the scroll hold, and the viewport-exit release to `use-hover-intent-controller.ts`. Values never change — only when a card collapses. Confirm `assertion:B13-hover-collapse`, `tests/unit/landing-hover-intent.test.ts` and the resize force-close stay green, and stop and report if any goes red — `docs/blocker-traceability.json` is Ask-First. Then rewrite `req-landing.md` §8.2/§8.3/§14.2 into the two tiers without moving any section number and without deleting any demoted value, and append the implementation outcome to the already-registered `## BQ-39` rather than creating it. Land as one squash, move this plan to `docs/done/`, add one 변경 이력 row. Never run `theme-matrix-smoke`.
