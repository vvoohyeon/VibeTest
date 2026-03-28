# 1. 현재 상태 요약

## 구현 완료 / 부분 구현 / 미구현 영역

**구현 완료**
- 로케일 정규화 + SSR 문서 시맨틱 (`proxy.ts`, `i18n`)
- Landing 카탈로그 인터랙션 레이어 (catalog-grid, interaction-controller, layout/spacing plan)
- GNB / 테마 / 모바일 오버레이 / Expanded UX
- Transition 상태 기계 (begin / complete / fail / cancel / rollback)
- Telemetry 동의 게이트 + consent-source (custom + Vercel 통합)
- `card_answered`, `landing_view`, `attempt_start`, `final_submit` telemetry 이벤트 생성 (pre-sync 큐 포함)
- canonical test runtime path를 `src/features/test`로 분리하고 old `src/features/landing/test/*` 구현 경로 제거
- Storage key ADR 문서화 완료 (`test:{variant}:...`, `test:{variant}:flag:{flagName}`)
- Unit 테스트 111개 GREEN. `qa:gate:once`도 GREEN.

**부분 구현 (Shell만 있거나 프로토타입 수준)**
- `test-question-client.tsx`: 4문항 고정 루프, answer state, 단순 result echo. schema-driven scoring 없음, 결과 URL 없음, 세션 없음 → **clean-room 교체 대상**
- Staged Entry: `createdAtMs` 저장되어 있으나 7분 만료 판정 미시행
- Storage topology는 문서로 고정됐지만 runtime key migration은 아직 미구현
- `session_id` 보장: transport-patch 모델로 구현되어 있으나, validator/서버 계약 미강제

**미구현**
- Domain 타입 (`VariantSchema`, `ScoringSchema`, `QualifierFieldSpec`, `ScoreStats` 등) — Phase 1 대상
- `variant-registry.generated.json` 인터페이스 및 cross-sheet 검증 — Phase 2 대상
- Storage 추상 레이어 + 5개 상태 플래그 + variant-scope 격리 — Phase 3 대상
- 3-경로 진입 분류기 + invalid variant 에러 복구 페이지 — Phase 4 대상
- Instruction overlay (비-라우트), runtime entry commit 도메인 이벤트 — Phase 5 대상
- Result URL `/result/{variant}/{type}?{base64Payload}` 구조 — Phase 8 대상
- Result 섹션 렌더링 (mandatory/optional, content fallback) — Phase 9 대상
- History, Share URL, Admin — 후속 Phase

## 문서 신뢰 우선순위 (요약)

| 순위 | 문서 | 신뢰 판단 |
|---|---|---|
| 1 | `req-test.md` | 이번 착수 Phase SSOT. 충돌 시 최우선 |
| 2 | `req-landing.md` | 완료 영역 기준. §13.6 correlation 문구에 해석 여지 있음 (issues.md P2) |
| 3 | `req-test-plan.md` | Phase 1~3 구현 방향 구체성 높음. 신뢰 |
| 4 | `requirements.md` | 전역 범위 참고용. req-test.md와 충돌 시 하위 |
| 5 | `project-analysis.md` | 구현 상태 가설 생성용. 단정 금지 |
| 6 | `issues.md` | 현재 드리프트 이해용. 일부 반영됐을 수 있음 |

## 문서와 Q&A 통합 해석 시 핵심 포인트

- Gate GREEN 없이는 착수 불가. Traceability Closure (blocker 1~30 매핑) 선행.
- `src/features/test` 경로 분리는 완료됐고, 다음 남은 핵심은 `test-question-client.tsx` clean-room 교체다.
- Storage key ADR은 문서로 확정됐다. Phase 3에서는 이 결정을 바탕으로 runtime layer만 구현하면 된다.
- axisCount 1/2/4 첫 구조에서 모두 수용. MBTI 하드코딩 절대 금지.
- "지금 빨리 만들지만 다음 Phase에서 뜯는" 결정을 최우선으로 차단.

## 문서 간 충돌 및 주의점

