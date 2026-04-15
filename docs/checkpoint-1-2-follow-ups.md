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

## 2. Theme Matrix / Safari Baseline 부재

### 현재 증상

- `node scripts/qa/check-phase11-telemetry-contracts.mjs`가 PNG baseline 부재로 실패한다.
- 확인된 범주:
  - theme-matrix PNG baseline 168개 부재
  - Safari ghosting PNG baseline 5개 부재

### Checkpoint 1·2와 분리하는 이유

- 이 항목은 visual asset closure 문제다.
- 현재 hardening 트랙은 runtime contract와 transition timing 안정화가 목적이며, baseline 생성/복구는 별도 screenshot session이 더 적합하다.

### 최소 재현 명령

```bash
node scripts/qa/check-phase11-telemetry-contracts.mjs
```

## 3. 운영 메모

- `Checkpoint 1·2` 트랙에서는 위 항목을 "새 회귀 없음" 기준으로만 감시한다.
- 다음 세션에서 이 문서를 시작점으로 삼아 `registry drift`와 `baseline closure`를 별도 작업으로 분리한다.
