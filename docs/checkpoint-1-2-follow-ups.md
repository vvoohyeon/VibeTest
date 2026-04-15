# Checkpoint 1·2 Follow-ups

> 마지막 갱신: 2026-04-16
> 목적: `Checkpoint 1` / `Checkpoint 2 착수 전 하드닝`과 직접 분리해 추적해야 하는 기존 실패 항목을 기록한다.

## 원칙

- 이 문서는 현재 Tailwind migration hardening과 직접 연결되지 않는 workspace-level 이슈만 다룬다.
- 아래 항목은 `Checkpoint 1·2 sign-off`를 위한 직접 수정 대상이 아니다.
- 다음 세션에서는 이 문서만 보고 별도 트랙으로 바로 재현·분리 진단할 수 있어야 한다.

## 1. Variant Registry Fixture Drift

### 현재 증상

- full `npm test`에서 아래 4건이 실패한다.
  - `tests/unit/landing-data-contract.test.ts`
  - `tests/unit/landing-question-bank.test.ts`
- 현재 관찰된 실패 내용:
  - `unavailableCount >= 2` 기대와 fixture 불일치
  - `qmbti` preview question expected string 불일치
  - QA catalog에서 `hidden-beta` 기대와 fixture/runtime 불일치
  - question bank `q1.prompt` expected string 불일치

### Checkpoint 1·2와 분리하는 이유

- 이 항목은 Tailwind shell/hero/consent hardening이 아니라 fixture source / registry contract / test expectation drift 문제다.
- UI migration을 계속 진행하면서 섞어 고치면 style 회귀와 data-contract 회귀의 원인이 섞인다.

### 최소 재현 명령

```bash
npm test -- tests/unit/landing-data-contract.test.ts tests/unit/landing-question-bank.test.ts
```

## 2. Theme Matrix / Safari Baseline Closure

### 해결 상태

- 2026-04-16 기준 `theme-matrix` PNG baseline 168개와 Safari ghosting PNG baseline 5개가 복구되었다.
- `PLAYWRIGHT_SERVER_MODE=preview npx playwright test tests/e2e/theme-matrix-smoke.spec.ts tests/e2e/safari-hover-ghosting.spec.ts`가 PASS한다.
- `node scripts/qa/check-phase11-telemetry-contracts.mjs`가 PASS한다.

### 기록 유지 이유

- 이 항목은 해결되었지만, 이후 fixture/runtime drift 또는 visual 변경으로 baseline 재생성이 다시 필요해질 수 있다.
- 따라서 해결 시점과 검증 명령만 남기고, 활성 follow-up 목록에서는 제외한다.

### 최소 재현 명령

```bash
node scripts/qa/check-phase11-telemetry-contracts.mjs
```

## 3. 운영 메모

- `Checkpoint 1·2` 트랙에서는 baseline closure를 solved 상태로 유지하고, 새 회귀 여부만 감시한다.
- 다음 세션에서는 이 문서를 시작점으로 삼아 `registry drift`를 별도 작업으로 분리한다.
