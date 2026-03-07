# 1. Executive Summary
- 현재 구현은 **Phase 1~7 일부(라우팅/GNB/그리드/카드/spacing/기본 상태기계)** 까지는 실동작과 자동화가 갖춰져 있고, `npm run qa:gate` 3/3도 통과했습니다.
- 다만 SSOT([req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md)) 기준으로 보면, **Phase 8 진입 전 필수 계약(특히 14.3 블로커 6/8/9/13/14/15/16/17/18/19)** 이 대거 미구현/미검증 상태입니다.
- 가장 치명적인 결함은 `Desktop/Tablet handoff·hover-out 독립`, `Mobile full-bleed lifecycle`, `Transition handshake/rollback/restoration`, `Telemetry/Consent/Correlation`, `Traceability closure`입니다.
- 또한 접근성 핵심 계약(1차 트리거 시맨틱 요소 강제, 카드 shell focus 가시성)도 현재 코드에서 위반/미흡 신호가 명확합니다.
- 결론적으로 **“게이트 통과”와 “요구사항 충족”이 분리**되어 있으며, 현 상태는 Phase 8 착수 전 선행정리가 필요합니다.

가장 치명적인 문제(요약):
- 블로커 #13(hover-out/handoff/core motion 분리) 미충족 가능성 매우 높음.
- 블로커 #14(모바일 OPENING/OPEN/CLOSING/NORMAL + baseline/y-anchor) 미구현.
- 블로커 #15/#16/#17(전환 terminal 상호배타, rollback cleanup closure, return restoration) 미구현.
- 블로커 #9/#18(동의 게이트/최종 payload 경계) 미구현.
- 블로커 #19(traceability 매핑 공백 0) 미충족.

가장 중요한 디자인/UX 완성도 문제(요약):
- Expanded 상태가 in-flow로 동작해 **비대상 카드/행 안정성**을 깨뜨릴 구조적 위험.
- Card shell 기준 focus 시각 경계/가시성 규약이 CSS에서 사실상 부재.
- 상태 전환(hover/focus/expanded)의 지각적 연속성이 약해 “같은 카드 상태 변화”로 인지되기 어려움.
- 다크모드/상태별 대비 품질을 보장하는 자동화 매트릭스가 없음.
- 레이어 우선순위(Expanded top-layer, overlay/readability) 계약 증빙이 부족.

---

# 2. Audit Method
- 기준 문서:
  - SSOT: [req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md)
  - 구현 계획: [dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md)
  - 체크리스트: [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md)
  - 전역 참고: [requirements.md](/Users/woohyeon/Local/VibeTest/docs/requirements.md)
- 코드/검증 감사 범위:
  - App Router/i18n/proxy/route builder, GNB, grid/card/state, CSS, unit/e2e/qa scripts 전체를 라인 단위로 대조.
  - 실제 게이트 실행 확인: `npm run qa:gate` 3회 연속 PASS 확인.
- 판정 원칙:
  - PASS: 문서 계약 + 코드 + 자동 단언이 동시에 닫힌 경우만.
  - FAIL: 명시 요구사항 위반/블로커 미충족.
  - 잠재 리스크: 구현은 있으나 계약 안전성/회귀 저항성이 부족.
  - 검증 불충분: 근거 자동화가 없어 안전 단정 불가.
- 점수 스케일:
  - 모든 지표 1~5(5가 높음/위험 큼, 단 `Implementation Effort`는 5가 공수 큼).
- 디자인 완성도 별도 판정:
  - 정렬/리듬/위계/상태 가시성/모션 지각/대비/레이어링/읽기 경험을 독립 축으로 평가.

---

# 3. Expected Contract Snapshot (Pre-Code Audit View)
- 최상위 판정 기준:
  - SSOT 우선, 특히 `§3.2 동기화`, `§14.3 블로커 1~19`, `§14.4 traceability closure`.
- 주요 release blocker 위험 축:
  - #13 hover-out/handoff, #14 mobile baseline/y-anchor, #15~#17 transition/rollback/restoration, #9/#18 telemetry-consent-payload, #19 매핑 공백.
- 체크리스트 미완료/불안 축:
  - [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md): `§3 spacing 일부`, `§4~§7 후반`, `§8 traceability`, `§9 gate 정의` 다수 미완료.
- 구현 계획상 핵심 리스크 축:
  - [dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md): Phase 8~11(모션/모바일/핸드셰이크/텔레메트리/traceability) 미반영 시 블로커 직결.
