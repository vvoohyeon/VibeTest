import type {ResultSourceRow} from './types';

export type {ResultSourceRow};

export const resultsSourceFixture: ReadonlyArray<ResultSourceRow> = [
  {variantId: 'qmbti'},
  {variantId: 'rhythm-b'},
  {variantId: 'energy-check'},
  {variantId: 'egtt'}
] as const;

export function resolveResultsVariantIds(
  rows: ReadonlyArray<ResultSourceRow> = resultsSourceFixture
): string[] {
  const seenVariants = new Set<string>();
  const variantIds: string[] = [];

  for (const row of rows) {
    if (!seenVariants.has(row.variantId)) {
      seenVariants.add(row.variantId);
      variantIds.push(row.variantId);
    }
  }

  return variantIds;
}
