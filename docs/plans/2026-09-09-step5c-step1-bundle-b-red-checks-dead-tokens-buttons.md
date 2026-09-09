# Step 5c · step 1 — 묶음 B: 빨간 검사 정리 · 죽은 토큰 제거 · 버튼 어휘 한 곳으로

**Date:** 2026-09-09 · **Task mode:** Implementation · **Branch:** `claude/step5c-bundle-b` · **Opens `src/**`:** yes · **Ask-First 파일:** `src/app/globals.css`(사용자가 2026-09-09 에 "공용 토큰을 최적의 구조로 수정하라"고 승인함 — 이 승인은 묶음 B 의 죽은 값 제거와 묶음 C 의 타입 역할 미러 둘 다에 걸친다)

---

## Shared frame — 이 문서 혼자 읽어도 되도록 반복한다

**Programme.** 2026-09-06 rebaseline(`BQ-38`)이 wave 13–17 을 대체한다. 저장소가 `docs/design/ds/` 아래 시각 정의를 소유하고 **VIVE Design System v2**(`cd630eec-25e4-4613-a58f-c671c80297ca`)로 단방향 push 한다. 절차와 함정: `docs/design/ds/SYNC.md`.

**우선순위, 사용자가 정한 순서.** **1 — 구현된 로직을 부작용 없이 보존한다. 2 — 디자인·상호작용 품질을 갈 수 있는 데까지 올린다.** 시각 개선이 동작을 위협하면 동작이 이기고 시각은 등재 후 유예한다.

**어디에 있나.** 4 단계 theme cut `986a956` → 5a 내비게이션 `970013b`·`941bdef` → 5b 테스트 플로우·보조 표면 `e97c279`·`cfab402` → **5c 묶음 A**(지시창을 dialog 로·a11y 코스·404 제목, 이 문서 직전에 착지) → **묶음 B, 이 문서** → 묶음 C(`-step2-`) → 6 단계 baseline.

**Hard stops.** `BQ-07` — 시각 baseline 을 재생성하지 않는다(6 단계, 사용자 승인). `.env`·비밀값은 읽지도 출력하지도 않는다. 워크트리 금지, 격리 작업공간은 `git clone`. `docs/design/ds/**` 은 Ask-First(편집이 저장소 밖으로 나간다). High-Risk 파일(`AGENTS.md` §4)은 위험 차원을 이름 붙이고 E2E 로 덮는다 — **이 묶음은 `use-landing-interaction-controller` 등 High-Risk 파일을 열지 않는다**; 열게 되면 멈추고 보고한다.

**묶음마다 따로 커밋하고, 커밋 전에 화면을 실제로 재서 값이 의도대로 나오는지 확인한다.** 선언을 읽는 것으로 대신하지 않는다(L06) — `getComputedStyle` 로 되읽고, 전이는 먼저 끈다(L09), 측정 도구는 답을 아는 사례로 먼저 반증한다(L08), 값이 안 먹으면 「어느 규칙이 이겼는지」를 묻는다(L10).

---

## 착수 전 확인

```bash
git log --oneline -1                                  # 5c 묶음 A 착지 커밋이 보여야 한다
grep -c 'role="dialog"' src/features/test/instruction-overlay.tsx   # expect 1 (묶음 A)
grep -c '@mirror-begin' src/app/globals.css           # expect 2 (4 단계)
npm test                                              # expect 583+ passing
echo "tracked=$(git ls-files 'tests/e2e/*-snapshots/*' | wc -l | tr -d ' ') disk=$(ls tests/e2e/*-snapshots/* | wc -l | tr -d ' ')"   # L11: 둘이 같아야 시각 스펙 결과가 의미를 갖는다
```

## 다시 하지 않는다

| 이미 끝난 것 | 어디 |
|:---|:---|
| 지시 overlay 의 dialog 의미론·Esc·포커스 트랩·복귀 | `src/features/test/instruction-overlay.tsx`, `tests/e2e/a11y-smoke.spec.ts` 마지막 3 케이스 |
| 404 두 장의 제목·본문·문서 제목 | `src/app/not-found.tsx`, `src/app/global-not-found.tsx` |
| 답변 행 표식을 라벨 뒤로 | `cfab402`, `08648e5` |
| 런타임 토큰 미러 + 파리티 가드 | `src/app/globals.css` §1, `tests/unit/design-tokens-dark-parity.test.ts` |

---

## 4. 빨간 검사 정리 — 사진 대조표(theme-matrix)는 6 단계로 남긴다

