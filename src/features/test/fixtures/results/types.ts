/**
 * Results Sheets 단일 행과 1:1 대응하는 최소 fixture 타입.
 *
 * Phase 9 result content schema는 아직 이 경계의 책임이 아니므로,
 * 현재 fixture는 row-level variantId 식별자만 보존한다.
 */
export interface ResultSourceRow {
  variantId: string;
}
