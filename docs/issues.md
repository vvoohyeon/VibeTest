# P1: Release gate drift came from ignored baselines and adjacent unit drift

## 요약

P1은 telemetry/transition 런타임 자체가 틀렸다는 뜻이 아니었다.
현재 코드베이스를 다시 확인하면 short-expanded CSS 수정, `test-qmbti` / `qmbti` fixture 정렬,
theme representative helper 안정화는 이미 반영되어 있고 대표 Playwright 케이스도 통과한다.

실제 문제는 두 층으로 나뉘어 있었다.

1. Phase 11은 로컬 디스크에 snapshot PNG가 있으면 통과할 수 있었지만,
   그 파일들이 `.gitignore`에 가려져 저장소 진실로 승격되지 못했다.
2. 전체 release gate(`qa:gate:once`)는 Phase 11 외에도 `npm test`를 포함하므로,
   unit drift가 남아 있으면 여전히 빨간 상태였다.

## 현재 코드 기준 사실관계

- 현재 [package.json](/package.json) 의 `qa:rules`는 아래 순서로 실행된다.
  - `check-phase1-contracts.mjs`
  - `check-phase4-grid-contracts.mjs`
  - `check-phase5-card-contracts.mjs`
  - `check-phase6-spacing-contracts.mjs`
  - `check-phase7-state-contracts.mjs`
  - `check-phase8-accessibility-contracts.mjs`
  - `check-phase9-performance-contracts.mjs`
  - `check-phase10-transition-contracts.mjs`
  - `check-phase11-telemetry-contracts.mjs`
  - `check-blocker-traceability.mjs`
- `qa:static`은 `lint + typecheck + qa:rules`,
  `qa:gate:once`는 `qa:static + build + test + test:e2e:smoke`,
  `qa:gate`는 `qa:gate:once`를 3회 반복한다.
- 현재 [check-phase11-telemetry-contracts.mjs](/Users/woohyeon/Local/ViveTest/scripts/qa/check-phase11-telemetry-contracts.mjs) 는 telemetry 계약만이 아니라
  `tests/e2e/theme-matrix-smoke.spec.ts`, `tests/e2e/theme-matrix-manifest.json`,
  그리고 snapshot completeness까지 함께 검사한다.
- 현재 저장소에는 manifest naming과 맞지 않는 legacy theme baseline 12장이 추적돼 있었고,
  manifest가 실제로 요구하는 168장 theme baseline과 8장 safari baseline은 디스크에는 있어도 `.gitignore` 때문에 저장소에 드러나지 않았다.

## 핵심 해석

이 이슈의 본질은 “telemetry/transition 구현 미완료”가 아니라
아래 두 가지 저장소 드리프트가 동시에 release gate를 흔든 데 있다.

```text
1. Phase 11 green이 로컬의 ignored snapshot 파일 존재 여부에 의존했다.
2. 전체 gate는 unit drift까지 포함하므로 qa:rules만 green이어도 release-ready가 아니었다.
```

따라서 P1은 범위 정의 문제만도 아니고, 런타임 버그만도 아니다.
정확하게는 “현재 동작하는 테스트 상태가 저장소와 QA 문서에 제대로 반영되지 않은 상태”였다.

## 현재 정리 방향

- theme-matrix / safari baselines를 저장소에서 추적 가능한 자산으로 정리한다.
- Phase 11 QA에 representative test variant drift guard를 추가해 fixture 변경 시 조기 실패하게 만든다.
- `gnb-theme-transition` / `landing-card-contract` 같은 unit drift를 현재 runtime 계약에 맞춰 정리한다.
- 그 뒤 `qa:gate:once` 기준으로 다시 release-green 여부를 판단한다.


---

# P2: Ingress bootstrap no longer requires transition correlation

## 요약

현재 구현에서 Test ingress bootstrap의 권위는 `landingIngress` 자체다.
`pendingTransition`은 Q2 시작 여부를 결정하지 않으며, destination-ready 이후 internal `transition_complete`를 정리하는 보조 상태로만 남아 있다.
즉 현재 코드베이스는 “transition correlation-less ingress bootstrap” 모델로 굳어져 있고, 남은 충돌은 주로 문서 표현과의 정합성 문제다.

## 현재 구현된 코드와 로직

- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L55) 의 `resolveQuestionBootstrapState()`는 `landingIngress !== null`만으로 `landingIngressFlag`를 결정한다.
- 같은 함수에서 [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L74) `currentQuestionIndex`는 ingress 존재 시 `2`, 부재 시 `1`로 바로 정해진다.
- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L75) 는 ingress가 있으면 Q1 응답을 `answers.q1`로 즉시 채운다. 시작 문항 결정과 pre-answer bootstrap은 둘 다 ingress record만으로 수행된다.
- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L61) 의 `pendingTransition` 분기는 target type/variant가 맞는지 확인한 뒤 [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L77) `pendingTransitionToComplete`에 `transitionId`를 넣는 역할만 한다.
- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L104) 마운트 시 bootstrap은 `readPendingLandingTransition()`과 `readLandingIngress(variant)`를 각각 읽지만, 시작 문항 판정은 ingress 기준으로만 계산된다.
- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L131) destination-ready 이후 `completePendingLandingTransition()`을 호출하는 effect는 pending transition cleanup 전용이다. 이 effect가 없어도 이미 계산된 Q2 bootstrap은 유지된다.
- [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L152) 실제 runtime 시작 시점에는 `trackAttemptStart()`를 먼저 발화하고, [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L171) ingress가 있는 경우에만 `consumeLandingIngress(variant)`를 수행한다.
- [transition/store.ts](/src/features/landing/transition/store.ts#L20) 기준으로 ingress record는 `sessionStorage`의 `vivetest-landing-ingress:{variant}` 키에 저장된다.
- 저장 필드는 [transition/store.ts](/src/features/landing/transition/store.ts#L20) `variant`, `preAnswerChoice`, `createdAtMs`, `landingIngressFlag`뿐이다. `transitionId`나 correlation token은 저장되지 않는다.
- [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L49) 의 `beginLandingTransition()`는 test ingress에서 ingress record를 쓰고, [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L57) 바로 `trackCardAnswered()`를 발화한다.
- 이 순서는 [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L72) duplicate-locale 검증보다 앞선다. 따라서 duplicate-locale 실패에서는 public `card_answered`가 먼저 남을 수 있지만, 내부 rollback이 ingress/pending state를 즉시 제거한다.
- correlation은 bootstrap 권위가 아니라 internal transition signal 정합성과 cleanup 경계에만 남아 있다. [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L65) 는 `transition_start`, [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L91) 는 `transition_complete`, [transition/runtime.ts](/src/features/landing/transition/runtime.ts#L110) 는 `transition_fail|cancel` 신호를 보낸다.
- destination mismatch는 ingress 권위가 아니라 pending transition 쪽에서 fail-close 된다. [test-question-client.tsx](/src/features/landing/test/test-question-client.tsx#L105) 는 target type/variant mismatch를 `DESTINATION_LOAD_ERROR`로 정리하고, [blog-destination-client.tsx](/src/features/landing/blog/blog-destination-client.tsx#L40) 도 blog target이 아니면 동일하게 fail-close 한다.
- landing 재진입에서 stale pending transition은 [landing-runtime.tsx](/src/features/landing/landing-runtime.tsx#L67) `USER_CANCEL`로 정리된다.
- transition timeout monitor는 [transition-runtime-monitor.tsx](/src/features/landing/transition/transition-runtime-monitor.tsx#L9) `LANDING_TRANSITION_TIMEOUT_MS = 1600` 기준으로 pending transition만 감시한다. ingress 자체의 freshness나 만료는 여기서 판정하지 않는다.
- ingress record의 [transition/store.ts](/src/features/landing/transition/store.ts#L23) `createdAtMs`는 현재 bootstrap/read/consume 경로 어디에서도 freshness 판정에 사용되지 않는다. 현재 구현에서는 저장만 되고 해석되지 않는 메타데이터다.

## 현재 테스트/QA가 고정한 동작

- [test-question-bootstrap.test.ts](/tests/unit/test-question-bootstrap.test.ts#L6) 는 pending transition이 없어도 ingress만 있으면 Q2에서 시작해야 한다는 동작을 직접 고정한다.
- 같은 테스트의 [test-question-bootstrap.test.ts](/tests/unit/test-question-bootstrap.test.ts#L26) 는 pending transition completion이 ingress 기반 시작 문항 계산과 분리되어야 함을 고정한다.
- [landing-transition-store.test.ts](/tests/unit/landing-transition-store.test.ts#L73) 는 rollback이 pending transition, ingress flag, return scroll, body lock을 함께 정리해야 한다는 cleanup bundle을 고정한다.
- [landing-transition-runtime.test.ts](/tests/unit/landing-transition-runtime.test.ts#L91) 는 duplicate-locale test ingress가 internal fail-close로 종료되더라도 public `card_answered`는 이미 발화될 수 있음을 고정한다.
- [transition-telemetry-smoke.spec.ts](/tests/e2e/transition-telemetry-smoke.spec.ts#L113) 는 ingress 경로에서 Q2 bootstrap, `card_answered -> attempt_start -> final_submit`, internal `transition_start -> transition_complete` 순서를 함께 검증한다.
- [transition-telemetry-smoke.spec.ts](/tests/e2e/transition-telemetry-smoke.spec.ts#L265) 는 ingress consume 이후 같은 test route 재진입 시 instruction 재표시 없이 Q1 fallback이 일어나야 함을 고정한다.
- [transition-telemetry-smoke.spec.ts](/tests/e2e/transition-telemetry-smoke.spec.ts#L739) 와 [transition-telemetry-smoke.spec.ts](/tests/e2e/transition-telemetry-smoke.spec.ts#L766) 는 timeout / destination-load-error / landing remount cancel 경로에서 stale pending transition cleanup을 검증한다.
- [check-phase10-transition-contracts.mjs](/scripts/qa/check-phase10-transition-contracts.mjs#L47) 는 transition runtime이 ingress 저장과 `card_answered` 발화를 유지해야 함을 정적 게이트로 강제한다.
- 같은 스크립트의 [check-phase10-transition-contracts.mjs](/scripts/qa/check-phase10-transition-contracts.mjs#L63) 는 question client가 ingress read/consume 분리를 유지해야 함을, [check-phase10-transition-contracts.mjs](/scripts/qa/check-phase10-transition-contracts.mjs#L71) 는 fallback/runtime `transitionId` 상태에 의존하면 안 됨을 정적 게이트로 고정한다.

## 요구사항 문서와의 차이

- [req-landing.md](/docs/req-landing.md#L819) 13.4는 “Q1 pre-answer와 시작 문항 결정은 ingress flag 기준으로만 판단한다”고 적고, [req-landing.md](/docs/req-landing.md#L826) ingress flag 존재 시 instructionSeen 여부와 무관하게 Q2 시작을 요구한다. 이 부분은 현재 구현과 직접 맞물린다.
- 반면 [req-landing.md](/docs/req-landing.md#L844) 13.6은 pre-answer lifecycle 규칙 안에 [req-landing.md](/docs/req-landing.md#L850) “`transition correlation + landing ingress flag` 없는 유입에 pre-answer 적용 금지” 문구를 남겨 두고 있다.
- [req-test.md](/docs/req-test.md#L159) 는 `Ingress Flag`를 “시작 문항 판정의 유일한 근거”라고 정의하고, [req-test.md](/docs/req-test.md#L160) 는 `Validated Landing-origin Context`를 “랜딩 카드 선택과 ingress flag 저장이 하나의 원자적 동작으로 완료된 상태”로 정의한다. 현재 구현은 이 정의와 더 가깝다.
- [req-test.md](/docs/req-test.md#L466) 는 validated landing-origin context가 확인된 경우에만 Q1 pre-answer를 적용한다고 적고, [req-test.md](/docs/req-test.md#L467) context가 없으면 storage에 pre-answer가 남아 있어도 무시하라고 적는다. 이 문구는 “correlation token 보존”보다 “ingress flag 기반 문맥 판정” 쪽에 무게가 실린다.
- [req-landing.md](/docs/req-landing.md#L833) 와 [req-test.md](/docs/req-test.md#L153) 는 staged entry의 7분 만료를 다음 Phase 범위로 둔다. 현재 landing 구현은 `createdAtMs`를 저장하지만 ingress bootstrap 시 만료를 판정하지는 않는다.
- [req-landing.md](/docs/req-landing.md#L898) 와 [req-landing.md](/docs/req-landing.md#L907) 는 ingress flag 기록, Q2 시작/표시, consume 시점, rollback 3케이스, `card_answered -> attempt_start` 정합성을 release-blocking으로 둔다. 이 QA 문구는 현재 구현/테스트와 일치하지만, 13.6의 correlation 문구와는 긴장이 있다.

## 이번 분석으로 추가된 핵심 시사점

- 현재 코드, unit test, e2e smoke, Phase 10 QA는 모두 “transition correlation이 없어도 ingress bootstrap은 성립한다”는 모델을 공통으로 고정하고 있다.
- transition correlation은 현재 구현에서 bootstrap authority가 아니라 internal signal 정합성, source GNB overlay 유지, fail/cancel/timeout cleanup 경계를 위한 상태다.
- duplicate-locale 실패처럼 public `card_answered`는 남지만 ingress/pending state는 즉시 사라지는 경로가 존재한다. 즉 public telemetry와 internal transition terminal의 종료 시점은 완전히 동일하지 않다.
- `createdAtMs`가 현재 미사용이므로, staged entry freshness/expiry는 저장 포맷에 흔적만 있고 현재 landing bootstrap 계약에는 아직 연결되어 있지 않다.
- 따라서 P2의 실질 이슈는 “ingress bootstrap 버그”보다 “문서 일부가 여전히 correlation-required 모델처럼 읽힌다”는 정합성 문제에 더 가깝다.
- 후속 세션에서 바로 검토할 차이는 아래 3가지로 압축된다.
  - [req-landing.md](/docs/req-landing.md#L850) correlation 문구를 현재 ingress-first bootstrap 모델에 맞게 해석하거나 정리할 필요가 있다.
  - staged entry expiry는 다음 Phase 문서에 정의돼 있지만, 현재 landing bootstrap에서는 시행되지 않는다.
  - duplicate-locale 실패에서 `card_answered`가 먼저 남는 현재 순서를 제품/분석 관점에서 의도된 것으로 볼지 확인이 필요하다.

---

# P3: session_id semantics are still split across the active docs

## 요약

현재 구현은 `session_id`를 이벤트 생성 시점이 아니라 transport 시점에 보장하는 모델이다.
이벤트 객체는 pre-sync 상태에서 `session_id=null`로 생성·큐잉될 수 있고, 전송 직전에 `session_id`를 patch한다.
다만 이 보장은 validator나 서버가 아니라 client runtime 규약에 의해 성립하며, 활성 문서들 사이에서도 이 적용 시점이 동일한 수준으로 풀려 있지는 않다.

## 현재 구현된 코드와 로직

- [types.ts](/src/features/landing/telemetry/types.ts#L11) 의 공개 telemetry 공통 타입 `TelemetryBaseEvent`는 `session_id: string | null`을 허용한다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L44) 초기 runtime state에서 `sessionId`는 `null`이고, [runtime.ts](/src/features/landing/telemetry/runtime.ts#L146) `createBaseEvent()`는 현재 runtime state의 `sessionId`를 그대로 event payload에 넣는다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L166) consent source가 아직 sync되지 않았으면 runtime `sessionId`는 계속 `null`로 유지된다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L92) `canSendToNetwork()`는 `synced && consent_state === OPTED_IN && sessionId !== null`일 때만 `true`가 된다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L129) `enqueueOrSend()`는 전송 조건이 안 맞으면 event를 runtime queue에 적재한다.
- 이 queue는 [runtime.ts](/src/features/landing/telemetry/runtime.ts#L38) 메모리 배열 `runtimeState.queue`일 뿐이며, `localStorage`나 `sessionStorage`로 영속화되지 않는다. same-tab 런타임 동안만 유지되고, reload 후 durable queue로 복원되지는 않는다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L109) `flushQueue()`는 나중에 전송 가능 상태가 되면 queued event를 꺼내 [validation.ts](/src/features/landing/telemetry/validation.ts#L111) `patchTelemetryEventForTransport()`로 `session_id`와 `consent_state`를 덮어쓴 뒤 전송한다.
- [runtime.ts](/src/features/landing/telemetry/runtime.ts#L172) `OPTED_IN` sync 시점에는 `resolveSessionId()`를 호출해 session ID를 확보하려고 시도한다.
- 이 session ID는 [runtime.ts](/src/features/landing/telemetry/runtime.ts#L62) `localStorage`의 `vivetest-telemetry-session-id`를 우선 재사용하고, 없으면 [correlation-id.ts](/src/features/landing/lib/correlation-id.ts) 의 `createOpaqueId()`를 통해 `randomUUID -> getRandomValues` 순서로 생성한다.
- 랜덤 소스를 끝내 사용할 수 없으면 `sessionId`는 계속 `null`이고, 이 경우 event 객체 생성은 가능하지만 네트워크 전송은 계속 막힌다.
- event별 pre-sync 동작도 동일하지 않다.
  - [runtime.ts](/src/features/landing/telemetry/runtime.ts#L245) `trackCardAnswered`, [runtime.ts](/src/features/landing/telemetry/runtime.ts#L258) `trackAttemptStart`, [runtime.ts](/src/features/landing/telemetry/runtime.ts#L274) `trackFinalSubmit`는 consent sync 이전에도 호출될 수 있고 queue로 들어갈 수 있다.
  - 반면 [landing-runtime.tsx](/src/features/landing/landing-runtime.tsx#L79) `trackLandingView`는 `telemetrySnapshot.synced` 이후에만 발화된다. 따라서 `landing_view`는 다른 public event보다 더 늦은 시점에 생성된다.
- [consent-source.ts](/src/features/landing/telemetry/consent-source.ts#L7) 는 consent의 SSOT를 메모리 snapshot에 두고, `localStorage`는 persistence layer로만 사용한다.
- [consent-source.ts](/src/features/landing/telemetry/consent-source.ts#L58) invalid persisted consent는 `OPTED_OUT`로 안전하게 강등되며, [consent-source.ts](/src/features/landing/telemetry/consent-source.ts#L112) same-tab `setTelemetryConsentState()` 호출은 즉시 메모리 snapshot을 갱신한다.
- [validation.ts](/src/features/landing/telemetry/validation.ts#L54) `validateTelemetryEvent()`는 forbidden/legacy fields와 이벤트별 필수 필드는 검사하지만 `session_id !== null`은 강제하지 않는다.
- transport 직전에도 같은 validator를 다시 쓰지만, [validation.ts](/src/features/landing/telemetry/validation.ts#L111) validator 자체가 non-null session을 계약으로 들고 있지는 않다.
- 서버 경계는 더 느슨하다. [src/app/api/telemetry/route.ts](/src/app/api/telemetry/route.ts#L3) 는 request body가 JSON으로 parse되는지만 보고 `204`를 반환한다. payload schema나 `session_id`는 서버에서 재검증하지 않는다.

## 현재 테스트/QA가 고정한 동작

- [landing-telemetry-runtime.test.ts](/tests/unit/landing-telemetry-runtime.test.ts#L55) 는 `UNKNOWN` 상태에서 생긴 event가 queue에 쌓였다가 `OPTED_IN` 전환 후 flush되는 것을 고정한다.
- [landing-telemetry-runtime.test.ts](/tests/unit/landing-telemetry-runtime.test.ts#L71) 는 `OPTED_OUT` 전환 시 queued event가 폐기되는 것을 고정한다.
- [landing-telemetry-runtime.test.ts](/tests/unit/landing-telemetry-runtime.test.ts#L95) 는 persisted consent가 없으면 `sessionId=null` 상태로 전송이 막히고 queue만 쌓인다는 점을 고정한다.
- [landing-telemetry-runtime.test.ts](/tests/unit/landing-telemetry-runtime.test.ts#L110) 는 invalid persisted consent를 안전하게 `OPTED_OUT`로 해석해야 함을 고정한다.
- [landing-telemetry-runtime.test.ts](/tests/unit/landing-telemetry-runtime.test.ts#L120) 는 랜덤 소스가 불가해 `sessionId`를 만들 수 없는 경우에도 `OPTED_IN` 이후 전송을 막고 queue만 유지함을 고정한다.
- [landing-telemetry-validation.test.ts](/tests/unit/landing-telemetry-validation.test.ts#L5) 는 forbidden/legacy field와 `card_answered`/`final_submit` 필수 필드를 검증하지만, nullable `session_id` 자체를 직접 단언하지는 않는다.
- [vercel-analytics-gate.test.ts](/tests/unit/vercel-analytics-gate.test.ts#L89) 와 [vercel-speed-insights-gate.test.ts](/tests/unit/vercel-speed-insights-gate.test.ts#L89) 는 same-tab consent 변경 시 Vercel Analytics / Speed Insights gate가 같은 consent source를 즉시 따른다는 점을 고정한다.
- [check-phase11-telemetry-contracts.mjs](/scripts/qa/check-phase11-telemetry-contracts.mjs#L57) 는 telemetry runtime이 consent state machine과 helper surface를 유지해야 함을 정적 게이트로 검사한다.
- 같은 스크립트의 [check-phase11-telemetry-contracts.mjs](/scripts/qa/check-phase11-telemetry-contracts.mjs#L85) 는 validation file이 forbidden/legacy fields, `card_answered`, `final_responses` 검사를 유지해야 함을 요구하지만, transport payload의 non-null `session_id`를 직접 검사하지는 않는다.
- [transition-telemetry-smoke.spec.ts](/tests/e2e/transition-telemetry-smoke.spec.ts#L132) 는 실제 전송 payload를 캡처하지만, 현재 단언은 event ordering / required fields / forbidden fields에 집중되어 있고 `session_id`의 non-null을 직접 확인하지 않는다.

## 요구사항 문서와의 차이

- [req-landing.md](/docs/req-landing.md#L720) 는 `OPTED_IN`에서만 네트워크 전송 허용, [req-landing.md](/docs/req-landing.md#L721) `UNKNOWN/OPTED_OUT`에서는 로컬 큐 보관 가능이라고 적는다.
- [req-landing.md](/docs/req-landing.md#L732) 는 “공통 필수 필드(모든 전송 이벤트)”에 `session_id`를 포함하고, [req-landing.md](/docs/req-landing.md#L770) 랜덤 소스 불가 환경에서는 `session_id`를 만들지 않는다고 적는다.
- 이 서술은 “실제로 전송되는 event에는 session_id가 있어야 한다”는 해석과는 잘 맞지만, queued pre-sync event가 `session_id=null`로 시작할 수 있는지, queue가 durable한지, validator가 언제 non-null을 강제하는지까지는 적지 않는다.
- [requirements.md](/docs/requirements.md#L297) 는 payload requirements에서 `session_id`를 공통 필수 필드 목록과 별도로 분리해 쓰고, [requirements.md](/docs/requirements.md#L299) “queued pre-sync events may originate with `session_id=null` before transport patching”을 명시한다.
- 따라서 active docs 사이에서도 표현 밀도가 다르다. `requirements.md`는 현재 구현에 가깝고, `req-landing.md`는 transport-stage 필수성만 짧게 말하는 편이다.
- [req-test.md](/docs/req-test.md) 에는 `session_id`에 대한 직접 규정이 없다. 현재 P3의 해석 충돌은 사실상 `req-landing.md`와 `requirements.md` 사이에 있다.
- 또 하나의 차이는 보장 위치다. 활성 문서는 주로 payload semantics를 말하지만, 현재 구현에서 그 보장은 validator나 서버보다 client runtime에 집중돼 있다.

## 이번 분석으로 추가된 핵심 시사점

- 현재 구현의 실제 보장 문장은 “모든 event 객체가 처음부터 `session_id`를 가져야 한다”가 아니라 “실제 네트워크로 나가는 시점에는 client runtime이 `session_id`가 없는 event를 보내지 않는다”에 가깝다.
- 이 보장은 validator 단독 계약이 아니고, server contract도 아니다. 현재는 `canSendToNetwork()`와 transport patch 경로가 사실상의 enforcement point다.
- queued pre-sync event는 durable queue가 아니라 메모리 queue이므로, reload 이후까지 보존되는 분석 버퍼로 이해하면 안 된다.
- public event 중에서도 생성 시점은 다르다. `landing_view`는 sync 이후에만 생성되지만, `card_answered`/`attempt_start`/`final_submit`는 pre-sync 상태에서도 생성되어 queue에 들어갈 수 있다.
- same-tab consent 변경은 custom telemetry뿐 아니라 Vercel Analytics / Speed Insights gate에도 즉시 전파된다. 현재 consent source는 “telemetry send 여부”와 “third-party script mount 여부”를 같은 메모리 snapshot으로 묶는다.
- 현재 테스트와 QA는 consent state machine, queue flush/discard, forbidden fields, helper surface는 잘 고정하지만, “실제 전송 payload의 `session_id` non-null”은 직접 단언하지 않는다.
- 따라서 P3의 실질 이슈는 단순한 문서 표현 차이만이 아니라, “`session_id` 필수성의 적용 시점”과 “그 보장을 누가 책임지는가”가 문서마다 다르게 읽힌다는 점이다.
- 후속 세션에서 바로 검토할 차이는 아래 3가지로 압축된다.
  - `req-landing.md`의 “모든 전송 이벤트” 표현만으로 transport-patch 모델을 충분히 설명하는지.
  - `session_id` non-null 보장을 validator 또는 서버까지 끌어올릴 필요가 있는지.
  - 현재 메모리 queue만으로도 제품/분석 관점에서 충분한지, 아니면 durable queue semantics가 필요한지.