**무엇이 빨간가.** `main` 에서 6 건이 붉고 5b 이전부터 그랬다(5b 세션이 `b255006` 을 빌드해 같은 6 건이 붉은 것을 확인했다). 전부 **4 단계 theme cut 이전의 리터럴 값**을 그대로 요구한다.

| 스펙 | 요구하는 것 | 지금 제품 |
|:---|:---|:---|
| `tests/e2e/grid-smoke.spec.ts:592` R1 normal surface | 카드 부제 `rgb(74, 74, 85)`(legacy cool grey) 등 정확값 | `--ink-body` = `rgb(80, 74, 67)` |
| `grid-smoke.spec.ts:702` R1 expanded sub-surfaces | 확장 표면·선택 행·duration 강조의 legacy 값 | VIVE 토큰 |
| `grid-smoke.spec.ts:802` R1 mobile titles | 모바일 제목·맥락 타입의 legacy 값 | VIVE 토큰 |
| `grid-smoke.spec.ts:889` blog Read more | hover/focus 시 Read more 색·가시성의 legacy 값 | `--blog-read-more-ink` |
| `grid-smoke.spec.ts:990` W12 mobile computed visuals | 360/390/767 의 legacy 계산값 | VIVE 토큰 |
| `tests/e2e/state-smoke.spec.ts:246` root canvas | `body` 에 background **image**(radial wash)가 있을 것 | 4 단계가 wash 를 걷어냈다(`src/app/app-body-class.ts`) |

**무엇을 하나.** 검사를 약하게 만들지 않는다 — 이 검사들의 존재 이유는 「정확값을 못 박는 것」이고 그 값이 바뀐 것이지 못 박는 일이 틀린 게 아니다. 각 검사에서 **기대값을 legacy 리터럴에서 현행 설계의 값으로 옮긴다.** 값의 출처는 `docs/design/ds/colors_and_type.css`(C) 와 렌더된 제품(R)이고, 스펙 안에 어느 토큰에서 온 값인지 한 줄 적는다(`AGENTS.md` §3-1). `state-smoke:246` 은 「background image 가 있다」가 아니라 「`body` 가 `--canvas` 를 칠하고 오른쪽 거터를 예약하지 않는다」로 — 검사의 이름이 이미 그렇게 말한다.

**하지 않는 것.** `tests/e2e/theme-matrix-smoke.spec.ts` 의 48 baseline 은 전부 테스트 플로우이고 5b 가 그 세 표면을 다시 그렸으므로 48 건 전부 6 단계 재생성 대상이다. **`--update` 를 치지 않는다.** 실행조차 하지 않는다 — clone 에는 48 장만 있어 나머지 케이스가 생성돼 다음 실행부터 거짓 초록이 된다(L11).

**검증.** 6 건이 초록이 되고, `grid-smoke`·`state-smoke` 전체가 초록이며, 기대값을 바꾼 자리마다 그 값을 실제 렌더에서 `getComputedStyle` 로 되읽은 근거를 커밋 메시지에 적는다.

## 5. 죽은 값 제거 — 46 개

**census(2026-09-09, `src/**` + `public/theme-bootstrap.js` 전수, `var(--name` 소비 기준).** `src/app/globals.css` 가 선언하는 166 개 중 **46 개를 아무것도 읽지 않는다.**

미러 구간 안(설계 정의를 베낀 것, 30): `--surface --fg1 --fg2 --fg3 --fg4 --border --border-focus --accent-pressed --accent-subtle-2 --muted-soft --sage --shadow-hover --radius-2xs --radius-sm --radius-pill --ease-out --ease-in --dur-micro --dur-expand --dur-reduced --stagger-1 --stagger-2 --stagger-3 --stagger-exit-1 --stagger-exit-2 --stagger-exit-3 --container --thumb-ratio --card-pad --choice-pad --tag-pad --grid-gutter-mobile --grid-gutter-tablet --grid-gutter-desktop`

제품 계층(§2, 12): `--text-strong --surface-shadow --interactive-neutral-bg-soft --interactive-accent-bg --interactive-accent-bg-strong --interactive-accent-bg-hover --interactive-accent-bg-pressed --interactive-accent-border --interactive-accent-border-strong --interactive-accent-outline --interactive-accent-shadow --overlay-scrim-soft`(마지막은 `[data-theme='dark']` 재정의도 함께 지운다)

