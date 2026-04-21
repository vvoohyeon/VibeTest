import {describe, expect, it} from 'vitest';

import {
  asQuestionIndex,
  asVariantId,
  validateQuestionModel,
  validateVariantDataIntegrity,
  type AxisCount,
  type AxisSpec,
  type Question,
  type QuestionType,
  type ScoringMode,
  type VariantSchema
} from '../../src/features/test/domain';

function makeAxis(poleA: string, poleB: string, scoringMode: ScoringMode = 'binary_majority'): AxisSpec {
  return {poleA, poleB, scoringMode};
}

function makeQuestion(
  index: number,
  poleA: string | undefined,
  poleB: string | undefined,
  questionType: QuestionType
): Question {
  return {
    index: asQuestionIndex(index),
    poleA,
    poleB,
    questionType
  };
}

function makeVariantSchema(input?: {
  axisCount?: AxisCount;
  axes?: AxisSpec[];
  questions?: Question[];
}): VariantSchema {
  const axes = input?.axes ?? [makeAxis('E', 'I')];

  return {
    variant: asVariantId('qmbti'),
    schema: {
      variantId: asVariantId('qmbti'),
      scoringSchemaId: 'schema-qmbti',
      axisCount: input?.axisCount ?? 1,
      axes,
      supportedSections: ['derived_type', 'type_desc']
    },
    questions:
      input?.questions ??
      [makeQuestion(1, 'E', 'I', 'scoring'), makeQuestion(2, 'E', 'I', 'scoring'), makeQuestion(3, 'E', 'I', 'scoring')]
  };
}