| 충돌 포인트 | 설명 |
|---|---|
| req-landing.md §13.6 vs 구현 | correlation 문구 vs ingress-first bootstrap. P2 확정: ingress-first가 맞지만 문서 미정리 |
| requirements.md vs req-test.md | session_id transport-patch 모델 명시 수준 차이. req-test.md에 직접 규정 없음 |
| question-bank.ts vs AR-001 | 코드는 unknown variant → generic fallback. req-test.md는 에러 복구 페이지로 이동 |
| Phase 11 QA gate vs 저장소 | baseline은 로컬 QA 자산 기준으로 운영. 현재 워크트리 기준 `qa:gate:once` GREEN |

## 이번 우선순위에서 특히 강하게 반영할 운영 원칙

- QA gate GREEN 유지 필수
- 코드 리팩터링보다 ADR/계약 확정 우선
- "다음 Phase에서 다시 뜯지 않을 결정"을 지금 굳힘
- UX fallback/recovery와 구조·도메인 계약을 동등 비중
- Sheets sync, history, admin: 인터페이스/경계 설계 관점에서만

---

# 2. 우선순위 Top 10 개선 과제

## 1 — QA Gate GREEN 복구 + Blocker Traceability 완결

- **카테고리**: QA / Testing
- **현재 상태**: 완료. 현재 과제는 GREEN 유지다.
- **현재 문제 징후**
  - 현재 워크트리에서는 `qa:gate:once`가 GREEN이다. 직전 드리프트는 combined theme label 기대값과 representative screenshot baseline 불일치였다.
  - 이후 동일 범주의 드리프트가 재발하면 message contract와 local baseline policy를 함께 점검해야 한다.
  - `check-blocker-traceability.mjs`와 `docs/blocker-traceability.json`은 현재 1~30 범위를 통과하지만, future-phase blocker 추가 시 다시 drift가 날 수 있다.
- **근거 문서**: project-analysis §9, req-landing.md §14.4, req-test.md §12.3
- **왜 착수 전에 먼저 봐야 하는지**: gate가 다시 RED로 돌아가면 Phase 1 완료 판정 자체가 불가능해진다. 릴리스 신호 신뢰를 유지해야 한다.
- **미개선 시 리스크**: 이후 변경에서 representative baseline/message contract가 다시 어긋나면 `qa:gate` 신뢰가 다시 무너진다.
- **기대 효과**: "릴리스 가능한 상태" 기준선을 계속 유지한다. Phase 1 DoD 완료 판정 신뢰를 보존한다.
- **긴급도**: P0

---

## 2 — `src/features/test` 네임스페이스 분리 + `test-question-client.tsx` clean-room ADR 확정

- **카테고리**: Architecture / Docs
- **현재 상태**: 부분 완료. path split은 끝났고 clean-room replacement가 남아 있다.
- **현재 문제 징후**
  - 현재 canonical test runtime은 `src/features/test/`로 분리됐지만, `test-question-client.tsx` clean-room 교체는 아직 남아 있다.
  - 경로 분리는 끝났고, 다음 남은 과제는 현재 bootstrap/fallback 구현을 clean-room runtime으로 대체하는 것이다.
  - canonical path는 바로잡았지만, domain foundation을 현 runtime 위에 누적하면 provisional bootstrap/fallback 제약이 그대로 남는다.
- **근거 문서**: project-analysis §2, §3, §5; req-test-plan.md Part 2 개요
- **왜 착수 전에 먼저 봐야 하는지**: 이제 구조 이동 리스크보다, 현재 임시 runtime 위에 도메인 로직을 계속 덧쌓는 리스크가 더 크다.
- **미개선 시 리스크**: clean-room 없이 Phase 1~5를 얹으면 bootstrap, fallback, invalid-variant 제약이 새 도메인 모델과 계속 충돌한다.
- **기대 효과**: canonical path split 위에서 test-owned runtime을 진짜 도메인 경계로 마무리할 수 있다.
- **긴급도**: P0

---

## 3 — Storage Key ADR + 5개 상태 플래그 계약 문서화 (Phase 1 이전 완료)

- **카테고리**: State / Docs / Architecture
- **현재 상태**: 문서 결정 완료. runtime 구현은 후속 Phase 과제다.
- **현재 문제 징후**
  - key naming 자체는 확정됐다. 현재 남은 차이는 runtime storage layer가 아직 이 ADR을 코드로 구현하지 않았다는 점이다.
  - reserved segment와 variant-scoped cleanup 원칙은 문서에 고정됐으므로, Phase 3는 설계가 아니라 구현 문제로 좁혀졌다.
