export const MOBILE_MAX_VIEWPORT_WIDTH = 767;
export const TABLET_MAX_VIEWPORT_WIDTH = 1023;
export const CONTAINER_MAX_WIDTH = 1280;
export const MOBILE_SIDE_PADDING = 16;
export const NARROW_TABLET_SIDE_PADDING = 20;
export const TABLET_DESKTOP_SIDE_PADDING = 24;
export const NARROW_PADDING_MAX_VIEWPORT_WIDTH = 899;
export const DESKTOP_NARROW_MIN_AVAILABLE_WIDTH = 900;
export const DESKTOP_MEDIUM_MIN_AVAILABLE_WIDTH = 1040;
export const DESKTOP_WIDE_MIN_AVAILABLE_WIDTH = 1160;
export const TABLET_MAIN_THREE_COLUMNS_MIN_AVAILABLE_WIDTH = 900;

export type LandingGridTier = 'mobile' | 'tablet' | 'desktop';

export interface LandingGridInput {
  viewportWidth: number;
  availableWidth: number;
  cardCount: number;
}

export interface LandingGridRowPlan {
  rowIndex: number;
  role: 'hero' | 'main';
  columns: number;
  startIndex: number;
  endIndex: number;
  cardCount: number;
  isUnderfilled: boolean;
}

export interface LandingGridPlan {
  tier: LandingGridTier;
  row1Columns: number;
  rowNColumns: number;
  rows: LandingGridRowPlan[];
}

interface ResolvedColumns {
  row1Columns: number;
  rowNColumns: number;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function resolveHorizontalPadding(viewportWidth: number): number {
  if (viewportWidth <= MOBILE_MAX_VIEWPORT_WIDTH) {
    return MOBILE_SIDE_PADDING;
  }

  if (viewportWidth <= NARROW_PADDING_MAX_VIEWPORT_WIDTH) {
    return NARROW_TABLET_SIDE_PADDING;
  }

  return TABLET_DESKTOP_SIDE_PADDING;
}

export function resolveLandingAvailableWidth(viewportWidth: number): number {
  const normalizedViewportWidth = toNonNegativeInteger(viewportWidth);
  const cappedViewportWidth = Math.min(normalizedViewportWidth, CONTAINER_MAX_WIDTH);
  const horizontalPadding = resolveHorizontalPadding(normalizedViewportWidth);

  return Math.max(0, cappedViewportWidth - horizontalPadding * 2);
}

function resolveTier(viewportWidth: number): LandingGridTier {
  if (viewportWidth <= MOBILE_MAX_VIEWPORT_WIDTH) {
    return 'mobile';
  }

  if (viewportWidth <= TABLET_MAX_VIEWPORT_WIDTH) {
    return 'tablet';
  }

  return 'desktop';
}

function resolveColumns(tier: LandingGridTier, availableWidth: number): ResolvedColumns {
  const normalizedAvailableWidth = toNonNegativeInteger(availableWidth);

  if (tier === 'mobile') {
    return {
      row1Columns: 1,
      rowNColumns: 1
    };
  }

  if (tier === 'tablet') {
    return {
      row1Columns: 2,
      rowNColumns: normalizedAvailableWidth >= TABLET_MAIN_THREE_COLUMNS_MIN_AVAILABLE_WIDTH ? 3 : 2
    };
  }

  if (normalizedAvailableWidth >= DESKTOP_WIDE_MIN_AVAILABLE_WIDTH) {
    return {
      row1Columns: 3,
      rowNColumns: 4
    };
  }

  if (normalizedAvailableWidth >= DESKTOP_MEDIUM_MIN_AVAILABLE_WIDTH) {
    return {
      row1Columns: 2,
      rowNColumns: 3
    };
  }

  if (normalizedAvailableWidth >= DESKTOP_NARROW_MIN_AVAILABLE_WIDTH) {
    return {
      row1Columns: 2,
      rowNColumns: 2
    };
  }

  return {
    row1Columns: 2,
    rowNColumns: 2
  };
}

export function buildLandingGridPlan(input: LandingGridInput): LandingGridPlan {
  const cardCount = toNonNegativeInteger(input.cardCount);
  const tier = resolveTier(input.viewportWidth);
  const {row1Columns, rowNColumns} = resolveColumns(tier, input.availableWidth);

  const rows: LandingGridRowPlan[] = [];
  let cursor = 0;

  while (cursor < cardCount) {
    const rowIndex = rows.length;
    const targetColumns = rowIndex === 0 ? row1Columns : rowNColumns;
    const remainingCards = cardCount - cursor;
    const rowCardCount = Math.min(targetColumns, remainingCards);

    rows.push({
      rowIndex,
      role: rowIndex === 0 ? 'hero' : 'main',
      columns: targetColumns,
      startIndex: cursor,
      endIndex: cursor + rowCardCount,
      cardCount: rowCardCount,
      isUnderfilled: rowCardCount < targetColumns
    });

    cursor += rowCardCount;
  }

  return {
    tier,
    row1Columns,
    rowNColumns,
    rows
  };
}
