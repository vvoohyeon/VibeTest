import type {LocalizedText} from '@/features/variant-registry/types';

/**
 * Questions Sheets 단일 행과 1:1 대응하는 타입.
 *
 * seq: Sheets의 원본 seq 표기.
 *   - 숫자 문자열("1", "2", ...): scoring question
 *   - "q.{n}" 형식("q.1", "q.2", ...): profile question
 *
 * question: 다국어 질문 텍스트. Sheets의 question_EN / question_KR 등을 locale 키로 저장.
 * poleA / poleB: scoring question에서만 존재하는 축 레이블.
 *   profile question(seq="q.*")에서는 undefined.
 *
 * @migration Sheets 추가 locale 컬럼(question_JA 등) 도입 시 LocalizedText에 키만 추가.
 */
export interface QuestionSourceRow {
  seq: string;
  question: LocalizedText;
  poleA?: string;
  poleB?: string;
  /**
   * UI 표시용 선택지 텍스트. locale별 표시 문자열이다.
   *
   * ⚠️ domain token과 구분:
   *   이 값은 runtime A/B 선택지 레이블로 사용된다.
   *   scoring/qualifier 집계에 사용되는 domain token('E','I','M','F' 등)은
   *   schema-registry.ts의 ScoringSchema.axes[].poleA/poleB 및
   *   QualifierFieldSpec.values에서 별도로 정의한다.
   *   answerA/answerB와 domain token은 동일한 값이 아닐 수 있다.
   *
   * 예: egtt qualifier question
   *   answerA.en = 'Male'   ← 표시 텍스트
   *   answerB.en = 'Female' ← 표시 텍스트
   *   QualifierFieldSpec.values = ['M', 'F']  ← domain token (result URL용)
   */
  answerA: LocalizedText;
  answerB: LocalizedText;
}

/**
 * variant ID를 키로, 해당 variant의 Questions 시트 행 배열을 값으로 갖는 맵.
 * 행 순서는 Sheets 원본의 출현 순서와 동일하게 유지한다.
 */
export type QuestionSourceFixtureMap = Readonly<Record<string, ReadonlyArray<QuestionSourceRow>>>;