- **근거 문서**: req-test-plan.md Part 4, req-test.md §6.8, §8.2, §8.3
- **왜 착수 전에 먼저 봐야 하는지**: Phase 3 구현이 ADR과 다른 prefix/grouping으로 새어 나가면 문서와 런타임이 다시 분리된다.
- **미개선 시 리스크**: runtime key migration 시점에 variant-scope cleanup과 future flag naming이 재드리프트할 수 있다.
- **기대 효과**: Phase 3에서는 `test:{variant}:...`와 `test:{variant}:flag:{flagName}` 규칙을 그대로 구현하면 된다.
- **긴급도**: P0

---

## 4 — Domain Foundation 타입 계약: axisCount 가변 구조 + EGTT qualifier 수용

- **카테고리**: Domain Model / Architecture
- **현재 문제 징후**
  - 현재 코드에 `VariantSchema`, `ScoringSchema`, `QualifierFieldSpec`, `ScoreStats`, `DerivedType` 등 핵심 도메인 타입이 없음 (project-analysis §2: "no schema-driven scoring").
  - `question-bank.ts`의 현재 fallback 구조는 MBTI 4축 하드코딩 전제. axisCount 1/2/4 첫 구조에서 모두 수용 필요.
  - EGTT (axisCount=1, qualifierFields 1개)는 Phase 2 이후 fixture 추가지만, Phase 1 타입이 qualifier 구조를 수용하지 못하면 Phase 2~3이 Phase 1을 뜯어야 함.
  - `qualifierFields.questionIndex`가 scoring 문항을 가리키면 blocking error — 이 검증 로직도 Phase 1 pure 함수 대상.
- **근거 문서**: req-test-plan.md T1-1~T1-6, req-test.md §3.1, §3.8, §3.11, §6.2
- **왜 착수 전에 먼저 봐야 하는지**: Phase 1 타입이 모든 이후 Phase의 전제. 지금 MBTI-only로 좁혀놓으면 Phase 2에서 EGTT 추가 시 Phase 1 전면 재작성.
- **미개선 시 리스크**: Phase 2 EGTT fixture 추가 시 `qualifierFields` 구조를 Phase 1 타입이 수용 못함. `parseTypeSegment`, `buildTypeSegment` EGTT 케이스 실패. `scale` mode 선언 variant blocking error 부재 → blocker #12 미매핑.
- **기대 효과**: Phase 1 DoD 완료 시 Phase 2~11 타입 전제 확립. MBTI, EGTT, 향후 variant 모두 동일 코드 경로 처리.
- **긴급도**: P0

---

## 5 — Invalid Variant → 에러 복구 페이지 계약 확정 (현재 코드와 역방향 충돌)

- **카테고리**: UX / Domain Model / Architecture
- **현재 문제 징후**
  - `question-bank.ts`: unknown variant → generic questions fallback 제공. **req-test.md AR-001과 정반대 계약** — invalid variant는 crash 없이 에러 복구 페이지 이동, session/run 생성 없음.
  - 에러 복구 페이지 구조 (미완료 테스트 카드 최대 2개, 카탈로그 순서 + 완료 이력 필터) 미구현.
  - `validateVariant()` pure 함수도 없음 (Phase 1 T1-2 대상).
  - invalid variant가 2순위 위험 실패로 명시. no-session-on-failure 우선.
  - `adapter.ts` test card unavailable 필터링 누락이 별도 결함으로 추가 확정. Phase 2 착수 전 필터링 계약 레이어 ADR 필요
- **근거 문서**: req-test.md AR-001, §3.2, §6.1, §12.2 blocker #1; req-test-plan.md T1-2
- **왜 착수 전에 먼저 봐야 하는지**: 현재 코드의 generic fallback 동작이 Phase 4(진입 경로 분류기) 구현 시 충돌. clean-room 교체 전, 계약 방향을 확정해두지 않으면 Phase 4 구현이 두 계약 사이에서 분열.
- **미개선 시 리스크**: Phase 4 착수 시 `question-bank.ts` fallback 로직과 `validateVariant` 결과 소비 경로가 충돌. blocker #1 (Variant Validation) 자동 단언 매핑 불가. 에러 복구 카드 2개 제공 로직이 history 연동 시점까지 임시 구조로 누적됨.
- **기대 효과**: Phase 4 진입 경로 분류기가 `validateVariant → ok:false → 에러 복구 페이지` 경로를 명확하게 의존. no-session-on-failure 보장 구조 확립.
- **긴급도**: P1

