/**
 * 테스트 플로우 표면의 클래스 어휘.
 *
 * `docs/design/ds/app-components.css` 의 `.vt-panel` / `.vt-floating` / `.vt-well` /
 * `.vt-btn*` / `.vt-progress*` / `.vt-datarow*` 과 `catalog-components.css` 의
 * `.vt-choice--answer` 를 제품 클래스로 옮긴 것이다. 명세 스타일시트는 import 하지 않고
 * 규칙만 읽어 다시 썼다 — `tests/unit/design-ds-boundary.test.ts` 가 그 경계를 집행한다.
 *
 * **세 표면의 차이는 무엇 위에 놓이는가이지 얼마나 중요한가가 아니다.** 패널은 페이지 위에,
 * floating 은 페이지 **위로**, well 은 패널 **안에** 놓인다. 종전 제품은 셋을 구분하지 않고
 * 하나의 미작성 처리(`rounded-[18px]` + 94% 반투명 + `--dialog-shadow` + 테두리 없음)를
 * 복사로 반복했다. VIVE 는 그 반대를 말한다(`design.md` §4.7): 불투명한 면, 1px hairline,
 * 속삭이는 그림자.
 *
 * 여기 한 파일에 모은 이유는 같은 어휘를 `instruction-overlay.tsx` ·
 * `test-question-client.tsx` · `test-result-panel.tsx` 셋이 함께 쓰기 때문이다. 종전에는 셋이
 * 각자 같은 긴 문자열을 따로 갖고 있었고, 그 사본들은 이미 서로 조금씩 달랐다.
 *
 * **다크 분기는 없다.** 모든 표면이 semantic 계층을 통해 해석되므로 `[data-theme]` 분기가
 * 필요하다면 그건 테마가 아니라 집어 든 토큰이 틀린 것이다. 유일한 예외는 floating 인데,
 * 그것도 분기가 아니라 `--border-strong` 한 선언이 라이트에서 hairline · 다크에서 보이는
 * 모서리로 해석되면서 흡수한다 — 다크에서 scrim 은 바닥을 1.04:1 밖에 어둡게 못 한다.
 */

/** 포커스 링. 명세(`.vt-btn:focus-visible`)의 outline + offset 형태다. 종전 제품의 2 층
 *  box-shadow 링은 안쪽 층이 `--canvas` 를 칠하는데, `--surface-raised` 위에 뜬 다이얼로그
 *  에서는 그 바닥색이 표면색과 달라 어두운 후광으로 보인다. outline 은 실제 뒷면을 그대로
 *  둔다. 랜딩 카드의 답변 행(`landing-grid-card.tsx`)이 이미 쓰는 형태이기도 하다. */
/** `focus-visible:outline-none` 을 함께 쓰지 않는다. 둘 다 `outline` 계열이라 명시도가 같고,
 *  Tailwind 가 `outline-none`(= `outline-style: none`)을 뒤에 내보내면 링은 색과 offset 만
 *  남고 **두께가 0 으로 계산된다** — 실측 `0px none`, 즉 링이 아예 그려지지 않았다. 랜딩 카드의
 *  답변 행도 같은 이유로 shorthand 만 쓴다. */
const focusRingClassName =
  'focus-visible:[outline:2px_solid_var(--focus-ring)] focus-visible:[outline-offset:2px]';

const skinTransitionClassName =
  '[transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-standard)] motion-reduce:transition-none';

/** `.vt-panel` — 페이지 위에 놓이는 면. */
export const testPanelClassName =
  'rounded-[var(--radius-lg)] border border-[var(--surface-divider)] bg-[var(--panel-solid)] p-5 shadow-[var(--card-shadow)]';

/** `.vt-floating` — 페이지 위로 뜨는 면(다이얼로그·메뉴·팝오버). */
export const testFloatingClassName =
  'rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-raised)] shadow-[var(--dialog-shadow)]';

/** `.vt-well` — 패널 안에 잠기는 면. */
export const testWellClassName =
  'rounded-[var(--radius-md)] border border-[var(--surface-divider)] bg-[var(--surface-sunken)] shadow-none';

/** `.vt-scrim`. */
export const testScrimClassName = 'bg-[var(--overlay-scrim-medium)]';

