## Q1. 출시 일정 압박 수준

- **중간** — 한 스프린트 내 안정적 착수가 목표. P0/P1과 일부 P2까지 균형 있게 진행

## Q2. QA gate 허용 범위

아래 2개 준수

- **선행 필수** — gate GREEN 복구 후에만 착수. 신뢰할 수 있는 릴리스 신호 없이 시작 불가. blocker traceability 최우선.
- **문서화된 편차 허용 안함** — known deviation 문서화, 문서-게이트 불일치까지 모두 정리

## Q3. 리팩터링 허용 범위

- **최소 변경 / ADR 문서화만** — 코드는 건드리지 않고 결정·방향만 확정. 구조 개선은 후순위.
- 이후 별도 세션을 통해 근본적인 구조 개선 등 대대적인 리팩토링 착수 예정

## Q4. 이번 단계의 제품 우선순위

- **이후 Phase / share·history·admin까지 버틸 구조도 고려** — Domain Model / Data Contract / State 경계 정리 포함

## Q5. UX 품질과 구조 개선 중 어느 쪽 비중

아래 UX 과제와 domain 과제를 동등하게. cross-phase event integrity 등 둘을 동시에 묶는 과제를 우선한다.

- **UX 연속성 / fallback / recovery 우선** — instruction overlay, invalid variant, loading, result fallback, error UX가 앞선다.
- **구조·도메인·데이터 계약 우선** — variant/scoring/result/storage/session 선행 정리를 최상단으로.

## Q6. Sheets / history / admin 도입 시점은 언제입니까?

- Sheets sync 는 fixture 기반으로 테스트 플로우 전체 완료 후 별도 Phase 에서 구현 예정
- history 와 admin 은 가장 마지막에 도입 예정

## Q7. 이번 단계에서 가장 우선인 품질 축

아래 3가지를 균형있게 고려

- **접근성** — instruction overlay, error recovery, result fallback, keyboard/focus 경로. Phase 11 axe gate 범위 포함.
- **성능** — Core Web Vitals, landing interaction controller 결합도, base64 payload 파싱, 브라우저 variance.
- **기능 완성도 우선, non-functional은 이후** — 릴리스 gate의 performance/accessibility 임계값을 지금은 높이지 않음.

## Q8. 테스트 플로우 구현 범위는 얼마나 확정되어 있습니까?

- **핵심 규칙 일부 해석 여지 있음** — ingress/staged entry/telemetry/document drift를 더 높은 우선순위로 잡는다.

## Q9. 테스트 플로우 완료 후 출시 경로와 다음 단계는 무엇입니까?

- **일정 미정, 품질 우선** — 각 Phase 완료 조건(DoD)을 엄격하게 지키는 것이 기준. gate 복구 선행 필요.

## Q10. `test-question-client.tsx` 프로토타입 처리 방침은 무엇입니까?

- **A. 전면 교체 (clean-room)** — Phase 1~5 구현 시 기존 파일을 완전히 대체. 현재 e2e smoke 테스트 일시 중단 감수.
- **B. 점진적 오버레이** — 기존 파일 위에 새 도메인 모델을 레이어로 추가. 기존 smoke 테스트 유지. 두 모델 공존 기간 충돌 리스크 있음.
- **C. 아직 미결** — Phase 1 착수 전에 이 결정을 내리는 ADR을 1순위로 두어야 함.

## Q11. `src/features/landing` 네임스페이스 분리 계획은 어떻게 됩니까?

- **A. `landing` 안에 계속 쌓기** — 단기 빠름. landing이 전체 앱 모듈화가 되어 책임 경계가 흐려질 수 있음.
- **B. 테스트 플로우 착수 전에 `src/features/test` 분리** — 파일 구조 안정화 후 착수. 단기 비용 있지만 장기 확장성 확보.
- **C. 우선 landing 아래, 나중에 추출** — 현재 scaffold(`src/components`, `src/hooks`)를 활용해 이후 추출 예정.

## Q12. EGTT variant fixture는 언제 준비할 예정입니까?

- **Phase 1은 MBTI만으로 시작, EGTT는 Phase 2 이후** — 빠른 착수. `qualifierFields` 경로 단위 테스트 공백 발생.