- 디자인 완성도 취약 예상 축:
  - Expanded 레이어·geometry isolation, focus ring/shell boundary, 모션 연속성, 다크모드 상태 품질, mobile full-bleed 체감 안정성.

---

# 4. Key Findings by Domain

## 1. Routing / i18n / Layout / 404
- PASS 요약:
  - locale prefix 정책, proxy 단일 엔트리, typed routes, 404 이원 전략은 구현/테스트가 잘 맞음.
  - 근거: [proxy.ts](/Users/woohyeon/Local/VibeTest/src/proxy.ts), [proxy-policy.ts](/Users/woohyeon/Local/VibeTest/src/i18n/proxy-policy.ts), [route-builder.ts](/Users/woohyeon/Local/VibeTest/src/lib/routes/route-builder.ts), [routing-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/routing-smoke.spec.ts)
- FAIL / 리스크:
  - locale별 `<html lang>`이 SSR 시점에 즉시 반영되지 않고 client effect 보정 방식.
  - 근거: [layout.tsx](/Users/woohyeon/Local/VibeTest/src/app/layout.tsx):15, [locale-html-lang-sync.tsx](/Users/woohyeon/Local/VibeTest/src/i18n/locale-html-lang-sync.tsx):8
- 검증 불충분:
  - locale 전환 직후 접근성 툴 기반 `lang` 일관성 자동 단언 부재.

## 2. Grid / Breakpoints / Underfilled row
- PASS 요약:
  - wide/medium/narrow/tablet/mobile 컬럼 규칙 및 underfilled 시작측 정렬 자동화 존재.
  - 근거: [layout-plan.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/layout-plan.ts), [landing-grid-plan.test.ts](/Users/woohyeon/Local/VibeTest/tests/unit/landing-grid-plan.test.ts), [grid-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/grid-smoke.spec.ts)
- FAIL / 리스크:
  - Expanded/handoff 활성 중 “grid plan freeze + non-target 0px 안정성” 계약은 아직 구조적으로 보장되지 않음.
  - 근거: req `§6.7(3)(4)`, `§14.3-4`
- 검증 불충분:
  - 반복 100회 상호작용 누적 오차 자동 단언 부재.

## 3. Card slots / Text / Thumbnail / Meta / CTA
- PASS 요약:
  - Normal 슬롯 순서, Expanded 슬롯 분기, thumbnail ratio, subtitle clamp, meta 포맷은 기본 충족.
  - 근거: [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx), [landing-card-contract.test.ts](/Users/woohyeon/Local/VibeTest/tests/unit/landing-card-contract.test.ts)
- FAIL / 리스크:
  - Test CTA(A/B)가 전환 시작 트리거로 연결되지 않음.
  - Blog CTA가 article 식별자 handoff 없이 고정 `/blog`로 이동.
  - 근거: [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):209, :253; req `§8.6`, `§13.3`, `§13.4`
- 검증 불충분:
  - subtitle ellipsis “시각 노출”을 스크린샷 diff로 검증하지 않음(req `§6.6`).

## 4. Normal spacing model / `base_gap + comp_gap` / row consistency
- PASS 요약:
  - `base_gap + comp_gap`, row-local natural height 산정, 금지 패턴 정적검사(autospace/filler/pseudo) 존재.
  - 근거: [spacing-plan.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/spacing-plan.ts), [check-phase6-spacing-contracts.mjs](/Users/woohyeon/Local/VibeTest/scripts/qa/check-phase6-spacing-contracts.mjs)
- FAIL / 리스크:
  - 정상 상태는 맞아도 Expanded/handoff 프레임에서 `needs_comp=false comp_gap=0` 불변성 보장은 미약.
  - 근거: req `§6.7`, `§14.3-10`, `§14.3-11`
- 검증 불충분:
  - 전이 프레임 단위 단언보다 settled 중심.

## 5. Desktop/Tablet Expanded / handoff / hover-out collapse
- PASS 요약:
  - 기본 hover/tap 확장 토글 수준만 존재.
- FAIL / 리스크:
  - hover enter 지연(120~200ms), hover-out 독립 collapse(100~180ms), global single timer+intent token, available-only handoff, source 0ms/target 표준 모션 분리가 미구현.
  - 근거: [use-landing-interaction-controller.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/use-landing-interaction-controller.ts):369, [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):291; req `§8.2`, `§8.3`, `§14.3-13`
- 검증 불충분:
  - blocker #13 수준의 타임라인 단언 부재.

## 6. Mobile Expanded lifecycle / y-anchor / title baseline / snapshot restore
- PASS 요약:
  - 실질 PASS 없음(해당 상태기계 자체 부재).
