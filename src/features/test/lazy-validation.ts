import {defaultLocale} from '@/config/site';
import {
  asVariantId,
  validateVariantDataIntegrity,
  type BlockingDataErrorReason,
  type VariantSchema
} from '@/features/test/domain';
import {getVariantQuestionRows} from '@/features/test/fixtures/questions';
import {buildCanonicalQuestions, findFirstScoringRow} from '@/features/test/question-source-parser';
import {getSchemaForVariant} from '@/features/test/schema-registry';

export type LazyValidationErrorReason =
  | BlockingDataErrorReason
  | 'SCHEMA_NOT_FOUND'
  | 'SCORING1_NOT_FOUND';

export type LazyValidatedVariantResult =
  | {
      ok: true;
      variantId: string;
      value: VariantSchema;
    }
  | {
      ok: false;
      variantId: string;
      reason: LazyValidationErrorReason;
      detail?: string;
    };

const lazyValidatedVariantCache = new Map<string, LazyValidatedVariantResult>();
let lazyValidationRunCountForTests = 0;

function validateVariantNow(variantId: string): LazyValidatedVariantResult {
  lazyValidationRunCountForTests += 1;

  const schema = getSchemaForVariant(variantId);
  if (!schema) {
    return {
      ok: false,
      variantId,
      reason: 'SCHEMA_NOT_FOUND'
    };
  }

  const rows = getVariantQuestionRows(variantId);
  if (!findFirstScoringRow(rows)) {
    return {
      ok: false,
      variantId,
      reason: 'SCORING1_NOT_FOUND'
    };
  }

  const variantSchema: VariantSchema = {
    variant: asVariantId(variantId),
    schema,
    questions: buildCanonicalQuestions(rows, defaultLocale)
  };
  const integrity = validateVariantDataIntegrity(variantSchema);

  if (!integrity.ok) {
    return {
      ok: false,
      variantId,
      reason: integrity.reason,
      detail: integrity.detail
    };
  }

  return {
    ok: true,
    variantId,
    value: variantSchema
  };
}

export function getLazyValidatedVariant(variantId: string): LazyValidatedVariantResult {
  const cached = lazyValidatedVariantCache.get(variantId);
  if (cached) {
    return cached;
  }

  const result = validateVariantNow(variantId);
  lazyValidatedVariantCache.set(variantId, result);
  return result;
}

/**
 * 테스트 전용: lazy validation 모듈 수준 캐시와 검증 실행 카운터를 초기화한다.
 *
 * Production route/resolver에서는 import하지 않는다. Unit test가 같은 variant를
 * 실패/성공 fixture 상태로 바꿔 검증할 때 테스트 간 상태 오염을 막기 위한 escape hatch다.
 */
export function clearLazyValidationCacheForTesting(): void {
  lazyValidatedVariantCache.clear();
  lazyValidationRunCountForTests = 0;
}

export function resetLazyValidatedVariantCacheForTests(): void {
  clearLazyValidationCacheForTesting();
}

export function getLazyValidationRunCountForTests(): number {
  return lazyValidationRunCountForTests;
}
