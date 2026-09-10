# UX 리팩터 · step 2 — 배너 겹침 · reduced-motion · spacer 과다 · 포커스 링 지면색

**Date:** 2026-09-10 · **Task mode:** Implementation · **Branch:** `claude/scroll-hold-and-contract-tiers` (step 1 과 같은 브랜치를 이어 쓴다) · **Wave:** rebaseline 프로그램 밖 · **Opens `src/**`:** yes

**High-Risk 파일 — 조건부.** R2 를 후보 ⑶(확장 기하가 배너를 피하도록 여유 확보)으로 고르면 `landing-grid-card.module.css` 의 확장 기하를 열게 되고, 그 순간 `req-landing §8.3` 의 「Expanded→Normal 높이 non-increasing · 완료 시 `0px` 복귀」와 §14.2 항목 4 의 「same-row 비대상 카드 top/bottom/outer height 오차 `0px`」가 걸린다. **⑶ 을 고르는 순간 이 계획은 High-Risk 작업이 되며, 위험 다섯 차원을 커밋에 적고 `grid-smoke`·`state-smoke` 전체를 돌린다.** ⑴·⑵ 는 배너 레이어만 건드리므로 High-Risk 가 아니다.

**Ask-First 파일:** `src/app/globals.css`(R5 가 `--focus-ring-inner` 를 건드린다면). `docs/design/ds/**` 은 열지 않는다.

---

## Shared frame — 이 문서 혼자 읽어도 되도록 반복한다

**운영 방침 변경(2026-09-10).** 트랜지션·마이크로인터랙션·UX 판단에서 SSOT 정의서보다 구현자의 판단을 우선하되, 더 나은 대안은 반드시 결정 안건으로 올린다.

**step 1 이 먼저다.** step 1(`-step1-`)이 §8 을 계약과 조정값으로 가르지 않으면 R3 의 reduced-motion 개정이 §8.3 의 stagger 고정과 부딪힌다. **step 1 이 착지했는지 먼저 확인한다.**

**Hard stops.** `BQ-07` 시각 baseline 재생성 금지 · `theme-matrix-smoke` 실행 금지 · `--update` 금지. 워크트리 금지, clone 만.

## 착수 전 확인

```bash
git log --oneline -3                                                     # step 1 착지 커밋이 보여야 한다
ls docs/done/2026-09-10-ux-refactor-step1-scroll-hold-and-contract-tiers.md   # expect present
grep -c '조정값' docs/req-landing.md                                       # expect >0 (R7 이 들어갔다)
npm test                                                                 # expect 초록
echo "tracked=$(git ls-files 'tests/e2e/*-snapshots/*' | wc -l | tr -d ' ') disk=$(ls tests/e2e/*-snapshots/* | wc -l | tr -d ' ')"   # L11
```

---

## R2 — 동의 배너가 확장 카드를 가린다 · 이 묶음의 1 순위

**실측 (1280×720, consent UNKNOWN).** 하단 행 카드를 확장하면 카드 `[469, 721]`, 배너 `[624, 704]` → **세로 겹침 80px**. 배너는 `z-[1075]` 고정 레이어라 카드 위에 그려진다. **첫 방문자에게만** 생기고, 하필 그들이 처음 만지는 카드를 덮는다. spacer 는 문서 *끝*을 밀어줄 뿐 화면 중간의 고정 배너 겹침을 막지 못한다.

**후보 셋 — 착수 시 실측으로 고른다.** ⑴ 확장 중 배너를 낮춘다(z 를 카드 아래로) — 배너가 카드에 가려지므로 동의 요청이 묻힌다. ⑵ 확장 중 배너를 접거나 반투명으로 — 동의 UI 를 흐리는 것은 프라이버시 표면에서 조심스럽다. ⑶ **확장 오버레이의 하단 여유를 배너 높이만큼 확보** — 확장 기하가 배너를 피해 열린다. ⑶ 이 가장 정직하지만 확장 기하를 건드리므로 §8.3 의 「완료 시 `0px` 복귀」와 same-row 계약을 함께 재야 한다. **선택 근거를 커밋에 적는다.**

