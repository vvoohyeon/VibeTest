/**
 * @planned A/B runtime response -> domain token projection layer.
 *
 * 이 파일은 Phase 4/7 소유의 A/B -> domain token projection 담당 파일입니다.
 * runtime `final_responses`의 'A' | 'B' 코드를 domain 함수가 기대하는
 * normalized token(pole label / qualifier token)으로 변환하는 pure helper 위치를 예약합니다.
 *
 * Scoring projection:
 *   A -> question.poleA
 *   B -> question.poleB
 *
 * Qualifier projection:
 *   A -> qualifierField.values[0]
 *   B -> qualifierField.values[1]
 *
 * 이 파일 없이 computeScoreStats() / buildTypeSegment()에
 * raw 'A' | 'B' 응답을 직접 전달하지 마세요.
 * 현재는 계약 예약용 stub이며 실제 함수 export는 없습니다.
 *
 * @see src/features/test/domain/derivation.ts computeScoreStats()
 * @see src/features/test/domain/type-segment.ts buildTypeSegment()
 */