**규칙.** ⑴ 미러 구간에서 지우는 것은 허용된다 — `globals.css` §1 머리말이 "런타임이 실제로 소비하는 이름만 미러한다"고 적었고, 파리티 가드는 미러된 이름이 설계 정의와 같은 값인지만 본다(하한 light 80 · dark 30). 설계 정의(`docs/design/ds/**`)는 손대지 않는다. ⑵ 지우기 전에 census 를 **다시 돌려** 46 이 그대로인지 확인한다 — 묶음 A 이후 소비자가 바뀌었을 수 있다. ⑶ `--radius-pill`·`--container`·`--stagger-*` 처럼 곧 소비될 법한 이름이라도 지금 소비자가 없으면 지운다: 되살리는 것은 설계 정의에서 한 줄 다시 베끼는 일이고, 남겨 두는 것은 "죽은 채로 살아 있는 이름"을 하나 더 두는 일이다. 단 **묶음 C 가 곧 쓸 것**(타입 역할·tracking)은 지금 없으므로 이 목록과 겹치지 않는다. ⑷ 한 커밋에서 하고, 커밋 메시지에 46 개 이름을 전부 적는다.

**검증.** census 0 · `npm test`(파리티 가드) · 빌드 · 6 라우트 × 2 테마 대비 감사 0 실패 · 계산값 프로브(5b 의 `surface-probe`/`secondary-probe` 를 되살려 210 건) 불일치 0.

## 7. 버튼 어휘 한 곳으로

**지금.** 같은 `.vt-btn` 어휘가 세 곳에 따로 적혀 있다 — `src/features/test/surface-class-names.ts`(primary/secondary/quiet + 바탕), `src/features/landing/shell/consent-banner.tsx`(같은 셋을 `CONSENT_*` 로), `src/app/not-found.tsx`·`src/app/global-not-found.tsx`(primary 를 각각 한 벌). 5b 가 L10 을 밟은 자리(바탕의 `border-transparent`, `focus-visible:outline-none`)를 셋 다 같은 방식으로 피하고 있지만 그것은 우연히 같은 것이지 하나인 것이 아니다.

**어디로.** 소유권 표(`docs/agent-guides/project-rules.md` §Ownership)에 공용 UI 디렉터리가 없다. 새 디렉터리를 만드는 것은 구조 결정이므로 여기서 결정하고 등재한다: **`src/features/ui/button-class-names.ts`** 하나를 만들고, 소유권 표에 `src/features/ui/**` — 「기능 무관 공용 표면 어휘(버튼·패널·빈 상태). 컴포넌트가 아니라 클래스 문자열만 갖는다」 행을 추가한다. GNB 의 pill 계열(`site-gnb.tsx`)은 다른 컴포넌트(`.vt-pill`)이므로 옮기지 않는다.

**규칙.** 값은 하나도 바뀌지 않는다 — 이 항목은 구조 변경이고 동작 변경과 섞지 않는다. 옮기기 전과 후에 같은 프로브(버튼 6 종 × 2 테마: fill·edge·ink·min-height·radius·포커스 링)를 돌려 계산값이 byte 동일함을 보인다. `.vt-cta`(제출)는 primary 와 같은 처리이므로 별도 상수를 두지 않는다 — 5b 가 그렇게 결정했다.

**검증.** 프로브 전후 동일 · `npm test` · E2E consent/qualifier/a11y/routing.

---

## 순서와 커밋

1. **4** 를 먼저(빨간 검사가 초록이 돼야 5·7 의 회귀를 E2E 가 본다) — 커밋 1.
2. **5** — 커밋 2.
3. **7** — 커밋 3. 소유권 표 갱신은 같은 커밋.
4. 착지 절차는 전역 오케스트레이션(squash 한 커밋, 게이트, push, 브랜치 삭제). 착지 커밋에서 이 문서를 `docs/done/` 으로 옮기고 `docs/decision-register.md` 변경 이력에 한 줄 등재한다.

## Execution prompt

> Read `docs/plans/2026-09-09-step5c-step1-bundle-b-red-checks-dead-tokens-buttons.md` and `docs/LESSONS_LEARNED.md` L06–L13. Run the 착수 전 확인 block. Then do 4 → 5 → 7 as three gated commits, in that order, each with a rendered `getComputedStyle` read-back before committing. Never weaken a red check — move its expected values to the current design's values and cite the token. Never run `theme-matrix-smoke` and never pass `--update` (`BQ-07`, L11). `src/app/globals.css` is Ask-First and the user approved its edit on 2026-09-09; `docs/design/ds/**` stays untouched. Land as one squash, move this plan to `docs/done/`, register one row in `docs/decision-register.md`.
