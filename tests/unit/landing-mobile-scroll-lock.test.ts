// @vitest-environment jsdom

import React, {act} from 'react';
import type {Root} from 'react-dom/client';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {LandingCardMobilePhase} from '../../src/features/landing/grid/landing-grid-card';
import {
  shouldLockMobilePageScroll,
  useMobileScrollLock
} from '../../src/features/landing/grid/use-mobile-scroll-lock';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function ScrollLockHarness({phase}: {phase: LandingCardMobilePhase}) {
  useMobileScrollLock(phase);
  return null;
}

async function renderPhase(phase: LandingCardMobilePhase) {
  await act(async () => {
    root?.render(React.createElement(ScrollLockHarness, {phase}));
    await Promise.resolve();
  });
}

describe('mobile scroll lock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
      configurable: true,
      value: true
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    document.body.style.overflow = 'clip';
    document.body.style.touchAction = 'pan-y';
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
      await Promise.resolve();
    });
    root = null;
    container?.remove();
    container = null;
    document.body.removeAttribute('style');
    vi.useRealTimers();
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  it('locks only during mobile transition phases', () => {
    expect(shouldLockMobilePageScroll('NORMAL')).toBe(false);
    expect(shouldLockMobilePageScroll('OPENING')).toBe(true);
    expect(shouldLockMobilePageScroll('OPEN')).toBe(false);
    expect(shouldLockMobilePageScroll('CLOSING')).toBe(true);
  });

  it('restores previous body styles across the mobile lifecycle', async () => {
    await renderPhase('NORMAL');
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.touchAction).toBe('pan-y');

    await renderPhase('OPENING');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.touchAction).toBe('none');

    await renderPhase('OPEN');
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.touchAction).toBe('pan-y');

    await renderPhase('CLOSING');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.touchAction).toBe('none');

    await renderPhase('NORMAL');
    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.touchAction).toBe('pan-y');
  });

  it('restores previous body styles when unmounted while locked', async () => {
    await renderPhase('OPENING');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.touchAction).toBe('none');

    await act(async () => {
      root?.unmount();
      await Promise.resolve();
    });

    expect(document.body.style.overflow).toBe('clip');
    expect(document.body.style.touchAction).toBe('pan-y');
  });
});
