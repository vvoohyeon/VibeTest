# Test Phase 0 ADR Status

> 기준 시점: 2026-03-28  
> 목적: `docs/req-test-plan.md` Phase 0 ADR-A / ADR-B / ADR-E의 현재 상태를 실제 워크트리 기준으로 기록한다.

## ADR-A — `src/features/test` 네임스페이스 분리 + `test-question-client.tsx` clean-room 교체

**상태**: 부분 완료

현재 저장소 사실:
- canonical test runtime은 `src/features/test/` 아래에 있다.
- `src/app/[locale]/test/[variant]/page.tsx`와 관련 unit test/QA consumer는 `@/features/test/*`를 사용한다.
- `src/features/landing/test/*` 구현 파일은 삭제되었고 shim은 남기지 않았다.
- malformed variant는 route 단계에서 `notFound()`로 종료되고, unknown variant는 `question-bank.ts` generic fallback을 사용한다.

이번 changeset에서 확정하는 결정:
- canonical namespace는 `src/features/test`로 고정한다.
- `src/features/landing/test/*`는 shim 없이 제거한다.
- clean-room 교체 범위는 test question runtime, question definition resolution, test-owned storage/telemetry seam까지 포함한다.

미완료 사유:
- 물리 경로 분리와 consumer cutover는 끝났지만, clean-room replacement 자체는 아직 수행되지 않았다.
- same-route recoverable invalid-variant 처리도 아직 현행 워크트리에 없다.

## ADR-B — Storage Key 네이밍 + 5개 상태 플래그 계약

**상태**: 완료

현재 저장소 사실:
- runtime key migration은 아직 수행되지 않았다.
- 이후 구현이 사용할 storage topology는 문서로 고정됐다.

이번 changeset에서 확정하는 결정:
- prefix는 `test:{variant}:...`로 고정한다.
- cleanup bundle은 variant-scoped prefix 내부에서만 동작한다.
- 5개 future flag는 `test:{variant}:flag:{flagName}` reserved segment로 선언한다.
- 이번 changeset에서는 문서 결정만 추가하며, 런타임 key migration은 하지 않는다.

## ADR-E — Representative Variant 범위 + QA Baseline 정비

**상태**: 완료

이번 changeset에서 확정하는 결정:
- Phase 0의 QA gate는 `qa:gate:once` GREEN 복구를 기준으로 본다.
- representative test route anchor는 `tests/e2e/helpers/landing-fixture.ts`의 `PRIMARY_AVAILABLE_TEST_VARIANT`를 single source로 사용한다.
- theme-matrix / safari ghosting PNG baseline은 **로컬 QA 자산**이며 Git tracked completeness는 완료 조건이 아니다.
- manifest closure와 local baseline directory completeness는 유지해야 하지만, PNG를 저장소에 커밋하는 것은 필수 전제가 아니다.
- blocker traceability registry는 `1~30`까지 확장하되, 현재 구현 상태를 반영하기 위해 `automated_assertion` / `scenario_test` / `manual_checkpoint` 혼합 evidence를 허용한다.
- combined theme label은 메시지 JSON의 의도값인 `Language ⋅ Theme` 계열을 기준으로 유지한다.

검증 결과:
- `npm test` GREEN
- `npm run qa:static` GREEN
- `npm run qa:gate:once` GREEN

## Phase 0 상태 요약

- issue #1: traceability와 baseline 정책, gate 복구는 완료됐다.
- issue #2: canonical path split은 완료됐지만 clean-room replacement와 invalid-variant recoverable flow는 남아 있다.
- Phase 0 전체: ADR-B, ADR-E는 닫혔고 ADR-A의 clean-room 후속 결정만 남아 있다.