describe('test domain question model and integrity validation', () => {
  it('assertion:B7-question-model-integrity accepts scoring questions mapped to one axis and profile questions without axis poles', () => {
    const schema = makeVariantSchema({
      axisCount: 2,
      axes: [makeAxis('E', 'I'), makeAxis('S', 'N')],
      questions: [
        makeQuestion(1, 'E', 'I', 'scoring'),
        makeQuestion(2, 'E', 'I', 'scoring'),
        makeQuestion(3, 'E', 'I', 'scoring'),
        makeQuestion(4, 'S', 'N', 'scoring'),
        makeQuestion(5, 'S', 'N', 'scoring'),
        makeQuestion(6, 'S', 'N', 'scoring'),
        makeQuestion(7, undefined, undefined, 'profile')
      ]
    });

    expect(validateQuestionModel(schema.questions, schema.schema)).toEqual({
      ok: true,
      value: schema.questions
    });
  });

  it('assertion:B7-question-model-integrity accepts reverse-direction scoring questions for the same schema axis', () => {
    const schema = makeVariantSchema({
      axes: [makeAxis('E', 'I')],
      questions: [makeQuestion(1, 'I', 'E', 'scoring')]
    });

    expect(validateQuestionModel(schema.questions, schema.schema)).toEqual({
      ok: true,
      value: schema.questions
    });
  });

  it('assertion:B7-question-model-integrity rejects duplicate indexes and invalid scoring pole declarations', () => {
    const duplicateIndexQuestions = [
      makeQuestion(1, 'E', 'I', 'scoring'),
      makeQuestion(1, 'E', 'I', 'scoring'),
      makeQuestion(3, undefined, undefined, 'profile')
    ];

    expect(validateQuestionModel(duplicateIndexQuestions, makeVariantSchema().schema)).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'QUESTION_MODEL_VIOLATION'
      })
    );

    expect(
      validateQuestionModel([makeQuestion(1, 'E', 'E', 'scoring')], makeVariantSchema().schema)
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'QUESTION_MODEL_VIOLATION'
      })
    );

    expect(
      validateQuestionModel([makeQuestion(1, undefined, 'I', 'scoring')], makeVariantSchema().schema)
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'QUESTION_MODEL_VIOLATION'
      })
    );

    expect(
      validateQuestionModel([makeQuestion(1, 'T', 'F', 'scoring')], makeVariantSchema().schema)
    ).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'QUESTION_MODEL_VIOLATION'
      })
    );
  });

  it('assertion:B12-odd-count-validation rejects even-count scoring axes while ignoring profile questions for the odd-count rule', () => {
    const schema = makeVariantSchema({
      questions: [
        makeQuestion(1, 'E', 'I', 'scoring'),
        makeQuestion(2, 'E', 'I', 'scoring'),
        makeQuestion(3, undefined, undefined, 'profile')
      ]
    });

    expect(validateVariantDataIntegrity(schema)).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'EVEN_AXIS_QUESTION_COUNT'
      })
    );
  });

  it('assertion:B12-odd-count-validation counts reverse-direction EGTT questions on the same axis', () => {
    const schema = makeVariantSchema({
      axes: [makeAxis('E', 'T')],
      questions: [makeQuestion(1, 'E', 'T', 'scoring'), makeQuestion(2, 'T', 'E', 'scoring')]
    });

    expect(validateVariantDataIntegrity(schema)).toEqual({
      ok: false,
      reason: 'EVEN_AXIS_QUESTION_COUNT',
      detail: 'ET:2'
    });
  });

  it('assertion:B12-odd-count-validation rejects duplicate axis specs, axis-count mismatch, and unsupported scoring modes', () => {
    const duplicateAxisSchema = makeVariantSchema({
      axisCount: 2,
      axes: [makeAxis('E', 'I'), makeAxis('E', 'I')],
      questions: [
        makeQuestion(1, 'E', 'I', 'scoring'),
        makeQuestion(2, 'E', 'I', 'scoring'),
        makeQuestion(3, 'E', 'I', 'scoring')
      ]
    });

    expect(validateVariantDataIntegrity(duplicateAxisSchema)).toEqual({
      ok: false,
      reason: 'DUPLICATE_AXIS_SPEC',
      detail: 'EI'
    });

    const mismatchedAxisCountSchema = makeVariantSchema({
      axisCount: 2,
      axes: [makeAxis('E', 'I')]
    });

    expect(validateVariantDataIntegrity(mismatchedAxisCountSchema)).toEqual({
      ok: false,
      reason: 'AXIS_COUNT_SCHEMA_MISMATCH'
    });

    const unsupportedScoringModeSchema = makeVariantSchema({
      axes: [makeAxis('E', 'I', 'scale')]
    });

    expect(validateVariantDataIntegrity(unsupportedScoringModeSchema)).toEqual({
      ok: false,
      reason: 'UNSUPPORTED_SCORING_MODE',
      detail: 'EI'
    });
  });

  it('accepts empty-question, valid schema, and profile-question optional pole edge cases according to the Phase 1 contract', () => {
    expect(validateVariantDataIntegrity(makeVariantSchema({questions: []}))).toEqual({
      ok: false,
      reason: 'EMPTY_QUESTION_SET'
    });

    const validSchema = makeVariantSchema({
      axisCount: 2,
      axes: [makeAxis('E', 'I'), makeAxis('S', 'N')],
      questions: [
        makeQuestion(1, 'E', 'I', 'scoring'),
        makeQuestion(2, 'E', 'I', 'scoring'),
        makeQuestion(3, 'E', 'I', 'scoring'),
        makeQuestion(4, 'S', 'N', 'scoring'),
        makeQuestion(5, 'S', 'N', 'scoring'),
        makeQuestion(6, 'S', 'N', 'scoring')
      ]
    });

    expect(validateVariantDataIntegrity(validSchema)).toEqual({ok: true});

    expect(
      validateQuestionModel([makeQuestion(1, undefined, undefined, 'profile')], makeVariantSchema().schema)
    ).toEqual({
      ok: true,
      value: [makeQuestion(1, undefined, undefined, 'profile')]
    });

    expect(
      validateQuestionModel([makeQuestion(1, 'x', 'x', 'profile')], makeVariantSchema().schema)
    ).toEqual({
      ok: true,
      value: [makeQuestion(1, 'x', 'x', 'profile')]
    });
  });
});