## Q13. local history와 share URL 생성은 언제 착수할 예정입니까?

- **1개 스프린트 이상 뒤** — Phase 1~11 완료 후 별도로. 지금은 인터페이스만 예약.

## Q14. Telemetry `session_id` enforcement를 어느 수준까지 강화할 계획입니까?

- **A. validator에서 non-null 강제 추가** — transport 직전 validator가 `session_id !== null`을 검사. 중간 비용, 테스트 가능성 높아짐.
- **B. server API 강화** — `route.ts`에서 payload schema 검증 추가. 가장 강한 보장이지만 서버 로직 추가 필요.
- **C. 현재 client-only 모델 유지** — test phase skeleton이 같은 패턴을 따름. 이후 별도 Phase에서 강화.

## Q15. `adapter.ts` tolerant normalization 정책을 blocking error로 바꿀 계획이 있습니까?

- **A. Phase 1 시작 전에 adapter 레이어 분리/교체** — fixture adapter는 dev-only tolerance 유지, registry 로딩 레이어에서는 blocking error. 가장 안전.
- **B. Phase 2 registry 인터페이스 정의 시 자연스럽게 분리** — Phase 1은 pure function이므로 adapter 미접촉. Phase 2에서 registry 로딩 레이어가 validator를 호출.
- **C. 현재 adapter 그대로 유지** — production 경로에서 fixture를 사용하지 않는다는 §2.7 계약으로 충분.

## Q16. 5개 상태 플래그 storage key ADR은 언제 작성할 예정입니까?

- **Phase 1 이전에 미리 작성** — Phase 3에서 storage 구조 바꿀 리스크 최소화. Phase 1 타입과 storage key 구조 간 정합성 사전 확인.

## Q17. variant 지원 폭은 첫 구현에서 어디까지 수용해야 합니까?

- **axisCount 1·2·4는 모두 첫 구조에서 수용** — hardcoding 방지와 schema-driven foundation 우선.

## Q18. telemetry 신뢰성은 이번 단계에서 어느 수준까지 요구합니까?

- **A. 클라이언트 계약 정합성만 맞으면 충분** — server authority는 후순위.
- **B. 최소한 payload/schema enforcement 방향은 지금 잡아야 한다** — telemetry ingestion boundary를 Top 10 안에 포함.
- **C. analytics는 아직 약해도 무방, core flow 무중단이 더 중요** — tracking resilience만 유지하고 나머지는 낮춤.

## Q19. representative variant / screenshot baseline 같은 QA 자산은 어떤 방식으로 운영하겠습니까?

- **A. 강한 게이트 유지** — 자산 freshness, manifest closure, fixture drift guard 자체가 선행 개선 과제.
- **B. 게이트는 유지하되 범위를 줄이고 싶음** — 대표 케이스 최소화, variant 대표성 재정의.
- **C. 당분간 기능 구현 우선, 자산 운영 부담은 낮추고 싶음** — Phase 11 관련 과제의 우선순위를 내림.

## Q20. ingress / staged entry / active run 쪽에서 가장 민감한 것은 무엇입니까?

- **A. 사용자 경험 일관성** — Q2 시작, pre-answer, resume/cold 분기, tail reset 체감이 우선.
- **B. 상태 정합성과 cleanup 원자성** — storage/session lifecycle, cleanup set, variant-scoped isolation이 최상위.
- **C. telemetry 해석 가능성** — `card_answered → attempt_start → question_answered → final_submit` 정합성이 더 중요.

## Q21. invalid variant / malformed payload / missing result content 중 가장 위험한 실패는 무엇입니까?

- **A. invalid variant** — variant validation, error recovery page, no-session-on-failure 우선.
- **B. malformed payload** — result URL parser/validator와 self-contained payload contract 선행성이 올라감.
- **C. missing result content** — mandatory/optional section fallback과 operator-visible warning 구조가 앞섬.

## Q22. 이번 우선순위 산출에서 가장 피하고 싶은 결과는 무엇입니까?

- **지금 빨리 만들었지만 다음 Phase에서 다시 뜯는 것** — 구조적 선행 과제를 더 과감하게 위로 올린다.
