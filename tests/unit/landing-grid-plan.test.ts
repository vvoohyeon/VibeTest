import {describe, expect, it} from 'vitest';

import {buildLandingGridPlan, resolveLandingAvailableWidth} from '@/features/landing/grid/layout-plan';

describe('landing grid layout plan', () => {
  it('applies desktop wide row rules with underfilled final row', () => {
    const viewportWidth = 1440;
    const plan = buildLandingGridPlan({
      viewportWidth,
      availableWidth: resolveLandingAvailableWidth(viewportWidth),
      cardCount: 9
    });

    expect(plan.tier).toBe('desktop');
    expect(plan.row1Columns).toBe(3);
    expect(plan.rowNColumns).toBe(4);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([3, 4, 2]);
    expect(plan.rows.at(-1)?.columns).toBe(4);
    expect(plan.rows.at(-1)?.isUnderfilled).toBe(true);
  });

  it('applies desktop medium row rules', () => {
    const viewportWidth = 1120;
    const plan = buildLandingGridPlan({
      viewportWidth,
      availableWidth: resolveLandingAvailableWidth(viewportWidth),
      cardCount: 9
    });

    expect(plan.row1Columns).toBe(2);
    expect(plan.rowNColumns).toBe(3);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([2, 3, 3, 1]);
  });

  it('applies desktop narrow row rules', () => {
    const viewportWidth = 1024;
    const plan = buildLandingGridPlan({
      viewportWidth,
      availableWidth: resolveLandingAvailableWidth(viewportWidth),
      cardCount: 5
    });

    expect(plan.row1Columns).toBe(2);
    expect(plan.rowNColumns).toBe(2);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([2, 2, 1]);
  });

  it('keeps desktop narrow tier reachable at minimum desktop viewport', () => {
    const availableWidth = resolveLandingAvailableWidth(1024);
    expect(availableWidth).toBeGreaterThanOrEqual(900);
    expect(availableWidth).toBeLessThan(1040);
  });

  it('switches from narrow to medium at 1040 available width boundary', () => {
    const narrowPlan = buildLandingGridPlan({
      viewportWidth: 1087,
      availableWidth: resolveLandingAvailableWidth(1087),
      cardCount: 8
    });
    const mediumPlan = buildLandingGridPlan({
      viewportWidth: 1088,
      availableWidth: resolveLandingAvailableWidth(1088),
      cardCount: 8
    });

    expect(narrowPlan.rowNColumns).toBe(2);
    expect(mediumPlan.rowNColumns).toBe(3);
  });

  it('applies tablet rules with hero row fixed to 2 and main row 3 when wide enough', () => {
    const plan = buildLandingGridPlan({
      viewportWidth: 1023,
      availableWidth: 975,
      cardCount: 8
    });

    expect(plan.tier).toBe('tablet');
    expect(plan.row1Columns).toBe(2);
    expect(plan.rowNColumns).toBe(3);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([2, 3, 3]);
  });

  it('applies tablet rules with 2-column main rows when width is below threshold', () => {
    const plan = buildLandingGridPlan({
      viewportWidth: 900,
      availableWidth: 852,
      cardCount: 5
    });

    expect(plan.row1Columns).toBe(2);
    expect(plan.rowNColumns).toBe(2);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([2, 2, 1]);
  });

  it('applies one-column mobile rows', () => {
    const plan = buildLandingGridPlan({
      viewportWidth: 390,
      availableWidth: 358,
      cardCount: 4
    });

    expect(plan.tier).toBe('mobile');
    expect(plan.row1Columns).toBe(1);
    expect(plan.rowNColumns).toBe(1);
    expect(plan.rows.map((row) => row.cardCount)).toEqual([1, 1, 1, 1]);
  });
});
