import type {VariantRegistry} from '@/features/variant-registry/types';

export interface CrossSheetValidationResult {
  /** 전달된 source가 모두 정합하면 true */
  ok: boolean;
  /** Landing에 있으나 Questions Sheets에 시트가 없는 test variant 목록 */
  missingInQuestions: string[];
  /** Questions Sheets에 시트가 있으나 Landing에 없는 variant 목록 */
  extraInQuestions: string[];
  /** Questions Sheets에 시트가 있으나 Results source에 row가 없는 variant 목록 */
  missingInResults: string[];
  /** Results source에 row가 있으나 Questions Sheets에 시트가 없는 variant 목록 */
  extraInResults: string[];
}

export interface CrossSheetRuntimeFallbackResult {
  registry: VariantRegistry;
  blockedRuntimeVariants: string[];
}

/**
 * Landing test variant 목록, Questions 시트 이름 목록, Results row variant 목록의 정합성을 검증한다.
 *
 * @param landingTestVariants Landing Sheets에서 type='test'인 variant ID 목록
 * @param questionVariants Questions Sheets의 시트 이름 목록(= variant ID 목록)
 * @param resultsVariants Results Sheets의 row-level variantId 목록
 *
 * 검증 규칙:
 * - landingTestVariants에 있지만 questionVariants에 없으면 missingInQuestions
 * - questionVariants에 있지만 landingTestVariants에 없으면 extraInQuestions
 * - questionVariants에 있지만 resultsVariants에 없으면 missingInResults
 * - resultsVariants에 있지만 questionVariants에 없으면 extraInResults
 * - 양쪽이 완전히 일치하면 ok: true
 *
 * 이 함수는 sync 스크립트의 pre-commit 검증과 runtime 방어선 양쪽에서 사용한다.
 */
export function validateCrossSheetIntegrity(
  landingTestVariants: string[],
  questionVariants: string[],
  resultsVariants?: string[]
): CrossSheetValidationResult {
  const landingSet = new Set(landingTestVariants);
  const questionSet = new Set(questionVariants);
  const resultSet = new Set(resultsVariants ?? []);

  const missingInQuestions = landingTestVariants.filter((variant) => !questionSet.has(variant));
  const extraInQuestions = questionVariants.filter((variant) => !landingSet.has(variant));
  const missingInResults = resultsVariants ? questionVariants.filter((variant) => !resultSet.has(variant)) : [];
  const extraInResults = resultsVariants ? resultsVariants.filter((variant) => !questionSet.has(variant)) : [];

  return {
    ok:
      missingInQuestions.length === 0 &&
      extraInQuestions.length === 0 &&
      missingInResults.length === 0 &&
      extraInResults.length === 0,
    missingInQuestions,
    extraInQuestions,
    missingInResults,
    extraInResults
  };
}

function uniqueVariants(variants: ReadonlyArray<string>): string[] {
  return Array.from(new Set(variants));
}

export function applyCrossSheetRuntimeFallback(
  registry: VariantRegistry,
  integrity: CrossSheetValidationResult
): CrossSheetRuntimeFallbackResult {
  const hiddenLandingVariants = new Set(integrity.missingInQuestions);
  const blockedRuntimeVariants = uniqueVariants([
    ...integrity.missingInQuestions,
    ...integrity.extraInQuestions,
    ...integrity.missingInResults,
    ...integrity.extraInResults
  ]);

  if (hiddenLandingVariants.size === 0) {
    return {
      registry,
      blockedRuntimeVariants
    };
  }

  return {
    registry: {
      ...registry,
      landingCards: registry.landingCards.map((card) =>
        card.type === 'test' && hiddenLandingVariants.has(card.variant) ? {...card, attribute: 'hide'} : card
      )
    },
    blockedRuntimeVariants
  };
}
