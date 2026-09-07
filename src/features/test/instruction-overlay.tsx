'use client';

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
  return (
    <div
      className={`test-instruction-overlay fixed inset-0 z-[1050] grid place-items-center p-6 max-[767px]:p-0 ${testScrimClassName}`}
      data-testid="test-instruction-overlay"
    >
      <div className={instructionCardClassName}>
        {qualifierStep ? (
          <div className="grid gap-4" data-testid="test-qualifier-step">
            <h2 className={testTitleClassName}>{qualifierStep.item.questionText}</h2>
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
                  <span className={testAnswerChoiceMarkClassName} aria-hidden="true" />
                  <span className={testAnswerChoiceTextClassName}>{choice.label}</span>
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
            <h2 className={testTitleClassName}>{title}</h2>
            <p className={testBodyClassName} data-testid="test-instruction-body">
              {instructionText}
            </p>
            {showDivider ? (
              <hr
                className="test-instruction-divider m-0 h-px w-full border-0 bg-[var(--surface-divider)]"
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