- FAIL / 리스크:
  - `OPENING->OPEN->CLOSING->NORMAL`, queue-close, closing-ignore, y-anchor 0, title baseline 0, snapshot 1회 규약이 미구현.
  - 근거: req `§8.5`, `§14.3-14`; 코드에 lifecycle 상태 정의 부재([state-types.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/state-types.ts))
- 검증 불충분:
  - 모바일 lifecycle 전용 e2e/unit/정적 게이트 부재.

## 7. GNB / Desktop settings / Mobile menu overlay
- PASS 요약:
  - open/close/fallback, mobile overlay close 처리, scroll lock/unlock, back fallback은 구현/스모크 양호.
  - 근거: [site-gnb.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/gnb/site-gnb.tsx), [gnb-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/gnb-smoke.spec.ts)
- FAIL / 리스크:
  - 메뉴/설정 트리거에 `aria-label`이 빠져 `§9.1` 계약 위반 가능.
  - 근거: [site-gnb.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/gnb/site-gnb.tsx):390, :458; req `§9.1`
- 검증 불충분:
  - focus ring 대비/식별성 스크린샷 검증 없음.

## 8. Keyboard / focus / disabled semantics / overlay readability
- PASS 요약:
  - keyboard sequential override 기본 경로는 동작.
- FAIL / 리스크:
  - 카드 1차 트리거가 비시맨틱 컨테이너(`div`) 기반.
  - card shell focus ring 시각 계약이 CSS에 실질 부재.
  - 근거: [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):160, :177, :181, [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css); req `§9.1`, `§9.2`, `§14.3-5`
- 검증 불충분:
  - overlay 활성+focus 가시성 screenshot gate 부재(req `§9.3`).

## 9. State model / determinism / guard / priority
- PASS 요약:
  - reducer 기반 상태 전이와 일부 deterministic 테스트 확보.
- FAIL / 리스크:
  - req 우선순위(`§7.2`)와 코드 priority 구조가 직접 합치되지 않음.
  - `PAGE_STATE_PRIORITY`가 실사용되지 않아 우선순위 강제 근거가 약함.
  - 근거: [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):4, req `§7.2`
- 검증 불충분:
  - SENSOR_DENIED/TRANSITIONING 실경로 트리거 테스트 부재(이벤트 dispatch 없음).

## 10. Transition handshake / ingress flag / rollback / restoration
- PASS 요약:
  - 실질 PASS 없음.
- FAIL / 리스크:
  - ingress 기록, destination-ready 이후 complete, terminal 상호배타, rollback cleanup set, scrollY 복원 1회 consume 모두 미구현.
  - 근거: req `§13.3~§13.8`, `§12.2`; 코드 전역 검색에서 관련 모듈/이벤트 부재.
- 검증 불충분:
  - 3대 rollback 케이스 자동화 없음.

## 11. SSR / hydration / Suspense / deterministic initial render
- PASS 요약:
  - hydration warning 0 관련 스모크 존재, static check 일부 존재.
  - 근거: [routing-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/routing-smoke.spec.ts):38, [check-phase1-contracts.mjs](/Users/woohyeon/Local/VibeTest/scripts/qa/check-phase1-contracts.mjs)
- FAIL / 리스크:
  - 랜딩 핵심 그리드를 `ssr:false`로 우회해 SSR 계약 해석이 약해짐.
  - 근거: [landing-catalog-grid-loader.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-catalog-grid-loader.tsx):10
- 검증 불충분:
  - req `§11.1`의 “build/preview 로그 수집” 중심 증빙이 명시적으로 자동화되지 않음.

## 12. Telemetry / consent / correlation / payload boundaries
- PASS 요약:
  - 실질 PASS 없음.
- FAIL / 리스크:
  - V1 이벤트셋, consent gate, correlation(`start=1 terminal=1`), payload 경계, anon-id 정책 미구현.
  - 근거: req `§12.1~§12.5`, `§14.3-9/#15/#18`; `src` 검색 결과 관련 이벤트/모듈 부재.
- 검증 불충분:
  - 네트워크 전송 차단/허용 테스트 전무.

## 13. Theme / dark mode coverage
- PASS 요약:
  - 토큰 기반 라이트/다크 변수 기본틀은 존재.
  - 근거: [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css):1, :15
- FAIL / 리스크:
  - 페이지×상태(light/dark×Normal/Expanded) 매트릭스 품질 게이트 없음.
  - 근거: req `§6.9`, `§14.3-8`, 체크리스트 [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):30
