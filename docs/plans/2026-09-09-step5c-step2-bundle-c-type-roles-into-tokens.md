# Step 5c · step 2 — 묶음 C: 글자 크기를 이름으로 — 타입 역할을 공용 토큰에 싣고, 토큰 계층을 마지막으로 정리한다

**Date:** 2026-09-09 · **Task mode:** Implementation · **Branch:** `claude/step5c-bundle-c` · **Opens `src/**`:** yes · **Ask-First 파일:** `src/app/globals.css` — 사용자가 2026-09-09 에 승인했다: "공용 토큰을 이번이 마지막 기회라고 생각하고 최적의 구조와 값/토큰으로 수정해 달라." 이 문장이 이 문서의 권한이다.

---

## Shared frame — 이 문서 혼자 읽어도 되도록 반복한다

**Programme.** 2026-09-06 rebaseline(`BQ-38`)이 wave 13–17 을 대체한다. 저장소가 `docs/design/ds/` 아래 시각 정의를 소유하고 **VIVE Design System v2**(`cd630eec-25e4-4613-a58f-c671c80297ca`)로 단방향 push 한다. 절차와 함정: `docs/design/ds/SYNC.md`.

**우선순위, 사용자가 정한 순서.** **1 — 구현된 로직을 부작용 없이 보존한다. 2 — 디자인·상호작용 품질을 갈 수 있는 데까지 올린다.**

**어디에 있나.** 4 단계 theme cut `986a956` → 5a → 5b → 5c 묶음 A(dialog·a11y·404) → 묶음 B(`-step1-`: 빨간 검사·죽은 값 46·버튼 어휘) → **묶음 C, 이 문서** → 6 단계 baseline.

**Hard stops.** `BQ-07` — 시각 baseline 재생성 금지(6 단계). `.env`·비밀값 금지. 워크트리 금지, clone 만. `docs/design/ds/**` 은 Ask-First — **이 묶음은 설계 정의에서 값을 베껴 오기만 하고 설계 정의를 고치지 않는다.** 미러 구간(`@mirror-begin`/`@mirror-end`) 안의 값을 손으로 고치면 `tests/unit/design-tokens-dark-parity.test.ts` 가 빌드를 멈춘다 — 그것이 의도다.

**커밋 전에 화면을 실제로 잰다.** `font: var(--h3)` 를 적는 것과 그 원소가 20px/600/1.3 으로 계산되는 것은 다른 일이다(L06). `font` shorthand 는 `font-family`·`line-height`·`font-variant` 를 함께 리셋하므로, 되읽을 때 `font-size`·`font-weight`·`line-height`·`font-family` 넷을 함께 본다.

---

## 착수 전 확인

```bash
git log --oneline -3                                        # 묶음 B 착지 커밋이 보여야 한다
ls docs/done/2026-09-09-step5c-step1-bundle-b-red-checks-dead-tokens-buttons.md   # expect present (묶음 B 가 착지하며 옮긴다)
ls src/features/ui/button-class-names.ts                    # expect present (묶음 B 의 7)
grep -c '@mirror-begin' src/app/globals.css                 # expect 2
npm test                                                    # expect 583+ passing
echo "tracked=$(git ls-files 'tests/e2e/*-snapshots/*' | wc -l | tr -d ' ') disk=$(ls tests/e2e/*-snapshots/* | wc -l | tr -d ' ')"   # L11
```

묶음 B 가 아직 착지하지 않았다면 **멈추고 보고한다** — 죽은 값 46 개를 지운 뒤의 계층 위에서만 이 정리가 의미를 갖는다.

## 다시 하지 않는다

| 이미 끝난 것 | 어디 |
|:---|:---|
| 죽은 토큰 46 제거 · 버튼 어휘 한 곳 | 묶음 B |
| 색·면·선·그림자·반경·모션 토큰의 미러 | `globals.css` §1 (4 단계) |
| `--muted-ink → --ink-body` 등 제품 계층의 역할 매핑 근거 | `globals.css` §2 주석 (4 단계) |

---

## 6. 타입 역할을 이름으로

