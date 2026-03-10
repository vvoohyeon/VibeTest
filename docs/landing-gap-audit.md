# 랜딩 종료 전 갭 감사 보고서

## 1. 문서 해석 기준
- [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md): 랜딩 구현과 릴리스 차단 조건의 최상위 SSOT다. 랜딩 세부 판정, release-blocking 여부, 계약 위반 여부는 이 문서를 최우선으로 적용했다.
- [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md): 요구사항을 phase/아키텍처/검증 단위로 재구성한 실행 문서다. SSOT를 보완하는 계획 closure와 phase 잔여 작업 판정에 사용했다.
- [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md): 현행화 대상 체크리스트다. `[x]` 표기를 사실로 간주하지 않고, 실제 코드·테스트·재현 결과 기준으로 다시 판정했다.
- [docs/backlog.md](/Users/woohyeon/Local/VibeTest/docs/backlog.md): 후속/보류 축을 정리한 문서다. backlog 기재만으로 미구현으로 단정하지 않고, 현재 코드와 smoke coverage를 함께 봤다.
- [docs/requirements.md](/Users/woohyeon/Local/VibeTest/docs/requirements.md): 전역 정합성 보조 문서다. 랜딩 세부 조항과 충돌할 때는 SSOT 보조 기준으로만 사용했다.
- 판단 우선순위: `req-landing-final.md` → `dev-plan-landing-final.md` → `reimpl-checklist-ssot.md` → `backlog.md` → `requirements.md`.
- 제외 기준: [docs/key-findings.md](/Users/woohyeon/Local/VibeTest/docs/key-findings.md)는 현재 코드 상태와 어긋난 오래된 진단이 섞여 있어 이번 감사에서 의도적으로 제외했다.
- 실행 증빙: `npm run qa:rules`, `npm test`, `npm run build`, `npm run test:e2e:smoke`는 모두 PASS였다. `npm run qa:gate`는 `qa:gate:once` 3회 연속 green 관찰이 가능했고, 추가로 브라우저 재현 1건(ingress refresh)과 코드 재판정 2건(return restoration, reduced-motion state priority)을 수행했다.

## 2. 발견 항목 목록