/**
 * `.vt-btn` — 하나의 바탕과 세 가지 의도.
 *
 * `min-height: 46px` 는 실현값 그대로 둔다. 4px 그리드에서 벗어나 있지만 `design.md` §4.10 의
 * 44px 바닥을 이미 넘고, 실제 규칙을 만족하는 실제 값은 토큰에 맞춰 반올림할 이유가 없다.
 * radius 만 ramp 밖의 14px 에서 `--radius-md`(12) 로 옮긴다.
 *
 * **바탕은 border-color 를 정하지 않는다.** 한 원소 위에서 같은 속성을 두 유틸리티가 정하면
 * 명시도가 같아 Tailwind 의 emit 순서가 승자를 정한다(L10). 바탕에 `border-transparent` 를
 * 두었을 때 실측: 세 변종이 각자 적은 `border-[var(…)]` 가 **전부 졌고** 모든 버튼의 테두리가
 * 투명이었다 — 규칙은 만들어졌고 조용히 진 것이다. 그래서 색은 변종만 정한다.
 */
const buttonBaseClassName =
  `inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border px-4 py-3 text-center text-[15px] font-semibold leading-none tracking-[-0.01em] no-underline [transition-property:background-color,border-color,box-shadow,color,transform] ${skinTransitionClassName} disabled:!cursor-not-allowed disabled:!border-[var(--interactive-disabled-border)] disabled:!bg-[var(--interactive-disabled-bg)] disabled:!text-[var(--interactive-disabled-ink)] disabled:!opacity-100 disabled:!shadow-none disabled:!translate-y-0 disabled:hover:!border-[var(--interactive-disabled-border)] disabled:hover:!bg-[var(--interactive-disabled-bg)] disabled:hover:!text-[var(--interactive-disabled-ink)] disabled:hover:!shadow-none disabled:hover:!translate-y-0 ${focusRingClassName}`;

/**
 * 채워진 accent. **`--accent` 가 아니라 `--accent-solid` 를 읽는다**(D-12): accent 는 선이나
 * 링일 때 3:1 이면 되고 3.75 로 넘지만, 제 라벨 아래 깔린 **면**일 때는 그 라벨에 대해 4.5:1 이
 * 필요하고 흰 라벨이 3.75 다. 라벨을 어둡게 뒤집어도 해결되지 않는다 — 쉴 때 4.61 에서
 * 눌릴수록 3.39 · 2.44 로 *내려간다*. 면을 한 단 깊게 하면 흰 라벨을 유지한 채 5.09 → 7.09 →
 * 9.76 으로 올라간다.
 *
 * lift 는 1px, primary 에만. `design.md` §4.8 은 bounce 와 overshoot 를 금지하고, 140ms ease
 * 아래의 1px 이동이 제스처의 전부다.
 */
export const testPrimaryButtonClassName =
  `${buttonBaseClassName} border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--fg-on-accent)] hover:border-[var(--accent-solid-hover)] hover:bg-[var(--accent-solid-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:border-[var(--accent-solid-pressed)] active:bg-[var(--accent-solid-pressed)] active:translate-y-0 active:shadow-none motion-reduce:hover:translate-y-0`;

export const testSecondaryButtonClassName =
  `${buttonBaseClassName} border-[var(--hairline-strong)] bg-[var(--panel-solid)] text-[var(--ink-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] active:bg-[var(--surface-strong)]`;

/**
 * Quiet — 제품이 필요로 하면서 이름을 준 적 없는 세 번째 무게. 「동의하지 않고 시작」·「취소」
 * 처럼 경쟁하면 안 되는 행동이다. 종전에는 이것이 「이전」과 똑같은 중립 채움으로 그려져
 * 동의 거부와 문항 이동이 같은 시각 무게를 가졌다.
 */
export const testQuietButtonClassName =
  `${buttonBaseClassName} min-h-[var(--tap-min)] border-[transparent] bg-transparent px-3 py-[10px] text-[var(--muted-aa)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-body)]`;