**지금.** 런타임 토큰 계층은 "제품이 실제로 소비하는 이름만" 미러하고, 4 단계 시점에 타입 역할을 소비하는 곳이 없었으므로 **타입 역할이 하나도 미러돼 있지 않다.** 그래서 5a·5b 는 글자 크기를 리터럴로 적었다 — `text-[20px] font-semibold leading-[1.3]`(= `--h3`), `text-[14px] leading-[1.55]`(= `--body-sm`), `text-[13px] leading-[1.45]`(= `--caption`), `text-[12px] font-semibold tracking-[0.08em]`(= `--overline`), `text-[15px] font-semibold leading-none tracking-[-0.01em]`(= `--button` + `--track-tight`), `text-[30px] font-bold leading-[1.2]`(= `--h1`), `text-[16px] leading-[1.6]`(= `--body`), `text-[21px] font-semibold leading-[1.3]`(= `--t-expanded-question`), `text-[15px] font-normal leading-[1.45]`(= `--t-choice`), 그리고 5a 의 `text-[0.96rem]`·`text-base font-bold`·`text-[0.88rem]`. 같은 크기가 파일마다 다시 적혀 있고, 이름이 없으니 어느 역할인지는 주석이 말한다.

**무엇을 하나.** ⑴ `docs/design/ds/colors_and_type.css` 의 `:root` 에서 타입 역할을 **한 글자도 고치지 않고** `globals.css` 의 `/* @mirror-begin light */` 구간 안으로 베껴 온다: `--h1 --h2 --h3 --h4 --body-lg --body --body-sm --label --caption --overline --button`(11)과 `--track-display --track-tight --track-over`(3), 그리고 카탈로그 타입 `--t-card-title --t-expanded-question --t-choice`(설계 정의 §3 카탈로그 별칭에 있는 것만). `--display-*` 셋과 `--code`(`--font-mono` 를 가리키며 그 폰트는 미러되지 않았다)는 실현되지 않았으므로 베끼지 않는다. 파리티 가드가 값을 대조한다. ⑵ 소비자를 옮긴다 — 리터럴 크기 묶음을 `[font:var(--h3)]` 같은 arbitrary property 하나로 바꾼다. `[font:inherit]` 를 이미 쓰는 자리가 있으니 문법은 검증돼 있다. 대상 파일: `src/features/test/surface-class-names.ts`, `src/features/test/test-question-client.tsx`, `src/features/blog/blog-destination-client.tsx`, `src/features/landing/shell/consent-banner.tsx`, `src/app/[locale]/history/page.tsx`, `src/app/[locale]/test/error/page.tsx`, `src/app/not-found.tsx`, `src/app/global-not-found.tsx`, `src/features/ui/button-class-names.ts`(묶음 B 산출), `src/features/gnb/site-gnb.tsx`(High-Risk — 아래 참조), `src/features/landing/grid/landing-grid-card.tsx`(카탈로그 타입 셋). ⑶ 옮기고 나서 `text-\[[0-9.]+(px|rem)\]` 를 `src/` 전체에서 grep 해 남은 것을 전부 열거하고, 각각 「역할이 없는 값」인지 「옮기지 않은 실수」인지 판정을 적는다.

**High-Risk 경계.** `site-gnb.tsx` 는 High-Risk 파일이다. 여기서는 **값이 바뀌지 않는 치환만** 한다 — `text-base font-bold`(16px/700) 는 `--h4`(18px/600)와 다르므로 옮기지 않고 리터럴로 남긴다; `text-[0.96rem]`(15.36px)도 어느 역할도 아니다. 즉 GNB 는 이 묶음에서 사실상 건드리지 않고, 「GNB 타입이 역할 밖에 있다」를 발견으로 보고한다. 값이 같은 치환이 하나라도 있으면 그 파일에 대해 위험 차원 다섯(usability·a11y·responsiveness·performance·design-system consistency)을 커밋에 적고 `gnb-smoke`·`a11y-smoke`·`state-smoke` 를 돌린다.

**`font` shorthand 의 함정 두 가지.** ⑴ `font: var(--h3)` 는 `line-height` 를 포함하므로 같은 원소에 `leading-*` 가 남아 있으면 둘이 같은 속성을 정한다 — emit 순서가 승자를 정한다(L10). 옮길 때 `text-*`·`font-*`·`leading-*` 를 **전부** 걷어낸다. ⑵ `letter-spacing` 은 shorthand 에 없다 — `tracking-[…]` 은 `[letter-spacing:var(--track-tight)]` 로 따로 옮긴다.

## 토큰 계층의 마지막 정리 — "최적의 구조"

사용자의 문장은 값을 베끼는 것 이상을 말한다. 묶음 B 가 죽은 46 개를 지운 뒤 제품 계층(§2)에 남는 것은 두 부류다. 이 묶음이 그 둘을 가른다.