---

## 6 — Ingress Bootstrap 문서-구현 정합성 해소 + Staged Entry Expiry 계약 확정

- **카테고리**: UX / State / Docs
- **현재 문제 징후**
  - req-landing.md §13.6: "transition correlation + landing ingress flag 없는 유입에 pre-answer 적용 금지" 문구 → 현재 ingress-first bootstrap 모델과 긴장. 문서 미정리 상태.
  - Landing 단 계약과 Test 단 계약이 staged entry expiry를 서로 다른 Phase 범위로 다루는 방식이 명확하지 않음.
  - staged entry / ingress / active run UX 일관성이 가장 민감한 항목.
- **근거 문서**: req-landing.md §13.4, §13.6, req-test.md §3.3, §3.5
- **왜 착수 전에 먼저 봐야 하는지**: req-landing.md correlation 문구가 정리되지 않으면 Phase 4 staged entry commit 구현 시 landing 단 재작업 요구. `createdAtMs` 미사용 상태가 Phase 4로 넘어가면 staged entry expiry 구현이 landing 스토리지 계약 수정을 유발.
- **미개선 시 리스크**: Phase 4에서 staged entry 7분 만료 구현 시 landing ingress record 구조 변경 필요 → landing Phase QA 재실행. blocker #19 (Staged Entry) 단언이 landing 단 구조에 의존하는 지점에서 충돌.
- **기대 효과**: landing-test 경계에서의 staged entry 책임 분리 확정. Phase 4 착수 시 landing 단 재작업 없이 expiry 판정 추가 가능.
- **긴급도**: P1

---

## 7 — Session_id 명시 계약 + Telemetry 이벤트 서사 기반 QA 강화

- **카테고리**: Telemetry / Docs / QA
- **현재 문제 징후**
  - `validateTelemetryEvent()`는 `session_id !== null`을 강제하지 않음. e2e smoke도 session_id non-null을 직접 단언하지 않음.
  - `landing_view`는 sync 이후에만 생성 (다른 이벤트와 생성 시점 비대칭). 이 해석 규칙이 문서화되지 않으면 cross-phase integrity 분석 시 분모 해석 오류 발생.
  - transport-patch 모델 → 명시 계약으로 격상. QA = "이벤트 서사" 기준.
