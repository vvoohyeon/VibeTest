import {describe, expect, it} from 'vitest';

import {
  THEME_TRANSITION_CONFIG,
  createBlurCircleMask,
  getThemeSwitchGeometry,
  getThemeSwitchMaskFrame,
  resolveThemeSwitchRadiusProgress,
  resolveThemeTransitionDuration
} from '../../src/features/landing/gnb/hooks/theme-transition';

describe('gnb theme transition contracts', () => {
  it('keeps the blur circle duration config at 2800ms by default', () => {
    expect(THEME_TRANSITION_CONFIG.durationMs).toBe(2800);
    expect(THEME_TRANSITION_CONFIG.blurAmount).toBe(2);
    expect(resolveThemeTransitionDuration()).toBe(THEME_TRANSITION_CONFIG.durationMs);
  });

  it('builds the blur mask from the historical svg gaussian blur asset', () => {
    const blurMask = createBlurCircleMask(THEME_TRANSITION_CONFIG.blurAmount);

    expect(blurMask).toContain('feGaussianBlur');
    expect(blurMask).toContain('stdDeviation="2"');
    expect(blurMask).toContain('url(%23blur)');
  });

  it('computes the final radius from the farthest corner plus fixed overscan', () => {
    const geometry = getThemeSwitchGeometry({
      x: 400,
      y: 300,
      viewportWidth: 1200,
      viewportHeight: 800
    });

    expect(geometry.finalRadius).toBeCloseTo(geometry.maxRadius + THEME_TRANSITION_CONFIG.overscanPx, 5);
  });

  it('uses a monotonic progress curve that front-loads the reveal before the final segment', () => {
    expect(resolveThemeSwitchRadiusProgress(0)).toBe(0);
    expect(resolveThemeSwitchRadiusProgress(1)).toBe(1);
    expect(resolveThemeSwitchRadiusProgress(0.2)).toBeLessThan(resolveThemeSwitchRadiusProgress(0.4));
    expect(resolveThemeSwitchRadiusProgress(0.4)).toBeLessThan(resolveThemeSwitchRadiusProgress(0.8));
    expect(resolveThemeSwitchRadiusProgress(0.5)).toBeGreaterThan(0.75);
    expect(resolveThemeSwitchRadiusProgress(0.8)).toBeGreaterThan(0.97);
    expect(resolveThemeSwitchRadiusProgress(1) - resolveThemeSwitchRadiusProgress(0.8)).toBeLessThan(
      resolveThemeSwitchRadiusProgress(0.4) - resolveThemeSwitchRadiusProgress(0.2)
    );
  });

  it('derives mask frame size and position from the current radius using the blur asset scale', () => {
    const frame = getThemeSwitchMaskFrame({
      originX: 100,
      originY: 200,
      finalRadius: 500,
      timeProgress: 0.5
    });

    expect(frame.maskSize).toBeCloseTo(frame.radius * 4, 5);
    expect(frame.maskX).toBeCloseTo(100 - frame.maskSize / 2, 5);
    expect(frame.maskY).toBeCloseTo(200 - frame.maskSize / 2, 5);
  });

  it('allows explicit duration overrides for future experiments', () => {
    expect(resolveThemeTransitionDuration(1500)).toBe(1500);
  });
});