| 부류 | 예 | 처분 |
|:---|:---|:---|
| **순수 개명** — VIVE 역할 하나를 다른 이름으로 부를 뿐 | `--panel-solid → --canvas-elevated`, `--surface-divider → --hairline`, `--muted-ink → --ink-body`, `--link-ink → --ink`, `--bg → --canvas`, `--card-shadow → --shadow-rest`, `--dialog-shadow / --panel-shadow / --sheet-shadow → --shadow-overlay`, `--chip-bg / --chip-border`, `--interactive-neutral-*`, `--interactive-disabled-*` | 소비자를 VIVE 이름으로 옮기고 별칭을 지운다. 4 단계가 "이름은 이 커밋에서 바꾸지 않는다"고 한 이유는 diff 를 읽을 수 있게 하려는 것이었고, 그 커밋은 끝났다 |
| **제품 의미가 있는 역할** — VIVE 에 대응물이 없거나 값이 다르다 | `--gnb-surface`(반투명 바), `--focus-ring-inner / -outer`(2 층 링), `--overlay-scrim-soft / -medium / -strong`(세기 셋), `--theme-preview-*`(테마의 그림, 의도적으로 테마 무관), `--landing-answer-*`(이름이 틀린 GNB 칩 hover — 개명은 High-Risk 밖 파일 `settings-controls.tsx` 소비자라 여기서 `--gnb-chip-hover-*` 로 바로잡는다) | 남긴다. 각각 왜 남는지 한 줄 주석이 이미 있거나 이 묶음이 적는다 |

**규칙.** ⑴ 한 번에 한 별칭씩: 소비자 전부를 grep 으로 열거 → 치환 → 별칭 삭제 → 프로브. 별칭을 먼저 지우면 소비자는 조용히 값을 잃는다(커스텀 프로퍼티는 오류를 내지 않는다). ⑵ 이 정리는 **값을 하나도 바꾸지 않는다** — 프로브가 전후 byte 동일을 보여야 한다. 값이 바뀌어야 옳은 자리를 발견하면 그것은 이 묶음이 아니라 등재(`decision-register.md`) 대상이다. ⑶ `globals.css` §2 의 머리말("이름은 바꾸지 않는다, 119 개 참조")을 이 묶음이 한 일에 맞게 다시 쓴다 — 그 문장은 4 단계의 사실이지 계약이 아니다.

## 검증

```bash
npm run lint && npm run typecheck && npm test && npm run build
node <프로브>      # 5b 의 surface-probe / secondary-probe 를 되살려 210 건 + 타입 역할 되읽기(size·weight·line-height·family 넷)
node <대비 감사>   # 12 케이스 × 2 테마, AA 실패 0 — 도구는 답을 아는 7 사례로 먼저 반증
npx playwright test tests/e2e/consent-smoke.spec.ts tests/e2e/qualifier-overlay.spec.ts tests/e2e/routing-smoke.spec.ts tests/e2e/a11y-smoke.spec.ts tests/e2e/grid-smoke.spec.ts tests/e2e/state-smoke.spec.ts
```

`theme-matrix-smoke` 는 돌리지 않는다(`BQ-07`, L11). 이 묶음이 끝나면 6 단계가 48 장을 한 번에 재생성한다.

## 커밋과 착지

1. 커밋 1 — 타입 역할 미러 + 소비자 치환(값 불변, 프로브 동일).
2. 커밋 2 — 별칭 정리(값 불변, 프로브 동일) + `globals.css` §2 머리말 갱신.
3. squash 한 커밋으로 착지, 이 문서를 `docs/done/` 으로, `decision-register.md` 변경 이력 한 줄. `docs/design/ds/colors_and_type.css` 의 `[not realized]` 주석 중 이 묶음이 실현한 것(`--container-narrow` 는 5b 가 이미 실현)은 **고치지 않고 목록으로 보고한다** — ds/ 는 Ask-First 다.

## Execution prompt

> Read `docs/plans/2026-09-09-step5c-step2-bundle-c-type-roles-into-tokens.md` and `docs/LESSONS_LEARNED.md` L06–L13. Run the 착수 전 확인 block and stop if bundle B has not landed. Mirror the type roles from `docs/design/ds/colors_and_type.css` into the `@mirror-begin light` region of `src/app/globals.css` verbatim (the user approved this Ask-First edit on 2026-09-09), move every literal size cluster to `[font:var(--role)]`, then retire the pure-rename aliases in §2 one at a time with a probe proving byte-identical computed values before and after. Values never change in this bundle; a value that should change is a register entry, not an edit. Do not touch `docs/design/ds/**`. Never run `theme-matrix-smoke`. Land as one squash, move this plan to `docs/done/`, register one row in `docs/decision-register.md`.