- 검증 불충분:
  - Expanded 다크모드 대비/가독성 자동 단언 부재.

## 14. Traceability / QA gate / blocker-to-assertion mapping
- PASS 요약:
  - `qa:gate`는 요구된 명령 구성 및 3연속 실행 가능.
  - 근거: [package.json](/Users/woohyeon/Local/VibeTest/package.json), 실제 실행 로그 3/3 PASS
- FAIL / 리스크:
  - blocker 1~19 전수 매핑 자동 검증이 없음(phase1/4/5/6/7 스크립트 중심).
  - 근거: [package.json](/Users/woohyeon/Local/VibeTest/package.json):`qa:rules`, req `§14.4`, 체크리스트 [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):89
- 검증 불충분:
  - stale mapping 탐지 스크립트 부재.

## 15. Design completeness / visual polish / hierarchy / readability / motion perception
- PASS 요약:
  - 기본 카드 밀도/텍스트 클램프/칩 구성은 최소 수준 확보.
- FAIL / 리스크:
  - Expanded의 시각적 계층, 레이어 우선순위, 모션 연속성, focus 가시성, 다크모드 대비 품질이 “릴리스 품질 계약” 수준으로 닫히지 않음.
  - 근거: req `§8.3`, `§8.4`, `§9.1`, `§9.3`, `§6.9`; [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css)
- 검증 불충분:
  - screenshot diff/모션 타임라인 정량 검증 부재.

---

# 5. Prioritized Master Issue List

