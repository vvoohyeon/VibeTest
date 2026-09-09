'use client';

import {useCallback, useEffect, useId, useRef, type KeyboardEvent} from 'react';

import type {QualifierOverlayItem} from './qualifier-overlay-model';
import {
  testAnswerChoiceClassName,
  testAnswerChoiceMarkClassName,
  testAnswerChoiceTextClassName,
  testBodyClassName,
  testCaptionClassName,
  testFloatingClassName,
  testPrimaryButtonClassName,
  testQuietButtonClassName,
  testScrimClassName,
  testSecondaryButtonClassName,
  testTitleClassName
} from './surface-class-names';

const instructionActionRowClassName = 'flex flex-wrap items-center gap-2';
// 다이얼로그는 floating 표면이다: `--surface-raised` · 모서리 하나 · overlay 그림자.
// 종전에는 94% 반투명 패널에 22px 흐림 그림자를 얹고 **테두리가 아예 없었다** — 그래서 다크
// 에서 다이얼로그와 그 뒤 페이지를 가르는 것이 아무것도 없었다(scrim 은 1.04:1 밖에 못 어둡게
// 한다). 모바일에서는 표면이 뷰포트를 가득 채워 뒷면이 보이지 않으므로 모서리를 걷는다.
const instructionCardClassName =
  `test-instruction-card grid gap-4 p-5 ${testFloatingClassName} max-[767px]:min-h-full max-[767px]:w-full max-[767px]:content-start max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:pt-[88px]`;
const instructionNoteClassName = `test-instruction-note ${testCaptionClassName}`;
// 열리면 포커스가 다이얼로그 컨테이너 자체로 들어온다 — 첫 컨트롤이 아니라. 첫 컨트롤에 두면
// Enter 한 번이 곧 「동의하고 시작」이 되는데, 동의를 묻는 창에서 그것은 기본값으로 삼을
// 행동이 아니다. 컨테이너는 컨트롤이 아니므로 UA 링을 그리지 않는다.
const instructionDialogClassName = `${instructionCardClassName} outline-none`;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface InstructionOverlayProps {
  title: string;
  instructionText: string;
  consentNote?: string;
  showDivider: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryTestId?: string;
  secondaryTestId?: string;
  qualifierStep?: {
    item: QualifierOverlayItem;
    selectedToken: string | null;
    onSelect: (token: string) => void;
    onBack: () => void;
    continueLabel: string;
    continueDisabled: boolean;
    showBack: boolean;
    isReentry?: boolean;
    backLabel?: string;
  };
}

export function InstructionOverlay({
  title,
  instructionText,
  consentNote,
  showDivider,
  primaryLabel,
  secondaryLabel,
  onPrimaryAction,
  onSecondaryAction,
  primaryTestId = 'test-start-button',
  secondaryTestId = 'test-secondary-instruction-button',
  qualifierStep
}: InstructionOverlayProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  // 어느 단계든 왼쪽(dismiss) 행동이 Esc 의 행동이다: 지시 단계는 secondary CTA(「동의하지
  // 않고 시작」이면 그대로 시작, 「동의하지 않고 나가기」면 랜딩으로), qualifier 단계는
  // Back / Cancel. secondary 가 없는 창(「시작」 하나뿐)에서는 Esc 가 아무것도 하지 않는다 —
  // 동의를 묻는 문을 Esc 로 열어 주는 것은 닫는 것이 아니다.
  const dismissAction = qualifierStep ? qualifierStep.onBack : onSecondaryAction;
  const stepKey = qualifierStep ? qualifierStep.item.canonicalIndex : 'instruction';

  // 열릴 때 그 전에 포커스가 있던 곳을 적어 두고, 닫힐 때 거기로 돌려보낸다. 재진입(칩 → 창 →
  // 취소)에서는 그것이 칩이다. 처음 페이지가 열릴 때는 body 라 돌려보낼 곳이 없다.
  useEffect(() => {
    const previous = document.activeElement;
    restoreFocusRef.current = previous instanceof HTMLElement && previous !== document.body ? previous : null;
    return () => {
      const target = restoreFocusRef.current;
      if (target && target.isConnected) {
        target.focus();
      }
    };
  }, []);

  // 단계가 바뀌면(지시 → qualifier, 재진입 뒤로) 눌렀던 버튼이 언마운트되어 포커스가 body 로
  // 새어 나간다. 컨테이너로 되돌려 트랩 안에 둔다.
  useEffect(() => {
    dialogRef.current?.focus({preventScroll: true});
  }, [stepKey]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        if (!dismissAction) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        dismissAction();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || active === dialog) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dismissAction]
  );

  return (
    <div
      className={`test-instruction-overlay fixed inset-0 z-[1050] grid place-items-center p-6 max-[767px]:p-0 ${testScrimClassName}`}
      data-testid="test-instruction-overlay"
    >
      <div
        ref={dialogRef}
        className={instructionDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={qualifierStep ? undefined : descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {qualifierStep ? (
          <div className="grid gap-4" data-testid="test-qualifier-step">
            <h2 id={titleId} className={testTitleClassName}>
              {qualifierStep.item.questionText}
            </h2>
            <div className="grid gap-2">
              {qualifierStep.item.choices.map((choice) => (
                <button
                  key={choice.token}
                  type="button"
                  className={testAnswerChoiceClassName}
                  data-selected={qualifierStep.selectedToken === choice.token ? 'true' : 'false'}
                  data-testid={`test-qualifier-choice-${choice.token.toLowerCase()}`}
                  onClick={() => {
                    qualifierStep.onSelect(choice.token);
                  }}
                >
                  <span className={testAnswerChoiceTextClassName}>{choice.label}</span>
                  <span className={testAnswerChoiceMarkClassName} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className={`${instructionActionRowClassName} justify-end`}>
              {qualifierStep.showBack ? (
                <button
                  type="button"
                  className={testSecondaryButtonClassName}
                  onClick={qualifierStep.onBack}
                  data-testid={
                    qualifierStep.isReentry
                      ? 'test-qualifier-reentry-cancel-button'
                      : 'test-qualifier-back-button'
                  }
                >
                  {qualifierStep.backLabel}
                </button>
              ) : null}
              <button
                type="button"
                className={testPrimaryButtonClassName}
                onClick={onPrimaryAction}
                disabled={qualifierStep.continueDisabled}
                data-testid="test-qualifier-continue-button"
              >
                {qualifierStep.continueLabel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id={titleId} className={testTitleClassName}>
              {title}
            </h2>
            <p id={descriptionId} className={testBodyClassName} data-testid="test-instruction-body">
              {instructionText}
            </p>
            {showDivider ? (
              <hr
                className="test-instruction-divider m-0 h-px w-full border-0 bg-[var(--hairline)]"
                data-testid="test-instruction-divider"
              />
            ) : null}
            {consentNote ? (
              <p className={instructionNoteClassName} data-testid="test-instruction-note">
                {consentNote}
              </p>
            ) : null}
            {/* 동의 거부는 quiet 무게를 받는다. 종전에는 「이전」과 똑같은 중립 채움이어서
                동의 거부와 문항 이동이 같은 시각 무게를 가졌다. */}
            <div className={`${instructionActionRowClassName} justify-end`}>
              {secondaryLabel && onSecondaryAction ? (
                <button
                  type="button"
                  className={testQuietButtonClassName}
                  onClick={onSecondaryAction}
                  data-testid={secondaryTestId}
                >
                  {secondaryLabel}
                </button>
              ) : null}
              <button
                type="button"
                className={testPrimaryButtonClassName}
                onClick={onPrimaryAction}
                data-testid={primaryTestId}
              >
                {primaryLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