### 1. TestQuestionClient가 refresh 후 ingress flag를 잃고 Q1로 역전됨
- 분류: 요구사항 누락
- 심각도: Critical
- 우선순위 순번: 1
- 왜 문제인지: SSOT는 landing ingress flag만으로 시작 문항과 진행 표시를 결정해야 하며, ingress flag가 남아 있으면 instruction 표시 여부와 무관하게 Q2에서 시작해야 한다. 현재 구현은 ingress record가 남아 있어도 pending transition이 사라지면 `landingIngressFlag=false`로 처리해 refresh 후 `Question 1 of 4`로 역전된다. 이는 [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.4, 13.6, 14.3 blocker #6을 직접 위반한다.
- 근거 문서: [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.4, 13.6, 14.3 #6; [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md) 2.3 `Landing Ingress Flag` / `Question Index`; [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 85.
- 근거 코드/파일/테스트/부재 지점: [test-question-client.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/test/test-question-client.tsx) 74-107에서 `matchedIngress`를 `pending transition + ingress` 동시 존재로만 인정하고, 99-107에서 그 결과만으로 `landingIngressFlag`와 `currentQuestionIndex`를 결정한다. 같은 파일 139-160에서는 Start 직후에야 `consumeLandingIngress`가 호출된다. [store.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/transition/store.ts) 119-132는 ingress record를 별도로 유지한다. 반면 [transition-telemetry-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/transition-telemetry-smoke.spec.ts) 76-137은 최초 진입과 Start 직후만 검증하고 refresh/re-entry를 커버하지 않는다. 2026-03-10 Playwright 재현에서 `/en -> test-rhythm-a -> answer A` 직후 instruction 화면은 `Question 2 of 4`, refresh 후 `Question 1 of 4`로 바뀌었고 `vibetest-landing-ingress:rhythm-a` sessionStorage 값은 그대로 남아 있었다.
- 권장 조치: bootstrap 시점의 시작 문항 판단을 `landingIngress` 존재 자체로 분리하고, `pending transition`은 transition completion correlation 검증에만 사용해야 한다. refresh/re-entry 전용 E2E를 추가해 `Question 2 of N` 유지, Start 직후 consume, ingress 없는 재진입의 Q1 fallback을 각각 증명해야 한다.
- 선행/후행 관계: 랜딩 종료 전 선행 수정이 필요하다. 이 항목이 닫히기 전에는 checklist 85 closure와 phase closure를 유지하면 안 된다.

### 2. LandingRuntime이 저장된 scrollY 대신 source card 위치를 우선 복원하고 consume도 지연함
- 분류: 요구사항 누락
- 심각도: High
- 우선순위 순번: 2
- 왜 문제인지: SSOT는 return restoration의 필수 복원 대상을 `scrollY`로 고정하고, 랜딩 재진입 mount 직후 1회 복원 후 즉시 consume하도록 강제한다. 현재 구현은 source card DOM이 존재하면 카드 top 기반 위치를 우선 사용하고, RAF settle이 끝난 뒤에야 consume한다. 이는 [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.8 및 14.3 blocker #17과 불일치한다.
- 근거 문서: [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.8, 14.3 #17; [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md) 2.2 `return restoration(scrollY)` 동기화 규칙; [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 86.
- 근거 코드/파일/테스트/부재 지점: [landing-runtime.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/landing-runtime.tsx) 53-61은 `targetScrollTopFromCard ?? pendingReturnRestore.scrollY`를 사용해 source card anchor를 우선한다. 같은 파일 69-80, 84-90은 RAF settle 뒤 `clearLandingReturnScroll()`을 호출하므로 immediate consume이 아니다. 저장/consume API 자체는 [store.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/transition/store.ts) 154-221에 분리돼 있다. [transition-telemetry-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/transition-telemetry-smoke.spec.ts) 163-204는 대표 경로에서 저장 scroll과 실제 복원을 비교하지만, `saved scrollY != source card anchor` 상황이나 mount 직후 consume 여부는 검증하지 않는다.
- 권장 조치: mount 직후 저장된 `scrollY`만 단일 소스로 읽고 즉시 consume한 뒤, 단 한 번의 idempotent 복원만 수행하도록 맞춰야 한다. source card 위치 복원은 별도 UX 보정 기능으로 분리하거나 제거하고, B17 smoke에 adversarial case를 추가해야 한다.
- 선행/후행 관계: ingress bug 다음 우선순위다. 이 항목이 닫히기 전에는 checklist 86을 닫힌 상태로 둘 수 없다.

### 3. reduced-motion 경로에서 PAGE_TRANSITION_START가 TRANSITIONING으로 승격되지 않음
- 분류: 계획 미완료
- 심각도: High
- 우선순위 순번: 3
- 왜 문제인지: 전환 시작 즉시 `TRANSITIONING` 진입은 landing→destination handshake의 핵심 잠금 조건이다. dev-plan은 page-state priority를 `INACTIVE > REDUCED_MOTION > TRANSITIONING`으로 고정했지만, 현재 reducer의 priority guard 때문에 `REDUCED_MOTION -> TRANSITIONING`이 no-op가 된다. reduced-motion 사용자 경로에서 전환 잠금 근거가 약해지고, 계약이 테스트로도 닫혀 있지 않다.
- 근거 문서: [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.3, 14.3 #6; [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md) 3.8 state priority 및 capability gate.
- 근거 코드/파일/테스트/부재 지점: [interaction-state.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/model/interaction-state.ts) 4-18은 priority/allowed transition table을 정의하고, 121-141은 `currentPriority > nextPriority`면 상태 전이를 막는다. 같은 파일 228-235에서 `PAGE_TRANSITION_START`는 force 없이 `TRANSITIONING`을 요청한다. [landing-interaction-state.test.ts](/Users/woohyeon/Local/VibeTest/tests/unit/landing-interaction-state.test.ts) 171-183은 reduced-motion enable/disable만 검증하고, reduced-motion 상태에서 transition start가 실제로 lock state로 들어가는지는 테스트하지 않는다.
- 권장 조치: `PAGE_TRANSITION_START`를 reduced-motion보다 상위 강제 전이로 처리하거나, priority rule을 문서와 구현이 일치하도록 재설계해야 한다. 최소 단위 테스트 1개와 representative E2E 1개로 reduced-motion transition lock을 증빙해야 한다.
- 선행/후행 관계: transition handshake와 guardrail closure 전에 선행돼야 한다. ingress/return restore 수정과 병행 가능하지만, release-blocking handshake 증빙을 정리하기 전에는 남기면 안 된다.

### 4. blocker #11 traceability는 닫혀 보이지만 의미상 얕은 매핑에 의존함
- 분류: 구조 개선
- 심각도: Medium
- 우선순위 순번: 4
- 왜 문제인지: blocker #19의 핵심은 단순히 “매핑 레코드가 있다”가 아니라, 각 blocker를 실제 자동 단언이 닫는지다. 현재 blocker #11은 “row index와 무관한 `needs_comp` 판정”이 핵심인데, traceability는 baseline freeze unit test 하나만 연결한다. 이 테스트는 baseline phase bookkeeping을 검증할 뿐 row consistency 자체를 닫지 않는다.
- 근거 문서: [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 14.3 #11, #19 및 14.4; [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md) 2.2 single-change synchronization, 7~10 release evidence 정책.
- 근거 코드/파일/테스트/부재 지점: [blocker-traceability.json](/Users/woohyeon/Local/VibeTest/docs/blocker-traceability.json) 88-90은 blocker #11을 [landing-baseline-manager.test.ts](/Users/woohyeon/Local/VibeTest/tests/unit/landing-baseline-manager.test.ts) 10-48의 `assertion:B11-baseline-freeze`에만 연결한다. 하지만 이 테스트는 snapshot freeze/restore phase만 본다. 반대로 [grid-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/grid-smoke.spec.ts) 174-256의 `assertion:B10-spacing-model`은 row1/row2+ 각각에서 `needs_comp`를 geometry로 재계산해 더 직접적으로 row-local rule을 검증한다. 현재 매핑은 “존재”는 하지만, SSOT 문장을 가장 직접적으로 닫는 증빙과 연결돼 있지 않다.
- 권장 조치: blocker #11에 대응하는 전용 assertion을 추가하거나, 최소한 traceability를 row-local compensation smoke까지 확장해야 한다. blocker 매핑 품질 검사는 syntactic presence 외에 semantic fit 샘플링도 포함시키는 편이 안전하다.
- 선행/후행 관계: 상위 3개 기능 계약 수정 후 바로 따라가면 된다. 기능 수정이 없어도 독립적으로 정리 가능하다.

### 5. reimpl checklist 85번이 실제 코드 상태보다 앞서 닫혀 있음
- 분류: 체크리스트 불일치
- 심각도: High
- 우선순위 순번: 5
- 왜 문제인지: checklist는 현행 상태를 반영해야 하는데, ingress refresh 역전 버그가 존재하는 상태에서 `test ingress/pre-answer/instruction/start-question contracts`가 `[x]`로 유지돼 있다. 현재 체크 상태를 그대로 두면 phase closure와 handoff 검토에서 false green을 만든다.
- 근거 문서: [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 85; [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.4, 13.6, 14.3 #6.
- 근거 코드/파일/테스트/부재 지점: 근본 원인은 [test-question-client.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/test/test-question-client.tsx) 74-107, 139-160이고, smoke는 [transition-telemetry-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/transition-telemetry-smoke.spec.ts) 76-137 수준까지만 덮는다. refresh/re-entry proof가 없다.
- 권장 조치: 코드 수정이 바로 들어가지 않으면 checklist 85는 즉시 `[ ]`로 되돌리고, 수정 후 refresh/re-entry proof를 추가한 다음 다시 닫는 것이 맞다.
- 선행/후행 관계: 항목 1과 직접 연동된다. 구현 수정 없이 문서만 유지하면 안 된다.

### 6. reimpl checklist 86번이 실제 restore contract와 어긋난 상태로 닫혀 있음
- 분류: 체크리스트 불일치
- 심각도: High
- 우선순위 순번: 6
- 왜 문제인지: checklist 86은 `save right before routing, restore once on landing re-entry mount, immediate consume`를 hard contract로 닫았다고 선언하지만, 실제 구현은 source-card-based restore와 delayed consume을 사용한다. 현재 `[x]`는 실제 코드 상태를 과대평가한다.
- 근거 문서: [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 86; [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.8, 14.3 #17.
- 근거 코드/파일/테스트/부재 지점: [landing-runtime.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/landing-runtime.tsx) 53-80, [store.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/transition/store.ts) 154-221, [transition-telemetry-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/transition-telemetry-smoke.spec.ts) 163-204.
- 권장 조치: 항목 2 수정 전이라면 checklist 86을 `[ ]`로 되돌리고, 수정 후에는 `saved scrollY != source card anchor` 케이스까지 포함한 assertion으로 closure를 복구해야 한다.
- 선행/후행 관계: 항목 2와 직접 연동된다.

### 7. 전역 axe-core 자동화는 “미구현”이 아니라 대표 상태 중심 coverage 확대 과제만 남아 있음
- 분류: backlog 미구현
- 심각도: Low
- 우선순위 순번: 7
- 왜 문제인지: backlog 3.3은 follow-up으로 유효하지만, 현재 상태를 “전역 axe 미구현”으로 읽으면 오판이다. canonical landing, GNB open states, mobile expanded, destination shells, KR representative states에 대한 axe audit은 이미 존재한다. 남은 과제는 broader crawl과 locale/state 확장이다.
- 근거 문서: [docs/backlog.md](/Users/woohyeon/Local/VibeTest/docs/backlog.md) 3.3; [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) 75-77.
- 근거 코드/파일/테스트/부재 지점: [a11y-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/a11y-smoke.spec.ts) 76-140은 canonical landing, GNB open, mobile expanded, test/blog/history destination, KR states를 axe로 감사한다. 다만 전체 카드 조합, 다수 locale, long-run navigation crawl은 별도 coverage가 없다.
- 권장 조치: backlog는 “broader coverage 강화 필요” 상태로 유지하되, 미구현 항목으로 승격하지 말아야 한다. 후속 phase에서 locale/route crawl matrix를 덧대는 정도가 적절하다.
- 선행/후행 관계: 랜딩 종료의 선행 조건은 아니다. 상위 계약 수정이 끝난 뒤 검증 coverage 확대 과제로 넘기면 된다.

### 8. GNB 키보드 접근은 기본 계약은 닫혔고 broader context/state audit만 남아 있음
- 분류: backlog 미구현
- 심각도: Low
- 우선순위 순번: 8
- 왜 문제인지: backlog 3.5 역시 남은 과제는 맞지만, 실제 상태는 “미구현”이 아니다. landing card-first entry, reverse GNB handoff, settings close on focus-out, mobile menu focus restore까지 기본 keyboard/context matrix는 smoke로 닫혀 있다. 남은 것은 hidden-state tabbability와 추가 state matrix 확대다.
- 근거 문서: [docs/backlog.md](/Users/woohyeon/Local/VibeTest/docs/backlog.md) 3.5; [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 9.1, 10.2.
- 근거 코드/파일/테스트/부재 지점: [gnb-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/gnb-smoke.spec.ts) 148-216은 desktop keyboard matrix를, 256 이후 테스트들은 mobile reverse-entry/focus restore를 검증한다. backlog가 언급한 broader context/state audit은 아직 별도 행렬로 넓어지지 않았다.
- 권장 조치: backlog 표현은 유지하되 “기본 contract 완료, 추가 context/state audit 후속”으로 해석해야 한다. 릴리스 직전 필수 작업보다는 keyboard audit pass의 후속 증빙 확대가 적절하다.
- 선행/후행 관계: 상위 릴리스 차단 이슈 해결 후 다루면 된다.

### 9. dark baseline 확대와 CTA visual rhythm/theme matrix는 부분 구현 상태에서 후속으로 남아 있음
- 분류: backlog 미구현
- 심각도: Low
- 우선순위 순번: 9
- 왜 문제인지: backlog 3.1과 3.4는 실제로 아직 “전체 closure”는 아니다. 다만 representative light/dark theme matrix와 landing/blog/history/test baseline screenshot은 이미 존재하므로, 이를 “전혀 안 됨”으로 적는 것도 부정확하다. 남은 과제는 screenshot breadth와 visual polish 확장이다.
- 근거 문서: [docs/backlog.md](/Users/woohyeon/Local/VibeTest/docs/backlog.md) 3.1, 3.4; [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 14.3 #8.
- 근거 코드/파일/테스트/부재 지점: [theme-matrix-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/theme-matrix-smoke.spec.ts) 22-92는 landing normal/expanded, test, blog, history, KR representative states를 light/dark로 캡처한다. backlog가 요구하는 “전체 확대” 수준의 dark baseline breadth, CTA rhythm polish matrix는 추가 캡처가 필요하다.
- 권장 조치: backlog는 후속 유지가 맞다. 다만 현재 상태를 “기본 게이트 존재 + 범위 확대 필요”로 명확히 적어야 한다.
- 선행/후행 관계: 기능 회귀 수정과 섞지 말고 후속 visual pass로 분리하는 것이 안전하다.

### 10. locale별 `<html lang>`가 SSR이 아니라 client effect로만 보정됨
- 분류: 구조 개선
- 심각도: Low
- 우선순위 순번: 10
- 왜 문제인지: 현재 루트 레이아웃은 항상 `lang="en"`으로 SSR되고, locale-specific `lang`은 hydration 후 client effect로만 덮어쓴다. hydration warning은 막더라도 첫 paint 시점의 접근성/SEO 의미론은 locale에 따라 부정확하다. 랜딩 SSOT 직접 위반은 아니지만, 전역 locale 정합성 관점에서는 개선 여지가 크다.
- 근거 문서: [docs/dev-plan-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/dev-plan-landing-final.md) 3.1, 3.2의 root/locale layout 책임 분리; [docs/requirements.md](/Users/woohyeon/Local/VibeTest/docs/requirements.md) 전역 i18n 정합성 보조 기준.
- 근거 코드/파일/테스트/부재 지점: [layout.tsx](/Users/woohyeon/Local/VibeTest/src/app/layout.tsx) 14-21은 `<html lang={defaultLocale}>`를 고정한다. [src/app/[locale]/layout.tsx](/Users/woohyeon/Local/VibeTest/src/app/[locale]/layout.tsx) 23-43은 locale provider와 client sync만 수행한다. [locale-html-lang-sync.tsx](/Users/woohyeon/Local/VibeTest/src/i18n/locale-html-lang-sync.tsx) 7-12가 실제 `document.documentElement.lang` 교정을 hydration 이후에만 수행한다. 이 경로를 검증하는 SSR-level 테스트는 없다.
- 권장 조치: root/locale layout 책임을 유지하되, SSR 시점 locale-specific `lang`을 반영할 수 있는 구조로 재정리하는 것이 낫다. 다만 current landing closure의 직접 blocker는 아니다.
- 선행/후행 관계: 종료 후 후속으로 넘겨도 된다.

### 11. debug/sample 카드가 실제 카탈로그에 노출되고 테스트도 그 노출에 의존함
- 분류: 구조 개선
- 심각도: Low
- 우선순위 순번: 11
- 왜 문제인지: 랜딩 SSOT는 fixture 다양성에 debug/sample 케이스를 요구하지만, 전역 보조 요구사항은 debug/sample variant가 production end-user catalog에 보이면 안 된다고 적는다. 현재 구현은 `debug/sample` 카드를 실제 available catalog에 포함하고, 일부 smoke/unit 테스트도 그 노출을 전제로 삼는다. 프로덕션 노출 의도가 아니라면 구조를 정리하는 편이 낫다.
- 근거 문서: [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 12.6 fixture 다양성; [docs/requirements.md](/Users/woohyeon/Local/VibeTest/docs/requirements.md) 76-77, 488의 production filtering 보조 기준.
- 근거 코드/파일/테스트/부재 지점: [raw-fixtures.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/data/raw-fixtures.ts) 76-110은 `test-debug-sample`을 `availability: 'available', debug: true, sample: true`로 선언한다. [adapter.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/data/adapter.ts) 81-186은 이를 필터링하지 않고 catalog에 포함한다. [landing-card-contract.test.ts](/Users/woohyeon/Local/VibeTest/tests/unit/landing-card-contract.test.ts) 35-60과 [grid-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/grid-smoke.spec.ts) 258-288은 이 카드를 실제 렌더된 end-user catalog fixture로 사용한다.
- 권장 조치: debug/sample fixture 자체는 유지하되 production catalog 필터를 두거나, empty-tags/QA 전용 coverage를 별도 fixture로 분리하는 편이 낫다. 현재는 전역 보조 요구사항 기준의 정합성 이슈로만 취급하는 것이 적절하다.
- 선행/후행 관계: 랜딩 종료의 직접 blocker는 아니다. visual/fixture hygiene 후속 과제로 넘길 수 있다.

## 3. 우선순위 정렬 결과
1. `TestQuestionClient` ingress refresh 역전 버그: SSOT 13.4와 blocker #6을 직접 깨고, 실제 브라우저 재현까지 확보됐다. 사용자가 instruction 화면에서 refresh만 해도 Q2가 Q1로 뒤집히므로 릴리스 차단 가능성이 가장 높다.
2. `LandingRuntime` return restoration contract drift: `scrollY` 단일 복원과 immediate consume이라는 hard contract를 벗어나 있다. B17 smoke가 green이어도 현재는 representative path에만 맞아떨어지는 상태라, 종료 전에 바로잡아야 한다.
3. reduced-motion transition lock gap: 전환 시작 잠금은 handshake 핵심인데 reduced-motion 경로에서만 빠질 수 있다. 회귀가 사용자군별로 숨어 들어가기 쉬워 상위 우선순위다.
4. blocker #11 traceability semantic mismatch: blocker #19는 green처럼 보이지만 증빙 품질이 얕으면 release review가 잘못 닫힐 수 있다. 기능 버그보다는 한 단계 낮지만, 종료 직전 evidence 품질 보강이 필요하다.
5. checklist 85 false green: 구현 버그를 문서가 가리고 있어 종료 판단을 왜곡한다. 기능 수정과 묶어서 즉시 reopen하거나 수정 후 다시 닫아야 한다.
6. checklist 86 false green: return restoration도 같은 문제가 있다. 실제 코드와 checklist가 어긋난 채 닫혀 있으면 phase closure가 신뢰를 잃는다.
7. 전역 axe-core broader coverage: 현재는 canonical audit이 존재하므로 릴리스 차단은 아니다. 다만 후속 accessibility audit phase에서는 가장 먼저 넓힐 가치가 있다.
8. GNB keyboard broader context/state audit: 기본 contract는 닫혔고, 남은 일은 state matrix 확대다. 릴리스 차단보다는 후속 coverage 과제에 가깝다.
9. dark baseline/CTA theme matrix 확대: 대표 baseline은 이미 있다. 기능 안정화 이후 screenshot breadth를 넓히는 후속 항목으로 두는 것이 적절하다.
10. client-only `<html lang>` sync: 전역 정합성 개선 포인트지만 랜딩 SSOT 직접 blocker는 아니다. 구조 재정리 성격이라 종료 후 넘겨도 된다.
11. debug/sample catalog exposure: 보조 요구사항 기준의 hygiene 이슈다. 현재 테스트/fixture 구조와 연결돼 있어 당장 급한 수정 대상은 아니다.

## 4. 종료 전 추천 적용 항목

### 지금 바로 해야 함
- `TestQuestionClient` ingress refresh 역전 버그를 수정하거나, 수정 전까지는 closure 문서와 checklist를 reopen해야 한다.
- `LandingRuntime` return restoration을 `saved scrollY + mount 직후 1회 + immediate consume` 계약으로 되돌리거나, 수정 전까지 checklist 86을 reopen해야 한다.
- reduced-motion 경로의 transition lock을 문서와 동일하게 맞추고, 최소 단위 테스트 1개 이상으로 증빙해야 한다.

### 여유 있으면 반영
- blocker #11 traceability를 row consistency를 실제로 닫는 assertion으로 보강하거나 매핑을 재지정한다.
- global axe-core와 GNB keyboard는 backlog 표현을 유지하되, broader matrix coverage를 차기 audit pass에서 넓힌다.
- dark baseline/CTA theme matrix는 대표 coverage가 이미 있으므로 visual pass에서 breadth만 추가한다.
- debug/sample fixture 노출은 production filtering 필요성이 확정되면 catalog filtering 또는 QA fixture 분리로 정리한다.

### 종료 후 후속으로 넘겨도 됨
- locale별 `<html lang>` SSR 정합성 개선은 전역 layout/i18n 리팩터링 축으로 따로 다루는 편이 안전하다.

## 5. 체크리스트 현행화 제안
- `[x] -> [ ]` 후보: [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 85 `Enforce test ingress/pre-answer/instruction/start-question contracts`
- 근거: [test-question-client.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/test/test-question-client.tsx) 74-107이 ingress flag를 `pending transition + ingress` 동시 존재로만 인정해 refresh 시 `Question 2 of 4 -> Question 1 of 4` 역전을 만든다. [transition-telemetry-smoke.spec.ts](/Users/woohyeon/Local/VibeTest/tests/e2e/transition-telemetry-smoke.spec.ts) 76-137은 refresh/re-entry를 검증하지 않는다. 2026-03-10 Playwright 재현에서도 ingress sessionStorage는 남아 있었지만 진행 표시는 Q1로 역전됐다.
- `[x] -> [ ]` 후보: [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 86 `Enforce dwell accumulation and return restoration hard contract`
- 근거: [landing-runtime.tsx](/Users/woohyeon/Local/VibeTest/src/features/landing/landing-runtime.tsx) 53-80이 source card anchor를 `scrollY`보다 우선하고, RAF settle 이후에야 [store.ts](/Users/woohyeon/Local/VibeTest/src/features/landing/transition/store.ts) 210-221의 clear를 호출한다. 이는 [docs/req-landing-final.md](/Users/woohyeon/Local/VibeTest/docs/req-landing-final.md) 13.8의 `mount 직후 1회 복원 + 즉시 consume`과 다르다.
- 유지 권고: [docs/reimpl-checklist-ssot.md](/Users/woohyeon/Local/VibeTest/docs/reimpl-checklist-ssot.md) line 90 `Map implementation checks to all release-blocking items 1~19`
- 근거: [blocker-traceability.json](/Users/woohyeon/Local/VibeTest/docs/blocker-traceability.json) 상 매핑 누락은 없다. 다만 blocker #11처럼 semantic fit이 약한 항목이 있으므로, 이번에는 `[x] -> [ ]`보다 “매핑 품질 보강 필요”로 다루는 편이 정확하다.