| Rank | Issue | Category | Severity | User Impact | Regression Risk | Architectural Risk | Verification Gap | Implementation Effort | Expected Benefit | Design/UX Quality Risk | Release Blocker Related? | Evidence / References | Recommended Action |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 카드 1차 트리거가 비시맨틱 `div` 기반 | 요구사항 위반/A11y | 5 | 5 | 4 | 4 | 4 | 3 | 5 | 4 | Yes (#5) | req `§9.2`, `§14.3-5`; [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):160 | 카드 확장/진입 트리거를 시맨틱 `<button>/<a>`로 재구성하고 키보드/aria 차단 규약 동기화 |
| 2 | Desktop/Tablet handoff·hover-out 독립 규약 미구현 | 요구사항 위반/상태·모션 리스크 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | Yes (#13, #4) | req `§8.2`, `§8.3`, `§14.3-13`; [use-landing-interaction-controller.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/use-landing-interaction-controller.ts):369, [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):291 | 전역 timer+intent token 스케줄러, available-only handoff, source/target 모션 분리 도입 |
| 3 | Mobile Expanded lifecycle(OPENING/OPEN/CLOSING/NORMAL) 미구현 | 요구사항 위반/모바일 핵심 결함 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | Yes (#6, #14) | req `§8.5`, `§14.3-14`; [state-types.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/state-types.ts) | 모바일 전용 lifecycle reducer + snapshot/y-anchor/baseline/queue-close 계약 구현 |
| 4 | Transition handshake/rollback/restoration 체계 부재 | 요구사항 위반/릴리스 블로커 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | Yes (#6, #15, #16, #17) | req `§13.3~§13.8`, `§12.2`, `§14.3-15~17`; [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):209 | 전환 컨트롤러 신설, terminal 상호배타, rollback cleanup set, scrollY 1회 복원 구현 |
| 5 | Telemetry/Consent/Correlation/Payload 경계 미구현 | 요구사항 위반/프라이버시 리스크 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 2 | Yes (#9, #15, #18) | req `§12.1~§12.5`, `§14.3-9/#15/#18`; `src` 내 telemetry 이벤트 검색 부재 | 최소 이벤트셋/동의 게이트/anon-id 정책/전송 스키마를 분리 모듈로 구현 |
| 6 | Expanded geometry isolation·top-layer 보장 부족 | 요구사항 위반/시각 안정성 리스크 | 5 | 4 | 5 | 4 | 4 | 4 | 5 | 5 | Yes (#4) | req `§6.7(3)(4)`, `§8.4`, `§14.3-4`; [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css):113, :121 | Expanded를 row track 영향에서 분리하고 non-target 0px 안정성 단언 추가 |
| 7 | blocker 1~19 traceability closure 자동화 부재 | 테스트 부재/추적성 붕괴 | 5 | 4 | 5 | 4 | 5 | 3 | 5 | 1 | Yes (#19) | req `§14.4`; [package.json](/Users/woohyeon/Local/VibeTest/package.json), [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):89 | blocker↔assertion 매핑 산출/검증 스크립트를 `qa:rules`에 포함 |
| 8 | 카드 shell focus ring/경계 가시성 미흡 + 일부 aria-label 누락 | A11y/UX 리스크 | 4 | 4 | 4 | 3 | 4 | 2 | 4 | 4 | Yes (#5) | req `§9.1`, `§9.3`; [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css), [site-gnb.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/gnb/site-gnb.tsx):390, :458 | shell-aligned focus 스타일 추가, menu/settings 트리거 aria-label 보강 |
| 9 | Theme matrix(페이지×상태×테마) 자동 게이트 부재 | 테스트 부재/디자인 품질 리스크 | 4 | 3 | 4 | 3 | 5 | 3 | 4 | 4 | Yes (#8) | req `§6.9`, `§14.3-8`; [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):30 | theme matrix e2e+screenshot gate 추가(Expanded 포함) |
| 10 | 상태 우선순위 계약 드리프트 + `PAGE_STATE_PRIORITY` 미사용 | 설계 리스크 | 4 | 3 | 4 | 4 | 4 | 3 | 4 | 3 | Partial (#5) | req `§7.2`; [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):4 | 우선순위 해석을 reducer 경로에 실효 반영하고 위반 단언 추가 |
| 11 | SSR 증빙 갭 + 핵심 grid `ssr:false` 우회 | 검증 불충분/아키텍처 리스크 | 4 | 3 | 4 | 4 | 4 | 3 | 4 | 2 | Partial (#1) | req `§11.1`; [landing-catalog-grid-loader.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-catalog-grid-loader.tsx):10, [routing-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/routing-smoke.spec.ts):38 | preview 로그 기반 hydration 0 수집 강화 + SSR 전략 재평가 |
| 12 | Test/Blog 목적지 진입 계약 불완전(식별자/ingress) | 요구사항 위반 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 3 | Yes (#6) | req `§8.6`, `§13.3`, `§13.4`; [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):253 | Test A/B CTA 라우팅·ingress 연결, Blog article 식별자 handoff 구현 |
| 13 | `reuseExistingServer:true`로 게이트 신뢰도 흔들림 가능 | 검증 인프라 리스크 | 3 | 3 | 4 | 3 | 4 | 2 | 4 | 1 | Indirect | [playwright.config.ts](/Users/woohyeon/Local/VibeTest/playwright.config.ts):20 | CI/로컬 모두 독립 서버 보장 또는 포트 충돌 감지 강화 |
| 14 | 체크리스트 상태 일관성 붕괴(`qa gate` 관련 항목 상충) | 추적성 리스크 | 3 | 2 | 4 | 2 | 4 | 1 | 3 | 1 | Indirect (#19) | [reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):96, :101 | 체크 기준/증거 링크로 재정렬, 완료 기준 단일화 |
| 15 | 카드 상태별 시각 위계/모션 완성도 부족 | 디자인 완성도 리스크 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 | Indirect | req `§8.3`, `§8.4`, `§9.1`; [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css) | 상태별 위계·레이어·모션의 체감 연속성을 토큰/타임라인으로 정교화 |
| 16 | locale별 `html lang` SSR 즉시성 부족 | 잠재 리스크 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 2 | Indirect | [layout.tsx](/Users/woohyeon/Local/VibeTest/src/app/layout.tsx):15, [locale-html-lang-sync.tsx](/Users/woohyeon/Local/VibeTest/src/i18n/locale-html-lang-sync.tsx):8 | 서버 렌더 단계에서 locale lang 일치 전략 재검토 |

---

# 6. Top Priority Action Plan

## [Rank 1] 카드 1차 트리거 시맨틱 위반
- 왜 지금 해결해야 하는가:
  - 블로커 #5 직접 위반이며 키보드/스크린리더 경로 신뢰도를 즉시 저하시킵니다.
- 관련 근거:
  - req `§9.2`, `§14.3-5`; 체크리스트 `§6 Accessibility`.
- 의심 코드 위치:
  - [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):160
- 수정 방향:
  - 카드 확장/진입 1차 트리거를 시맨틱 컨트롤로 치환하고, 기존 reducer 이벤트 라우팅을 해당 컨트롤 중심으로 재배선.
- 필요한 테스트:
  - DOM 감사(시맨틱 요소 강제), 키보드 활성 차단(`aria-disabled`) E2E.
- 완료 판정 기준:
  - 비시맨틱 컨테이너 단독 활성화 0건, blocker #5 단언 PASS.

## [Rank 2] Desktop/Tablet handoff + hover-out 독립 계약 미구현
- 왜 지금 해결해야 하는가:
  - Phase 8 핵심 진입조건이자 blocker #13 핵심.
- 관련 근거:
  - req `§8.2`, `§8.3`, `§14.3-13`; dev plan Phase 8.
- 의심 코드 위치:
  - [use-landing-interaction-controller.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/use-landing-interaction-controller.ts):253
  - [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):291
- 수정 방향:
  - 전역 단일 timer+intent token 스케줄러, 실행 직전 대상 재검증, available-only handoff 분기 도입.
- 필요한 테스트:
  - hover intent cancel/revalidate, hover-out independent collapse, source0/target-standard 타임라인 단언.
- 완료 판정 기준:
  - blocker #13 자동 단언 세트 PASS.

## [Rank 3] Mobile Expanded lifecycle 원자성 미구현
- 왜 지금 해결해야 하는가:
  - 모바일 계약 대부분이 현재 구조에 부재, Phase 9·blocker #14 선행 위험.
- 관련 근거:
  - req `§8.5`, `§14.3-14`; dev plan Phase 9.
- 의심 코드 위치:
  - [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts), [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css)
- 수정 방향:
  - 모바일 전용 lifecycle 상태기계와 queue-close/closing-ignore/snapshot gate를 독립 책임으로 분리.
- 필요한 테스트:
  - y-anchor 0, title baseline 0, snapshot 1회, terminal 선행조건 자동 단언.
- 완료 판정 기준:
  - blocker #14 PASS + 관련 체크리스트 항목 닫힘.

## [Rank 4] Transition handshake/rollback/restoration 부재
- 왜 지금 해결해야 하는가:
  - 전환 실패/취소 시 누수 방지와 추적성 핵심.
- 관련 근거:
  - req `§13.3~§13.8`, `§12.2`, `§14.3-15~17`; dev plan Phase 10.
- 의심 코드 위치:
  - [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):209
  - [question/page.tsx](/Users/woohyeon/Local/VibeTest/src/app/[locale]/test/[variant]/question/page.tsx)
- 수정 방향:
  - transition controller 신설, terminal 상호배타 강제, cleanup set 원자 롤백, scrollY 1회 복원 consume 도입.
- 필요한 테스트:
  - fail/cancel 3케이스, destination-ready 이후 complete, restore once 단언.
- 완료 판정 기준:
  - blocker #15/#16/#17 PASS.

## [Rank 5] Telemetry/Consent/Privacy 계약 미구현
- 왜 지금 해결해야 하는가:
  - 블로커 #9/#18과 데이터 경계 위반 리스크.
- 관련 근거:
  - req `§12.1~§12.5`, `§15 EX-002`, `§14.3-9/#18`; dev plan Phase 11.
- 의심 코드 위치:
  - `src` 내 telemetry 관련 모듈 부재.
- 수정 방향:
  - collector/consent gate/payload validator/anon-id policy를 모듈 분리로 도입.
- 필요한 테스트:
  - `UNKNOWN/OPTED_OUT 전송 0`, `OPTED_IN 전송 허용`, `final_submit 필수필드/PII 금지`.
- 완료 판정 기준:
  - blocker #9/#18 PASS.

## [Rank 6] Expanded geometry isolation + top-layer 보장 부족
- 왜 지금 해결해야 하는가:
  - 한 카드 Expanded가 행 전체를 흔드는 회귀가 반복될 고위험 구간.
- 관련 근거:
  - req `§6.7(3)(4)`, `§8.4`, `§14.3-4`.
- 의심 코드 위치:
  - [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css):113, :121
  - [landing-grid-card.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/grid/landing-grid-card.tsx):200
- 수정 방향:
  - non-target geometry 격리, Expanded 레이어 우선순위 고정, baseline freeze/restore 모델 반영.
- 필요한 테스트:
  - same-row non-target top/bottom/outer 0px, row2+ 반복 단언.
- 완료 판정 기준:
  - blocker #4 관련 하위 단언 PASS.

## [Rank 7] blocker 1~19 traceability closure 미완
- 왜 지금 해결해야 하는가:
  - 게이트 PASS가 릴리스 품질 보장을 대체하지 못하는 핵심 원인.
- 관련 근거:
  - req `§14.4`, `§14.3-19`; checklist `§8`.
- 의심 코드 위치:
  - [package.json](/Users/woohyeon/Local/VibeTest/package.json):`qa:rules`
- 수정 방향:
  - blocker별 assertion registry와 매핑 검사 스크립트를 게이트 필수 단계로 편입.
- 필요한 테스트:
  - 미매핑/stale reference 감지 테스트.
- 완료 판정 기준:
  - blocker #19 PASS, 매핑 공백 0.

## [Rank 8] Focus ring/aria-label 접근성 갭
- 왜 지금 해결해야 하는가:
  - 체감 품질과 법적/접근성 리스크를 동시에 키움.
- 관련 근거:
  - req `§9.1`, `§9.3`.
- 의심 코드 위치:
  - [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css)
  - [site-gnb.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/gnb/site-gnb.tsx):390, :458
- 수정 방향:
  - shell-aligned focus style 정의, trigger aria-label 일괄 보강.
- 필요한 테스트:
  - keyboard-only + overlay 상태 screenshot 단언.
- 완료 판정 기준:
  - focus 식별성/경계 정합 PASS, aria 누락 0.

## [Rank 9] Theme matrix 게이트 부재
- 왜 지금 해결해야 하는가:
  - 다크모드 회귀는 늦게 발견될수록 수정비용 급증.
- 관련 근거:
  - req `§6.9`, `§14.3-8`; checklist `§2` 미완.
- 의심 코드 위치:
  - [globals.css](/Users/woohyeon/Local/VibeTest/src/app/globals.css), 테스트 스위트 전반
- 수정 방향:
  - 페이지×상태×테마 매트릭스 E2E/screenshot gate 신설.
- 필요한 테스트:
  - Landing/Test/Blog/History + Normal/Expanded + light/dark.
- 완료 판정 기준:
  - blocker #8 PASS.

## [Rank 10] 상태 우선순위 계약의 실효성 부족
- 왜 지금 해결해야 하는가:
  - 추후 이벤트가 늘어날수록 비결정 회귀 위험이 커짐.
- 관련 근거:
  - req `§7.2`, `§7.7`.
- 의심 코드 위치:
  - [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts):4
- 수정 방향:
  - 우선순위 충돌 해소 로직을 reducer 실경로에 반영, 죽은 상수 제거/검증.
- 필요한 테스트:
  - priority 역전 시나리오, transitioning/sensor 이벤트 실경로 단언.
- 완료 판정 기준:
  - 우선순위 위반 전이 0, 관련 단언 PASS.

---

# 7. Design Completeness Improvement List

1. 상태 전환의 지각 연속성 부족
- 문제/징후:
  - Expanded 전환이 “동일 카드 상태 변화”로 충분히 느껴지지 않음.
- 왜 완성도를 떨어뜨리는지:
  - 사용자는 원인-결과 매핑을 잃고 인터랙션 신뢰도가 하락.
- 연결점:
  - req `§8.3`, `§8.4`, `§8.5`.
- 수정 방향:
  - source/target 모션 분리, state별 visual token(scale/origin/depth) 명시.
- 검증 방법:
  - 타임라인 단언 + 시퀀스 스크린샷 비교.
- 우선순위:
  - Phase 8 전.

2. card shell focus 시각 경계 불명확
- 문제/징후:
  - focus 스타일이 shell 경계 기준으로 명확하지 않음.
- 왜 완성도를 떨어뜨리는지:
  - 키보드 사용자에게 상태 인지가 어렵고 접근성 품질 저하.
- 연결점:
  - req `§9.1`, `§9.3`.
- 수정 방향:
  - shell 외곽 고대비 focus ring 토큰화(라이트/다크 공통).
- 검증 방법:
  - keyboard-only screenshot gate.
- 우선순위:
  - 즉시.

3. Expanded 레이어 우선순위 체감 불안정
- 문제/징후:
  - in-flow 확장 기반으로 인접 카드와 시각 충돌 가능.
- 왜 완성도를 떨어뜨리는지:
  - 정보 가림/경계 혼선으로 신뢰성 저하.
- 연결점:
  - req `§8.4`, `§6.7`.
- 수정 방향:
  - Expanded top-layer 보장 + non-target geometry isolation.
- 검증 방법:
  - overlap/hit-target E2E.
- 우선순위:
  - Phase 8 전.

4. 다크모드 상태별 대비 품질 검증 부재
- 문제/징후:
  - 다크모드가 토큰만 있고 상태 행렬 검증이 없음.
- 왜 완성도를 떨어뜨리는지:
  - 특정 상태에서만 대비 붕괴 가능.
- 연결점:
  - req `§6.9`, `§14.3-8`.
- 수정 방향:
  - 상태별 대비/경계/overlay 의미를 행렬 기반으로 고정.
- 검증 방법:
  - 페이지×테마×상태 screenshot diff.
- 우선순위:
  - Phase 8 병행.

5. 모바일 full-bleed 읽기 리듬 계약 부재
- 문제/징후:
  - header/title/X/CTA 우선순위의 체감 일관성 확보 장치 부족.
- 왜 완성도를 떨어뜨리는지:
  - thumb reach/close affordance/읽기 흐름에 미세 불편 누적.
- 연결점:
  - req `§8.5`.
- 수정 방향:
  - 모바일 lifecycle 구현 시 타이포/간격/터치 타깃을 함께 규격화.
- 검증 방법:
  - 모바일 interaction regression pack.
- 우선순위:
  - Phase 8 전.

6. subtitle ellipsis의 “의도된 절단” 인지성 검증 부족
- 문제/징후:
  - line-clamp는 있으나 시각 품질 단언이 약함.
- 왜 완성도를 떨어뜨리는지:
  - 레이아웃 오류처럼 보일 가능성.
- 연결점:
  - req `§6.6`.
- 수정 방향:
  - 긴 토큰/혼합 locale fixture에서 ellipsis 노출 품질 기준 수립.
- 검증 방법:
  - visual regression + per-locale snapshot.
- 우선순위:
  - Phase 8 병행.

7. CTA 시각 리듬 일관성 부족 가능성
- 문제/징후:
  - Blog CTA만 링크형, Test는 버튼형이지만 전환 계약 미연결.
- 왜 완성도를 떨어뜨리는지:
  - 카드 타입 간 affordance 의미가 비정합.
- 연결점:
  - req `§6.8`, `§8.6`, `§13.4`.
- 수정 방향:
  - CTA 역할/레이아웃/상태 피드백 토큰을 타입 간 통합.
- 검증 방법:
  - 타입별 CTA interaction snapshot.
- 우선순위:
  - Phase 8 전.

8. 레이어/경계 1px 미세 결함 감시 부재
- 문제/징후:
  - shadow/divider/overlay 경계의 상태별 미세 불연속 자동검증 없음.
- 왜 완성도를 떨어뜨리는지:
  - 완성도 인상 저하 + 회귀 탐지 지연.
- 연결점:
  - req `§6.4`, `§6.9`, `§8.4`, `§9.3`.
- 수정 방향:
  - 핵심 상태 조합 픽셀 임계치 기반 시각 회귀 체크.
- 검증 방법:
  - screenshot threshold test.
- 우선순위:
  - 후순위(단, 릴리스 직전 한 번은 필수).

---

# 8. Coverage Gaps
- 정보 부족:
  - 실제 사용자 환경(저사양/보조기기)에서의 체감 데이터 없음.
- 테스트 부족:
  - blocker #6/#8/#9/#13/#14/#15/#16/#17/#18/#19 전용 자동 단언 부족.
- 수동 검증 필요:
  - 모바일 full-bleed 지각 품질, overlay+focus 동시 가독성, 다크모드 Expanded.
- 문서-코드 불일치 가능성:
  - 체크리스트 완료/미완료 표기가 일부 상충([reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md):96, :101).
- 디자인 검증 증거 부족:
  - screenshot diff/모션 타임라인 기반 품질 게이트가 핵심 구간에서 비어 있음.

---

# 9. Final Verdict
- 착수 전 선행 수정 필수 항목:
  - Rank 1~7 (시맨틱 트리거, handoff/hover-out, mobile lifecycle, handshake/rollback/restoration, telemetry/consent, geometry isolation, traceability closure).
- 나중으로 미뤄도 되는 항목:
  - Rank 13~16 (게이트 신뢰도 운영 리스크, 체크리스트 정합, locale `html lang` SSR 즉시성 등).
- 미루면 위험한 항목:
  - Rank 2~6, 8~10 (Phase 8 진입 시 수정비용 급증 + 회귀 범위 확대).
- 디자인 관점에서 반드시 선정리:
  - Expanded 레이어/모션 연속성, shell focus 가시성, 모바일 full-bleed 읽기/조작 리듬, 다크모드 상태 매트릭스 검증.

최종 판단:
- 현재 상태는 **“기본 동작은 통과하지만 SSOT 릴리스 기준은 미충족”** 입니다.
- Phase 8 착수는 가능하되, 위 상위 이슈를 **Phase 8의 선행 게이트**로 설정하지 않으면 이후 비용과 회귀 위험이 크게 증가합니다.