## R3 — reduced-motion 이 모션을 줄이기만 하고 없애지 않는다

**실측.** `landing-grid-card.module.css:565` 의 reduced-motion 블록이 하는 일은 둘뿐이다 — `--landing-card-shell-scale: 1`, `--landing-card-motion-ms: 180ms`(280 → 180 실측 확인). 그런데 `detail-rise`(`translateY(4px) → 0`)가 **40/100/160ms stagger 로 그대로 돌아** 총 340ms 짜리 단계 노출이 남는다. reduced-motion 의 취지는 「짧게」가 아니라 「움직임을 없애기」다. 버튼 쪽은 이미 `motion-reduce:transition-none` 을 쓰고 있으니 이 파일만 규율 밖이다.

**무엇을 하나.** reduced-motion 에서 stagger 를 `0ms` 로, `detail-rise` 를 translate 없는 opacity 전용으로. 단계 노출의 *순서*(DOM 순서 일치)는 계약이므로 유지하되 지연을 없앤다. **§8.3 의 stagger 값은 step 1 이 조정값으로 강등했으므로** 이 변경은 계약 위반이 아니다.

## R4 — 배너 spacer 24px 과다 예약

**실측.** `DEFAULT_BANNER_HEIGHT_PX = 120` 이 `Math.max` 의 **하한**이라 실측 배너 높이 80px 이어도 절대 줄지 않는다. 실제 필요는 배너 80 + `bottom:16` = **96px** → 24px 과다. 그 24px 이 문서 여유(UNKNOWN 에서 327px)를 키워 step 1 이 다루는 스크롤 조건을 넓힌다.

**무엇을 하나.** 120 을 하한이 아니라 **SSR/최초 렌더 추정값**으로만 쓰고, 마운트 뒤에는 실측 높이 + 하단 gap 을 그대로 반영한다. 마운트 시 spacer 가 줄면서 생기는 레이아웃 이동을 재고, 눈에 띄면 `min-height` 대신 첫 프레임 값을 서버에서 고정하는 쪽을 검토한다.

## R5 — 포커스 링 안쪽 층이 실제 뒷배경과 다르다

**실측.** GNB 설정 트리거에 포커스를 주면 요소 뒤 배경은 `rgb(236, 232, 223)` 인데 링 안쪽 층은 `rgb(251, 250, 247)`(`--focus-ring-inner` = `--canvas`)이다. 흰 카드(`--canvas-elevated #fff`) 위에서도 마찬가지라, 투명한 틈이 아니라 옅은 크림색 테가 하나 더 보인다. `globals.css` §2 주석이 적은 설계 의도는 「안쪽 층은 OFFSET 이므로 **지면**을 취한다」인데, 실현은 *페이지* 지면을 취하고 *요소의* 지면을 취하지 않는다.

**무엇을 하나.** 두 갈래를 재고 고른다. ⑴ `--focus-ring-inner` 를 표면별로 재선언(카드·패널은 `--canvas-elevated`) — 정확하지만 선언이 늘어난다. ⑵ 안쪽 층을 색이 아니라 진짜 틈으로 — `box-shadow` 대신 `outline` + `outline-offset`. ⑵ 가 구조적으로 옳고 선언도 줄지만 두 층 링을 쓰는 모든 자리를 함께 옮겨야 한다(`button-class-names.ts` 가 이미 한 곳에 모아 두었다). **`globals.css` 를 여는 경우 Ask-First 이므로 착수 전에 사용자에게 확인한다.**

---

## 바꾸는 파일

| 파일 | 항목 |
|:---|:---|
| `src/features/landing/shell/consent-banner.tsx` | R2 · R4 |
| `src/features/landing/grid/landing-grid-card.module.css` | R3 (그리고 R2 를 ⑶ 으로 고르면 확장 기하) |
| `src/features/ui/button-class-names.ts` · `src/app/globals.css`(Ask-First) | R5 |
| `tests/unit/**` | 넷 각각의 회귀 검사 |
| `docs/req-landing.md` · `docs/decision-register.md` | R2·R3 이 계약을 건드리면 |

