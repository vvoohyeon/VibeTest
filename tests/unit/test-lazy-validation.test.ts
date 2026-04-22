import {afterEach, describe, expect, it} from 'vitest';

import {
  clearLazyValidationCacheForTesting,
  getLazyValidatedVariant,
  getLazyValidationRunCountForTests
} from '../../src/features/test/lazy-validation';
import {getVariantQuestionRows} from '../../src/features/test/fixtures/questions';
import {debugSampleQuestions} from '../../src/features/test/fixtures/questions/debug-sample';
import type {QuestionSourceRow} from '../../src/features/test/fixtures/questions/types';
import {buildCanonicalQuestions} from '../../src/features/test/question-source-parser';
import {getSchemaForVariant} from '../../src/features/test/schema-registry';
import {asVariantId, validateVariantDataIntegrity, type VariantSchema} from '../../src/features/test/domain';

const ENTERABLE_VARIANTS = ['qmbti', 'energy-check', 'rhythm-b', 'egtt'] as const;

function buildVariantSchema(variantId: string): VariantSchema {
  const schema = getSchemaForVariant(variantId);
  if (!schema) {
    throw new Error(`Expected schema for ${variantId}`);
  }

  return {
    variant: asVariantId(variantId),
    schema,
    questions: buildCanonicalQuestions(getVariantQuestionRows(variantId), 'en')
  };
}

afterEach(() => {
  clearLazyValidationCacheForTesting();
});

describe('getLazyValidatedVariant', () => {
  it.each(ENTERABLE_VARIANTS)('%s fixture passes validateVariantDataIntegrity', (variantId) => {
    expect(validateVariantDataIntegrity(buildVariantSchema(variantId))).toEqual({ok: true});
  });

  it('assertion:B30-runtime-lazy-validation-cache-unit validates once and returns cached result on the second call', () => {
    const first = getLazyValidatedVariant('qmbti');
    const runCountAfterFirstCall = getLazyValidationRunCountForTests();
    const second = getLazyValidatedVariant('qmbti');

    expect(first.ok).toBe(true);
    expect(second).toBe(first);
    expect(runCountAfterFirstCall).toBe(1);
    expect(getLazyValidationRunCountForTests()).toBe(1);
  });

  it('returns an error result for a failing variant without affecting another variant', () => {
    // debug-sample은 validateVariantDataIntegrity() 실패를 검증하기 위한 의도적 오류 fixture다.
    const failing = getLazyValidatedVariant('debug-sample');
    const passing = getLazyValidatedVariant('qmbti');

    expect(failing).toEqual(
      expect.objectContaining({
        ok: false,
        variantId: 'debug-sample'
      })
    );
    expect(passing.ok).toBe(true);
  });

  it('clears cached failure so the same variant can be validated again after fixture repair', () => {
    // debug-sample은 validateVariantDataIntegrity() 실패를 검증하기 위한 의도적 오류 fixture다.
    const failing = getLazyValidatedVariant('debug-sample');
    const mutableRows = debugSampleQuestions as QuestionSourceRow[];
    const originalLength = mutableRows.length;

    try {
      mutableRows.push(
        {
          seq: '5',
          question: {en: 'Temporary cache-reset test row for EI axis.'},
          poleA: 'E',
          poleB: 'I',
          answerA: {en: 'E'},
          answerB: {en: 'I'}
        },
        {
          seq: '6',
          question: {en: 'Temporary cache-reset test row for TF axis.'},
          poleA: 'T',
          poleB: 'F',
          answerA: {en: 'T'},
          answerB: {en: 'F'}
        }
      );

      const stillCachedFailure = getLazyValidatedVariant('debug-sample');
      clearLazyValidationCacheForTesting();
      const repaired = getLazyValidatedVariant('debug-sample');

      expect(failing.ok).toBe(false);
      expect(stillCachedFailure).toBe(failing);
      expect(repaired.ok).toBe(true);
    } finally {
      mutableRows.splice(originalLength);
    }
  });
});