/**
 * `.vt-choice--answer` — 카탈로그의 선택 행에 화살표 대신 라디오 표식을 단 변종.
 *
 * 테스트 플로우는 확장된 카탈로그 카드가 미리 보여 주는 것과 같은 질문을 묻는다. 그래서 둘은
 * 같은 컨트롤로 읽혀야 한다 — 각오하고 누르는 결정이 아니라 가볍게 반복하는 답. 종전 제품의
 * 답변 버튼은 `font-semibold` 의 채워진 중립 칩이었고, 고르면 accent 채움 + inset 링 +
 * 그림자로 옮겨 갔다. 그것은 제출 버튼과 같은 처리이고, 한 회차에 열두 번 하는 행동에는
 * 과한 무게다. 흰 면과 400 굵기를 유지하고 상태는 모서리가 진다.
 *
 * 화살표가 없는 이유: 카탈로그에서 `→` 는 「이것이 테스트로 데려간다」는 뜻인데, 테스트 안에서
 * 답하는 것은 아무 데도 데려가지 않는다.
 *
 * **표식은 라벨 뒤(trailing slot)에 온다.** 카탈로그 선택 행에서 화살표가 있던 자리이고,
 * 명세가 「그 자리는 무언가 골라질 때까지 비어 있다」고 적은 자리다. 표본 둘이 서로 어긋나
 * 있다 — `preview/comp-answer-button.html`(컴포넌트 정의)은 뒤, `preview/test-flow.html`
 * (구성 표본)은 앞. 컴포넌트 정의와 명세 산문이 일치하는 쪽을 따른다.
 */
export const testAnswerChoiceClassName =
  `group/answer flex w-full cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--hairline-strong)] bg-[var(--panel-solid)] px-3.5 py-3 text-left [transition-property:border-color,background-color] ${skinTransitionClassName} hover:border-[var(--accent)] hover:bg-[var(--sage-muted)] data-[selected=true]:border-[var(--accent)] data-[selected=true]:bg-[var(--sage-muted)] disabled:cursor-default ${focusRingClassName}`;

export const testAnswerChoiceMarkClassName =
  `mt-1 h-3.5 w-3.5 flex-none rounded-full bg-transparent shadow-[inset_0_0_0_1px_var(--hairline-strong)] [transition-property:background-color,box-shadow] ${skinTransitionClassName} group-data-[selected=true]/answer:bg-[var(--accent)] group-data-[selected=true]/answer:shadow-[inset_0_0_0_1px_var(--accent)]`;

export const testAnswerChoiceTextClassName =
  'min-w-0 flex-1 text-[15px] font-normal leading-[1.45] text-[var(--ink-soft)] [word-break:keep-all] [overflow-wrap:anywhere]';

/** `.vt-chip` — 자격 문항 재진입 칩. */
export const testChipClassName =
  `inline-flex w-fit min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--hairline-strong)] bg-[var(--panel-solid)] px-[11px] py-[5px] text-[13px] font-semibold leading-[1.45] text-[var(--ink-body)] [transition-property:background-color,border-color] ${skinTransitionClassName} hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] ${focusRingClassName}`;

/** `.vt-datarow` — 라벨과 값의 조용한 한 줄(`design.md` §6.10). */
export const testDataRowClassName =
  'flex items-baseline justify-between gap-4 border-b border-[var(--surface-divider)] py-3 last:border-b-0';

export const testDataRowKeyClassName = 'm-0 text-[13px] leading-[1.45] text-[var(--muted-aa)]';

export const testDataRowValueClassName =
  'm-0 text-right text-[14px] leading-[1.55] text-[var(--ink)] [word-break:keep-all] [overflow-wrap:anywhere]';

/** 타이포 역할. VIVE 의 `--h3` / `--body-sm` / `--caption` / `--overline` 을 값으로 옮긴 것이다
 *  — 런타임 토큰 계층은 제품이 실제로 소비하는 이름만 미러하므로 타입 역할은 아직 그 안에
 *  없다(`globals.css` §1). `site-gnb.tsx` 와 `landing-grid-card.tsx` 도 같은 방식으로 쓴다. */
export const testTitleClassName = 'm-0 text-[20px] font-semibold leading-[1.3] text-[var(--ink)]';

export const testBodyClassName = 'm-0 text-[14px] font-normal leading-[1.55] text-[var(--ink-body)]';

export const testCaptionClassName = 'm-0 text-[13px] font-normal leading-[1.45] text-[var(--muted-aa)]';

export const testOverlineClassName =
  'm-0 text-[12px] font-semibold leading-[1.4] tracking-[0.08em] text-[var(--muted-aa)]';
