import {describe, expect, it} from 'vitest';

import {resolveResultsVariantIds} from '../../src/features/test/fixtures/results';
import {validateCrossSheetIntegrity} from '../../src/features/variant-registry/cross-sheet-integrity';

const LANDING_TEST_VARIANTS = [
  'qmbti',
  'rhythm-b',
  'debug-sample',
  'energy-check',
  'creativity-profile',
  'burnout-risk',
  'egtt'
];

const QUESTION_VARIANTS = [
  'qmbti',
  'rhythm-b',
  'debug-sample',
  'energy-check',
  'creativity-profile',
  'burnout-risk',
  'egtt'
];
const CURRENT_TESTABLE_VARIANTS = ['qmbti', 'rhythm-b', 'energy-check', 'egtt'];
const RESULTS_VARIANTS = resolveResultsVariantIds();

describe('validateCrossSheetIntegrity', () => {
  it('기존 2-source caller 기준: Landing과 Questions가 완전히 일치한다', () => {
    const result = validateCrossSheetIntegrity(LANDING_TEST_VARIANTS, QUESTION_VARIANTS);

    expect(result.ok).toBe(true);
    expect(result.missingInQuestions).toHaveLength(0);
    expect(result.extraInQuestions).toHaveLength(0);
    expect(result.missingInResults).toHaveLength(0);
    expect(result.extraInResults).toHaveLength(0);
  });

  it('resultsVariants 생략 시 ok는 Landing↔Questions 2-source 정합성만 반영한다', () => {
    const matching = validateCrossSheetIntegrity(['qmbti'], ['qmbti']);
    const missingInQuestions = validateCrossSheetIntegrity(['qmbti', 'landing-only'], ['qmbti']);
    const extraInQuestions = validateCrossSheetIntegrity(['qmbti'], ['qmbti', 'question-only'], undefined);

    expect(matching).toEqual({
      ok: true,
      missingInQuestions: [],
      extraInQuestions: [],
      missingInResults: [],
      extraInResults: []
    });
    expect(missingInQuestions).toMatchObject({
      ok: false,
      missingInQuestions: ['landing-only'],
      extraInQuestions: [],
      missingInResults: [],
      extraInResults: []
    });
    expect(extraInQuestions).toMatchObject({
      ok: false,
      missingInQuestions: [],
      extraInQuestions: ['question-only'],
      missingInResults: [],
      extraInResults: []
    });
  });

  it('assertion:B29-sheets-sync-action-validation-three-source-unit 3-source가 모두 일치하면 ok true를 반환한다', () => {
    const result = validateCrossSheetIntegrity(
      CURRENT_TESTABLE_VARIANTS,
      CURRENT_TESTABLE_VARIANTS,
      RESULTS_VARIANTS
    );

    expect(result).toEqual({
      ok: true,
      missingInQuestions: [],
      extraInQuestions: [],
      missingInResults: [],
      extraInResults: []
    });
  });

  it('Questions에 시트 없는 Landing variant는 missingInQuestions에 포함된다', () => {
    const result = validateCrossSheetIntegrity([...LANDING_TEST_VARIANTS, 'new-variant'], QUESTION_VARIANTS);

    expect(result.ok).toBe(false);
    expect(result.missingInQuestions).toContain('new-variant');
  });

  it('Landing에 없는 Questions 시트는 extraInQuestions에 포함된다', () => {
    const result = validateCrossSheetIntegrity(LANDING_TEST_VARIANTS, [...QUESTION_VARIANTS, 'orphan-sheet']);

    expect(result.ok).toBe(false);
    expect(result.extraInQuestions).toContain('orphan-sheet');
  });

  it('Results에 row 없는 Questions variant는 missingInResults에 포함된다', () => {
    const result = validateCrossSheetIntegrity(['qmbti', 'missing-result'], ['qmbti', 'missing-result'], ['qmbti']);

    expect(result.ok).toBe(false);
    expect(result.missingInQuestions).toHaveLength(0);
    expect(result.extraInQuestions).toHaveLength(0);
    expect(result.missingInResults).toEqual(['missing-result']);
    expect(result.extraInResults).toHaveLength(0);
  });

  it('Results에만 있는 variant는 extraInResults에 포함된다', () => {
    const result = validateCrossSheetIntegrity(['qmbti'], ['qmbti'], ['qmbti', 'orphan-result']);

    expect(result.ok).toBe(false);
    expect(result.missingInResults).toHaveLength(0);
    expect(result.extraInResults).toEqual(['orphan-result']);
  });

  it('blog variant는 landingTestVariants에서 제외하고 전달해야 한다', () => {
    const result = validateCrossSheetIntegrity(['qmbti'], ['qmbti'], ['qmbti']);

    expect(result.ok).toBe(true);
  });

  it('blog variant가 landingTestVariants에 포함되면 caller 책임 위반으로 missingInQuestions가 된다', () => {
    const result = validateCrossSheetIntegrity([...CURRENT_TESTABLE_VARIANTS, 'ops-handbook'], CURRENT_TESTABLE_VARIANTS);

    expect(result.ok).toBe(false);
    expect(result.missingInQuestions).toContain('ops-handbook');
  });
});
