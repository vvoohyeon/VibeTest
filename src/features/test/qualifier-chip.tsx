'use client';

import type {KeyboardEvent} from 'react';

import {testChipClassName} from '@/features/test/surface-class-names';

const testQualifierChipClassName = `test-qualifier-chip ${testChipClassName}`;

interface QualifierChipProps {
  label: string;
  ariaLabel: string;
  onActivate: () => void;
}

export function QualifierChip({label, ariaLabel, onActivate}: QualifierChipProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={testQualifierChipClassName}
      aria-label={ariaLabel}
      data-testid="test-qualifier-chip"
      onClick={onActivate}
      onKeyDown={handleKeyDown}
    >
      {label}
    </div>
  );
}