## 회귀 검사

| 항목 | 무엇을 고정하나 | 어디 |
|:---|:---|:---|
| R2 | 1280×720 · consent UNKNOWN · 하단 행 확장에서 배너와 카드의 세로 겹침 `0px` | E2E(`consent-smoke` 또는 `grid-smoke`) |
| R3 | reduced-motion 에서 stagger 지연 `0ms` · 상세 블록 transform 없음 | 단위(계산 스타일) 또는 E2E `reducedMotion: 'reduce'` |
| R4 | spacer 높이 == 배너 실측 높이 + 하단 gap | 단위 또는 E2E |
| R5 | 포커스된 요소의 링 안쪽 색 == 그 요소 뒤 실제 배경 | E2E(`a11y-smoke`) |

넷 다 **고장 주입으로 발화를 확인한다.**

## Impact assessment

- **shared shell / GNB** — R5 가 GNB 컨트롤의 링을 건드린다. `gnb-smoke` · `a11y-smoke` 를 돌린다.
- **localization** — 무관.
- **a11y** — R3(reduced-motion) · R5(포커스 가시성) 둘 다 a11y 개선이다. axe 검사를 포함한다.
- **state contracts** — 무변경.
- **core user flow** — R2 가 첫 방문자의 첫 상호작용을 직접 개선한다.

## 검증 명령

```bash
npm run lint && npm run typecheck && npm test && npm run build
PLAYWRIGHT_SERVER_MODE=preview npx playwright test --project=chromium --workers=1 tests/e2e/a11y-smoke.spec.ts tests/e2e/consent-smoke.spec.ts tests/e2e/gnb-smoke.spec.ts tests/e2e/grid-smoke.spec.ts tests/e2e/state-smoke.spec.ts
node output/probe/ux-audit3.mjs && node output/probe/ux-audit4.mjs   # 배너 겹침 · spacer · 링 재측정

# L11 — E2E 실행 뒤 생성된 baseline 을 지워 추적 수와 디스크 수를 맞춘다
echo "tracked=$(git ls-files 'tests/e2e/*-snapshots/*' | wc -l | tr -d ' ') disk=$(ls tests/e2e/*-snapshots/* | wc -l | tr -d ' ')"
```

`theme-matrix-smoke` 는 돌리지 않고 `--update` 도 치지 않는다(`BQ-07`, `L11`). 추적 baseline 에 프로젝트 세그먼트가 없는 두 장은 **비교가 아니라 생성**되므로, 매 E2E 실행 뒤 생성분을 지우고 두 수가 같은지 확인한다.

## 인수 조건

1. 넷 각각의 회귀 검사가 수정 전 붉고 수정 후 초록(고장 주입 양방향).
2. 배너·카드 세로 겹침 `0px`(수정 전 80px).
3. reduced-motion 에서 상세 블록 transform 없음 · stagger `0ms`(수정 전 translateY(4px) · 40/100/160ms).
4. spacer 과다 `0px`(수정 전 24px).
5. 포커스 링 안쪽 색 == 실제 뒷배경(수정 전 불일치).
6. 기본 게이트 초록 + chromium E2E(theme-matrix 제외) 초록. **R3·R5 를 뺀 나머지 표면의 계산값 지문 불일치 0.**

## 사용자 확인이 필요한 결정

1. **R2 의 처분** — 후보 ⑴/⑵/⑶ 중 무엇. 착수 시 실측을 붙여 다시 제시한다.
2. **R5 가 `globals.css` 를 여는지** — 갈래 ⑴ 은 연다(Ask-First). 갈래 ⑵ 는 열지 않는다.

## Execution prompt

> Read this document, confirm step 1 has landed via the 착수 전 확인 block, then take R2 → R3 → R4 → R5 in that order, each as its own commit with a failing regression written first. R2 and R5 carry a choice — measure the candidates and put the decision to the user before implementing, with numbers. Do not open `docs/design/ds/**`. Never run `theme-matrix-smoke`. Land as one squash, move this plan to `docs/done/`, add one 변경 이력 row.