- **근거 문서**: req-landing.md §12, req-test.md §9.1, §9.2, §12.2 blocker #18
- **왜 착수 전에 먼저 봐야 하는지**: req-test.md §9 telemetry skeleton (Phase 11)은 6개 hook 위치 확보가 목표지만, hook이 잘못된 session_id 계약 위에 쌓이면 cross-phase event integrity(blocker #28) 검증 시 재작업. "이벤트 서사" QA 기준 없이는 blocker traceability 완결 불가.
- **미개선 시 리스크**: Phase 11 telemetry skeleton hook이 session_id null-risk 포함 상태로 추가됨. cross-phase `card_answered → attempt_start` integrity가 session_id 비대칭으로 인해 잘못 분석됨. share/history 구현 시 세션 단위 데이터 신뢰 불가.
- **기대 효과**: telemetry event 생성 시점 비대칭 해석 규칙 문서화. transport-patch 경로가 명시 계약으로 고정되어 Phase 11 hook 위치 설계 시 혼선 제거.
- **긴급도**: P1

---

## 8 — Cross-phase Event Integrity 픽스처 공유 계약 (Blocker #15 ↔ #28 연동)

- **카테고리**: QA / Telemetry / Testing
- **현재 문제 징후**
  - req-landing.md §14.3 blocker #15: `card_answered → attempt_start` 순서, `landing_ingress_flag` 일관성.
  - req-test.md §12.2 blocker #28: 동일 요구를 test Phase blocker로 선언. "두 블로커의 단언이 동일 픽스처를 공유해야 한다"고 명시.
  - 현재 어느 픽스처에 이 단언이 속하는지, 공유 구조가 구현되어 있는지 불명확.
  - e2e smoke가 event ordering 단언은 있으나 `question_index_1based` 값과 `landing_ingress_flag` 일관성을 직접 단언하지 않음
- **근거 문서**: req-landing.md §14.3 blocker #15, req-test.md §12.2 blocker #28, §11 (cross-phase event integrity 동기화 트리거)
- **왜 착수 전에 먼저 봐야 하는지**: blocker #28 단언이 test Phase 착수 시 어디서 작성되는지 결정되지 않으면, 이미 완료된 landing Phase의 traceability closure가 test blocker와 분리됨. 공유 픽스처 구조가 없으면 같은 시나리오를 두 번 작성하거나 한쪽이 미매핑 상태로 남음.
- **미개선 시 리스크**: blocker #15, #28 중복 구현 또는 미매핑. traceability closure 미완성으로 Phase 11 gate 실패. landing/test 경계의 QA 픽스처 소유권 불명확 고착.
- **기대 효과**: landing-test 경계 pixture 공유 구조 확정. blocker #15, #28 동시 GREEN 가능. Phase 11 traceability closure 안전 달성.
- **긴급도**: P1

---

## 9 — Missing Result Content Fallback 구조 ADR (Mandatory 섹션 보장 + Operator Warning)

- **카테고리**: UX / Domain Model / Architecture
- **현재 문제 징후**
  - req-test.md AR-003, AR-004: mandatory 섹션(`derived_type`, `axis_chart`, `type_desc`)은 항상 렌더링, optional은 `supportedSections` 선언 기준. content mapping 누락 시 빈 컨테이너 + '준비 중' 문구 + operator console warning. hard crash 금지.
  - 현재 result panel은 단순 response echo. 섹션 구조, fallback 경로, operator warning 없음.
  - `adapter.ts` tolerant normalization (malformed → empty string/zero)이 향후 blocking validator와 충돌 예정 (Q15: Phase 2에서 자연 분리 예정이지만, 이 방향을 지금 ADR로 확정 필요).
  - missing result content = 1순위 위험 실패. mandatory/optional section fallback + operator-visible warning 구조가 최우선.
- **근거 문서**: req-test.md §3.12, §6.4, §7.1, AR-003, AR-004, §12.2 blocker #13, #16; project-analysis §9
- **왜 착수 전에 먼저 봐야 하는지**: Phase 9(Result Page) 착수 시 섹션 등급 구조 없이 구현하면 mandatory/optional 분리 재작업 발생. `adapter.ts` tolerant 정책이 Phase 2 validator 도입 시점까지 생산 경로에 남으면 silent error 누적.
- **미개선 시 리스크**: Phase 9 구현이 ad-hoc 섹션 배치로 시작 → mandatory fallback 누락 → hard crash 경로 잔존. blocker #13 (Result Payload Validation) 부분 렌더링 '0건' 보장 불가.
- **기대 효과**: Phase 9 착수 시 섹션 등급(mandatory/optional), fallback 동작, operator warning 위치가 ADR로 고정됨. `adapter.ts` 교체 경로 확정으로 Phase 2 validator 도입 시 충돌 방지.
- **긴급도**: P1

---

## 10 — Representative Variant 범위 축소 + QA 스냅샷 자산 추적 가능성 정비

- **카테고리**: QA / Testing
- **현재 상태**: 완료. 현재 과제는 representative coverage와 local baseline policy를 계속 유지하는 것이다.
- **현재 문제 징후**
  - representative test route anchor, local-only baseline 정책, mixed-evidence blocker registry는 현재 워크트리에 반영돼 있다.
  - `qa:gate:once`가 현재 GREEN이더라도, theme recipe나 Safari visual contract를 바꾸면 manifest와 local baseline을 함께 갱신해야 한다.
  - baseline PNG는 로컬 QA 자산이므로 Git tracked completeness보다 local directory completeness와 gate pass가 더 중요한 운영 기준이다.
  - 신규 settle recipe를 추가할 때 representative 범위를 과도하게 넓히지 않도록 관리가 필요하다.
- **근거 문서**: project-analysis §9, §10 item 6, req-test.md §12.2 blocker #26
- **왜 먼저 봐야 하는지**: representative contract와 local baseline policy가 흐려지면, 다음 visual/theme 변경에서 gate가 다시 흔들릴 수 있다.
- **미개선 시 리스크**: manifest, representative variant, local baseline이 따로 움직이면 동일 계열의 gate drift가 반복된다.
- **기대 효과**: test flow 확장 시 baseline 추가 범위가 예측 가능해지고, Phase 11 gate 안정성이 유지된다.
- **긴급도**: P1

---

# 3. 최종 우선순위 정렬표

| 순위 | 과제명 | 긴급도 | 투입 대비 효과 | 테스트 플로우 선행 필요성 | 확신도 |
|---|---|---|---|---|---|
| 1 | QA Gate GREEN 복구 + Blocker Traceability 완결 | P0 | 매우 높음 | **착수 불가 전제조건** | 높음 |
| 2 | `src/features/test` 분리 + clean-room ADR 확정 | P0 | 매우 높음 | **path split 완료, clean-room 후속** | 높음 |
| 3 | Storage Key ADR + 5개 상태 플래그 계약 | P0 | 매우 높음 | **Phase 1 타입 설계 전제** | 높음 |
| 4 | Domain Foundation 타입: axisCount 1/2/4 + qualifier 수용 | P0 | 매우 높음 | **Phase 1 핵심 산출물** | 높음 |
| 5 | Invalid Variant → 에러 복구 페이지 계약 (현행 역방향 충돌 해소) | P1 | 높음 | Phase 4 착수 전 필수 | 높음 |
| 6 | Ingress Bootstrap 문서 정합 + Staged Entry Expiry 계약 | P1 | 높음 | Phase 4 staging 전 필수 | 높음 |
| 7 | Session_id 명시 계약 + 이벤트 서사 QA 기준 | P1 | 높음 | Phase 11 hook 설계 전 | 높음 |
| 8 | Cross-phase Event Integrity 픽스처 공유 계약 (blocker #15↔#28) | P1 | 높음 | Phase 11 traceability 전 | 중간 |
| 9 | Missing Result Content Fallback 구조 ADR | P1 | 높음 | Phase 9 착수 전 필수 | 높음 |
| 10 | Representative Variant 축소 + QA 스냅샷 자산 정비 | P1 | 높음 | Gate 안정화 선행 | 높음 |

---

# ADR/결정 문서화 상태와 남은 포인트

| # | ADR 주제 | 상태/시점 | 이유 |
|---|---|---|---|
| A | **`src/features/test` 경계와 파일 구조** | 완료 | canonical path split과 consumer cutover가 끝났고, clean-room ADR 후속만 남아 있다 |
| B | **Storage key 네이밍 + 5개 상태 플래그 구조 + variant-scope 격리 전략** | 완료 | `test:{variant}:...` / `test:{variant}:flag:{flagName}` 규칙이 문서로 확정됐다 |
| C | **Invalid variant 처리 경로 (AR-001 재확인 + `question-bank.ts` 교체 타이밍)** | Phase 4 이전 | 현재 코드와 역방향 충돌 해소 |
| D | **`session_id` 보장 위치 (transport-patch client-runtime 계약 명시화)** | Phase 11 이전 | 이벤트 서사 QA 기준 전제 |
| E | **Representative variant + manifest-baseline 대상 범위** | 완료(운영 유지) | gate 안정화와 테스트 플로우 확장 시 local baseline policy를 계속 일관되게 유지해야 한다 |
| F | **`unavailable` test card 카탈로그 제외 계약 레이어 결정** | Phase 2 ADR | `normalizeLandingCards()`와 registry 소비 레이어 중 책임 위치를 확정해야 한다 |
| G | **blocker traceability 범위와 evidence 정책** | 완료(1~30) | 이후 future-phase blocker 추가 시 상한과 evidence type 운영 규칙만 유지하면 된다 |
| H | **test-flow telemetry hook 검사 추가 계획** | Phase 11 이전 | req-test.md §9.1의 6개 hook 완전 커버 보장 |

> **운영 메모** — `unavailable` test card 필터 책임 위치와 test-flow telemetry hook coverage는 여전히 후속 ADR이 필요하다. 반면 blocker traceability 1~30 closure, representative baseline 정책, canonical path split, storage key naming은 이번 changeset 기준으로 문서화가 끝난 상태다.
