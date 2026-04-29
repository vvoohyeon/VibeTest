# Mobile Card Lifecycle Responsibility Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not use subagents in this session.

**Goal:** Split mobile landing card lifecycle side effects into focused hooks/modules while preserving the existing controller and grid contracts.

**Architecture:** Keep reducer ownership in `src/features/landing/grid/use-landing-interaction-controller.ts` and keep `useMobileCardLifecycle` as the same public orchestration hook. Move body scroll lock, backdrop gesture handling, DOM measurement, restore polling, and transient shell timer state into focused files under `src/features/landing/grid/`.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript 5.9.3, Vitest 3.2.4, Playwright 1.57.0.

---

## Approval Status

- Status: pending user approval.
- Implementation must not begin until the user explicitly approves this plan.
- TDD rule: no production code before the new failing tests are written and observed failing.

## Scope And Contracts

### Files To Create

- `src/features/landing/grid/use-mobile-scroll-lock.ts` - phase-based body scroll lock hook and helper.
- `src/features/landing/grid/use-mobile-backdrop-gesture.ts` - mobile backdrop pointer gesture state and handlers.
- `src/features/landing/grid/mobile-card-lifecycle-dom.ts` - mobile card snapshot capture and restore-settled measurement helpers.
- `src/features/landing/grid/use-mobile-restore-polling.ts` - restore-ready marker timer and requestAnimationFrame polling.
- `src/features/landing/grid/use-mobile-transient-shell.ts` - transient shell state and timer.
- `tests/unit/landing-mobile-scroll-lock.test.ts` - scroll lock helper/hook regression tests.
- `tests/unit/landing-mobile-backdrop-gesture.test.ts` - backdrop gesture regression tests.

### Files To Modify

- `src/features/landing/grid/use-mobile-card-lifecycle.ts` - compose the new hooks while preserving input shape, output shape, and behavior.
- `docs/project-analysis.md` - update Section 5.1 and Section 9 with the new split and final line counts.
- `AGENTS.md` - update the high-risk note for `use-mobile-card-lifecycle.ts` if final line count or ownership description changes.

### Relevant SSOT

- `docs/project-analysis.md` Section 5.1 and Section 9.
- `docs/req-landing.md` Section 7, Section 8.5, Section 9, Section 11.

### Required Field Checklist

- Shared shell/GNB affected: no.
- Localization affected: no.
- Accessibility affected: yes, indirectly through mobile keyboard handoff and focus continuity.
- State contracts affected: mobile lifecycle state only; no telemetry, consent, transition storage, route, locale, or storage key changes.
- Core user flow affected: yes, landing mobile card open/close and CTA reachability; destination routing/data unchanged.
- High-risk dimensions: usability, accessibility, responsiveness, performance, and design system consistency.
- Subagents: none, per session instruction. Regression coverage replaces subagent-level QA coverage.
- External packages: none.
- `landing-catalog-grid.tsx` call site: unchanged.
- `use-landing-interaction-controller.ts` behavior: unchanged. Type import remains available from `use-mobile-card-lifecycle.ts` via re-export.
- `MobileBackdropBindings` availability: preserved.
- Required final line target: `wc -l src/features/landing/grid/use-mobile-card-lifecycle.ts` must report `<= 300`.

### Decision Record

**Background:** `use-mobile-card-lifecycle.ts` is currently 543 lines and owns multiple timing-sensitive responsibilities that can be tested at narrower boundaries.

**Options considered:**

- Keep all side effects in one hook and only add tests.
- Move reducer ownership into a new mobile lifecycle controller.
- Keep the public lifecycle hook and split focused side effects into internal hooks/helpers.

**Choice made and why:** Keep the public lifecycle hook and split focused side effects into internal hooks/helpers. This preserves the existing controller call site and grid rendering contract while reducing the largest high-risk mobile file.

**Rejected options and why:**

- Keeping all side effects together leaves the responsibility problem unresolved.
- Moving reducer ownership would violate the requirement that `use-landing-interaction-controller.ts` keeps reducer ownership.

**Impact:** New unit tests cover extracted behavior first; implementation changes stay inside the landing grid module. Docs are updated after measured line counts are known.

## Target Interfaces

```ts
// src/features/landing/grid/use-mobile-scroll-lock.ts
import {useEffect} from 'react';

import type {LandingCardMobilePhase} from '@/features/landing/grid/landing-grid-card';

export function shouldLockMobilePageScroll(phase: LandingCardMobilePhase): boolean {
  return phase === 'OPENING' || phase === 'CLOSING';
}

export function useMobileScrollLock(phase: LandingCardMobilePhase): void {
  const shouldLock = shouldLockMobilePageScroll(phase);

  useEffect(() => {
    if (!shouldLock) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [shouldLock]);
}
```

```ts
// src/features/landing/grid/use-mobile-backdrop-gesture.ts
import type {Dispatch, PointerEvent as ReactPointerEvent} from 'react';
import {useCallback, useRef} from 'react';

import type {LandingCardMobilePhase} from '@/features/landing/grid/landing-grid-card';
import type {LandingMobileLifecycleEvent} from '@/features/landing/grid/mobile-lifecycle';

const MOBILE_OUTSIDE_SCROLL_THRESHOLD_PX = 10;

interface OutsideGesture {
  active: boolean;
  startX: number;
  startY: number;
  closeOnPointerUp: boolean;
}

export interface MobileBackdropBindings {
  active: boolean;
  state: LandingCardMobilePhase | 'HIDDEN';
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

interface UseMobileBackdropGestureInput {
  isMobileViewport: boolean;
  phase: LandingCardMobilePhase;
  beginMobileClose: () => void;
  dispatchMobileLifecycle: Dispatch<LandingMobileLifecycleEvent>;
}

export function shouldCancelOutsideCloseAsScroll(input: OutsideGesture, event: ReactPointerEvent<HTMLDivElement>) {
  return (
    Math.abs(event.clientX - input.startX) > MOBILE_OUTSIDE_SCROLL_THRESHOLD_PX ||
    Math.abs(event.clientY - input.startY) > MOBILE_OUTSIDE_SCROLL_THRESHOLD_PX
  );
}

export function useMobileBackdropGesture({
  isMobileViewport,
  phase,
  beginMobileClose,
  dispatchMobileLifecycle
}: UseMobileBackdropGestureInput): MobileBackdropBindings {
  const outsideGestureRef = useRef<OutsideGesture>({
    active: false,
    startX: 0,
    startY: 0,
    closeOnPointerUp: false
  });

  const resetOutsideGesture = useCallback(() => {
    outsideGestureRef.current.active = false;
    outsideGestureRef.current.closeOnPointerUp = false;
  }, []);

  return {
    active: isMobileViewport && phase !== 'NORMAL',
    state: isMobileViewport && phase !== 'NORMAL' ? phase : 'HIDDEN',
    onPointerDown: (event) => {
      if (!isMobileViewport || phase === 'NORMAL') {
        return;
      }

      outsideGestureRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        closeOnPointerUp: phase === 'OPEN'
      };

      if (phase === 'OPENING') {
        beginMobileClose();
      }
    },
    onPointerMove: (event) => {
      if (!outsideGestureRef.current.active) {
        return;
      }

      if (shouldCancelOutsideCloseAsScroll(outsideGestureRef.current, event)) {
        resetOutsideGesture();
        if (phase === 'OPENING') {
          dispatchMobileLifecycle({type: 'QUEUE_CLOSE_CANCEL'});
        }
      }
    },
    onPointerUp: () => {
      const shouldClose = outsideGestureRef.current.active && outsideGestureRef.current.closeOnPointerUp;
      resetOutsideGesture();
      if (shouldClose) {
        beginMobileClose();
      }
    },
    onPointerCancel: resetOutsideGesture
  };
}
```

## Task 1: RED - Add Scroll Lock Tests

**Files:**

- Create: `tests/unit/landing-mobile-scroll-lock.test.ts`
- No production files in this task.

- [ ] **Step 1: Write the failing test**

```ts
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
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/landing-mobile-scroll-lock.test.ts`

Expected: FAIL because `src/features/landing/grid/use-mobile-scroll-lock.ts` does not exist.

## Task 2: RED - Add Backdrop Gesture Tests

**Files:**

- Create: `tests/unit/landing-mobile-backdrop-gesture.test.ts`
- No production files in this task.

- [ ] **Step 1: Write the failing test**

```ts
// @vitest-environment jsdom

import type {PointerEvent as ReactPointerEvent} from 'react';
import React, {act, useEffect} from 'react';
import type {Root} from 'react-dom/client';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {LandingCardMobilePhase} from '../../src/features/landing/grid/landing-grid-card';
import type {LandingMobileLifecycleEvent} from '../../src/features/landing/grid/mobile-lifecycle';
import {
  type MobileBackdropBindings,
  useMobileBackdropGesture
} from '../../src/features/landing/grid/use-mobile-backdrop-gesture';

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let bindings: MobileBackdropBindings | null = null;

function pointer(clientX: number, clientY: number) {
  return {clientX, clientY} as ReactPointerEvent<HTMLDivElement>;
}

function BackdropGestureHarness({
  isMobileViewport,
  phase,
  beginMobileClose,
  dispatchMobileLifecycle
}: {
  isMobileViewport: boolean;
  phase: LandingCardMobilePhase;
  beginMobileClose: () => void;
  dispatchMobileLifecycle: React.Dispatch<LandingMobileLifecycleEvent>;
}) {
  const nextBindings = useMobileBackdropGesture({
    isMobileViewport,
    phase,
    beginMobileClose,
    dispatchMobileLifecycle
  });

  useEffect(() => {
    bindings = nextBindings;
  }, [nextBindings]);

  return null;
}

async function renderGesture(props: {
  isMobileViewport?: boolean;
  phase: LandingCardMobilePhase;
  beginMobileClose?: () => void;
  dispatchMobileLifecycle?: React.Dispatch<LandingMobileLifecycleEvent>;
}) {
  const beginMobileClose = props.beginMobileClose ?? vi.fn();
  const dispatchMobileLifecycle = props.dispatchMobileLifecycle ?? vi.fn();

  await act(async () => {
    root?.render(
      React.createElement(BackdropGestureHarness, {
        isMobileViewport: props.isMobileViewport ?? true,
        phase: props.phase,
        beginMobileClose,
        dispatchMobileLifecycle
      })
    );
    await Promise.resolve();
  });

  return {beginMobileClose, dispatchMobileLifecycle};
}

describe('mobile backdrop gesture', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    bindings = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
      await Promise.resolve();
    });
    root = null;
    container?.remove();
    container = null;
    bindings = null;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  it('is inactive and no-ops outside the mobile active phases', async () => {
    const {beginMobileClose, dispatchMobileLifecycle} = await renderGesture({
      isMobileViewport: false,
      phase: 'OPEN'
    });

    expect(bindings?.active).toBe(false);
    expect(bindings?.state).toBe('HIDDEN');

    bindings?.onPointerDown(pointer(0, 0));
    bindings?.onPointerMove(pointer(20, 0));
    bindings?.onPointerUp();
    bindings?.onPointerCancel();

    expect(beginMobileClose).not.toHaveBeenCalled();
    expect(dispatchMobileLifecycle).not.toHaveBeenCalled();
  });

  it('closes once for an OPEN outside pointer down and up', async () => {
    const {beginMobileClose} = await renderGesture({phase: 'OPEN'});

    expect(bindings?.active).toBe(true);
    expect(bindings?.state).toBe('OPEN');

    bindings?.onPointerDown(pointer(10, 10));
    bindings?.onPointerUp();
    bindings?.onPointerUp();

    expect(beginMobileClose).toHaveBeenCalledTimes(1);
  });

  it('cancels the OPEN close when outside movement exceeds the scroll threshold', async () => {
    const {beginMobileClose} = await renderGesture({phase: 'OPEN'});

    bindings?.onPointerDown(pointer(10, 10));
    bindings?.onPointerMove(pointer(10, 21));
    bindings?.onPointerUp();

    expect(beginMobileClose).not.toHaveBeenCalled();
  });

  it('queues OPENING close and cancels the queue when movement becomes scroll', async () => {
    const beginMobileClose = vi.fn();
    const dispatchMobileLifecycle = vi.fn();
    await renderGesture({
      phase: 'OPENING',
      beginMobileClose,
      dispatchMobileLifecycle
    });

    bindings?.onPointerDown(pointer(5, 5));
    expect(beginMobileClose).toHaveBeenCalledTimes(1);

    bindings?.onPointerMove(pointer(16, 5));
    bindings?.onPointerUp();

    expect(dispatchMobileLifecycle).toHaveBeenCalledWith({type: 'QUEUE_CLOSE_CANCEL'});
    expect(beginMobileClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/landing-mobile-backdrop-gesture.test.ts`

Expected: FAIL because `src/features/landing/grid/use-mobile-backdrop-gesture.ts` does not exist.

## Task 3: GREEN - Extract Scroll Lock

**Files:**

- Create: `src/features/landing/grid/use-mobile-scroll-lock.ts`
- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Add the scroll lock module**

Add `use-mobile-scroll-lock.ts` with the exact API shown in "Target Interfaces".

- [ ] **Step 2: Compose it in `useMobileCardLifecycle`**

Replace the local `shouldLockMobilePageScroll` function and body scroll-lock `useEffect` with:

```ts
import {useMobileScrollLock} from '@/features/landing/grid/use-mobile-scroll-lock';

// inside useMobileCardLifecycle
useMobileScrollLock(mobileLifecycleState.phase);
```

- [ ] **Step 3: Run targeted scroll lock test**

Run: `npm test -- tests/unit/landing-mobile-scroll-lock.test.ts`

Expected: PASS.

## Task 4: GREEN - Extract Backdrop Gesture

**Files:**

- Create: `src/features/landing/grid/use-mobile-backdrop-gesture.ts`
- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Add the backdrop gesture module**

Add `use-mobile-backdrop-gesture.ts` with the exact API shown in "Target Interfaces".

- [ ] **Step 2: Preserve the existing type import path**

In `use-mobile-card-lifecycle.ts`, re-export `MobileBackdropBindings`:

```ts
export type {MobileBackdropBindings} from '@/features/landing/grid/use-mobile-backdrop-gesture';
```

- [ ] **Step 3: Compose backdrop bindings**

Remove the local `OutsideGesture` type, `MOBILE_OUTSIDE_SCROLL_THRESHOLD_PX`, `outsideGestureRef`, `shouldCancelOutsideCloseAsScroll`, and inline `mobileBackdropBindings` object from `use-mobile-card-lifecycle.ts`.

Use:

```ts
const mobileBackdropBindings = useMobileBackdropGesture({
  isMobileViewport,
  phase: mobileLifecycleState.phase,
  beginMobileClose,
  dispatchMobileLifecycle
});
```

- [ ] **Step 4: Run targeted backdrop test**

Run: `npm test -- tests/unit/landing-mobile-backdrop-gesture.test.ts`

Expected: PASS.

## Task 5: Extract DOM Measurement Helpers

**Files:**

- Create: `src/features/landing/grid/mobile-card-lifecycle-dom.ts`
- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Move snapshot capture**

Create:

```ts
import type {LandingMobileSnapshot} from '@/features/landing/grid/mobile-lifecycle';

export function captureMobileSnapshot(shellElement: HTMLElement | null, cardVariant: string): LandingMobileSnapshot {
  if (!shellElement) {
    return {
      cardHeightPx: 0,
      anchorTopPx: 0,
      cardLeftPx: 0,
      cardWidthPx: 0,
      titleTopPx: 0
    };
  }

  const cardElement = shellElement.querySelector<HTMLElement>(
    `[data-testid="landing-grid-card"][data-card-variant="${cardVariant}"]`
  );
  const titleElement = cardElement?.querySelector<HTMLElement>('[data-slot="cardTitle"]');
  const cardRect = cardElement?.getBoundingClientRect();
  const titleRect = titleElement?.getBoundingClientRect();

  return {
    cardHeightPx: cardRect?.height ?? 0,
    anchorTopPx: cardRect?.top ?? 0,
    cardLeftPx: cardRect?.left ?? 0,
    cardWidthPx: cardRect?.width ?? 0,
    titleTopPx: titleRect?.top ?? cardRect?.top ?? 0
  };
}
```

- [ ] **Step 2: Move restore-settled measurement**

Create:

```ts
export function isMobileSnapshotRestoreSettled(
  shellElement: HTMLElement | null,
  cardVariant: string,
  snapshot: LandingMobileSnapshot
): boolean {
  const cardElement = shellElement?.querySelector<HTMLElement>(
    `[data-testid="landing-grid-card"][data-card-variant="${cardVariant}"]`
  );
  const titleElement = cardElement?.querySelector<HTMLElement>('[data-slot="cardTitle"]');
  const cardRect = cardElement?.getBoundingClientRect();
  const titleRect = titleElement?.getBoundingClientRect();

  const heightSettled = Math.abs((cardRect?.height ?? 0) - snapshot.cardHeightPx) <= 1;
  const snapshotTitleOffset = snapshot.titleTopPx - snapshot.anchorTopPx;
  const currentTitleOffset = (titleRect?.top ?? cardRect?.top ?? 0) - (cardRect?.top ?? 0);
  const titleSettled = Math.abs(currentTitleOffset - snapshotTitleOffset) <= 1;

  return heightSettled && titleSettled;
}
```

- [ ] **Step 3: Import helpers in lifecycle hook**

Use `captureMobileSnapshot` in `beginMobileOpen` and `beginMobileClose`.

- [ ] **Step 4: Run existing mobile lifecycle test**

Run: `npm test -- tests/unit/landing-mobile-lifecycle.test.ts`

Expected: PASS.

## Task 6: Extract Restore Polling

**Files:**

- Create: `src/features/landing/grid/use-mobile-restore-polling.ts`
- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Move restore-ready timer and RAF polling**

Create a hook that owns:

```ts
const MOBILE_RESTORE_READY_MARKER_MS = 400;
const MOBILE_RESTORE_POLLING_MAX_ATTEMPTS = 30;

export function useMobileRestorePolling({
  shellRef,
  dispatchMobileLifecycle
}: {
  shellRef: RefObject<HTMLElement | null>;
  dispatchMobileLifecycle: Dispatch<LandingMobileLifecycleEvent>;
}) {
  // returns:
  // mobileRestoreReadyVariant
  // clearMobileRestoreReadyTimer
  // resetMobileRestoreReadyVariant
  // markMobileRestoreReady
  // settleMobileCloseAfterRestore
}
```

Implementation rules:

- `markMobileRestoreReady(cardVariant)` clears the previous marker timer, sets the marker variant, schedules the 400ms clear timer, and dispatches `{type: 'RESTORE_READY'}`.
- `settleMobileCloseAfterRestore(cardVariant, snapshot)` polls by `requestAnimationFrame` until `isMobileSnapshotRestoreSettled(...)` is true or 30 attempts are reached.
- After restore is ready, schedule one RAF and dispatch `{type: 'CLOSE_SETTLED'}`.
- The returned cleanup cancels the active RAF when present.

- [ ] **Step 2: Compose the hook**

Remove `mobileRestoreReadyVariant` local state and `mobileRestoreReadyTimerRef` from `use-mobile-card-lifecycle.ts`.

Use the extracted hook for:

- open reset: `resetMobileRestoreReadyVariant()`
- keyboard handoff reset: `resetMobileRestoreReadyVariant()`
- closing fallback without snapshot: `markMobileRestoreReady(cardVariant)`
- polling path with snapshot: `settleMobileCloseAfterRestore(cardVariant, snapshot)`

- [ ] **Step 3: Run lifecycle tests**

Run: `npm test -- tests/unit/landing-mobile-lifecycle.test.ts tests/unit/landing-mobile-scroll-lock.test.ts tests/unit/landing-mobile-backdrop-gesture.test.ts`

Expected: PASS.

## Task 7: Extract Transient Shell State

**Files:**

- Create: `src/features/landing/grid/use-mobile-transient-shell.ts`
- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Move transient shell state and timer**

Create:

```ts
import {useCallback, useRef, useState} from 'react';

import type {LandingCardMobileTransientMode} from '@/features/landing/grid/landing-grid-card';
import {MOBILE_EXPANDED_DURATION_MS, type LandingMobileLifecycleState} from '@/features/landing/grid/mobile-lifecycle';

export interface MobileTransientShellState {
  mode: LandingCardMobileTransientMode;
  cardVariant: string | null;
  snapshot: LandingMobileLifecycleState['snapshot'];
}

export const initialMobileTransientShellState: MobileTransientShellState = {
  mode: 'NONE',
  cardVariant: null,
  snapshot: null
};

export function useMobileTransientShell() {
  // returns:
  // mobileTransientShellState
  // clearMobileTransientShellTimer
  // resetMobileTransientShell
  // startMobileTransientShell
}
```

Implementation rules:

- `startMobileTransientShell(mode, cardVariant, snapshot)` preserves the current 280ms timeout behavior.
- The timeout clears only if the current mode/card still match the started transition.
- `resetMobileTransientShell()` clears the timer and restores `initialMobileTransientShellState`.

- [ ] **Step 2: Preserve lifecycle output type**

In `use-mobile-card-lifecycle.ts`, import `MobileTransientShellState` from the new hook and keep the existing output field name `mobileTransientShellState`.

- [ ] **Step 3: Run lifecycle tests**

Run: `npm test -- tests/unit/landing-mobile-lifecycle.test.ts tests/unit/landing-mobile-scroll-lock.test.ts tests/unit/landing-mobile-backdrop-gesture.test.ts`

Expected: PASS.

## Task 8: Tighten Lifecycle Composition And Verify Line Count

**Files:**

- Modify: `src/features/landing/grid/use-mobile-card-lifecycle.ts`

- [ ] **Step 1: Reduce the hook to orchestration only**

Keep these responsibilities in `use-mobile-card-lifecycle.ts`:

- open/close lifecycle orchestration
- queued close through `beginMobileClose`
- keyboard handoff
- viewport reset
- return API
- timer coordination for open/close timers

Do not change:

- `UseMobileCardLifecycleInput`
- `UseMobileCardLifecycleOutput`
- `useMobileCardLifecycle(...)` call site
- return field names
- `OPENING -> OPEN -> CLOSING -> NORMAL` order
- `MobileBackdropBindings` availability from `use-mobile-card-lifecycle.ts`

- [ ] **Step 2: Verify line count**

Run: `wc -l src/features/landing/grid/use-mobile-card-lifecycle.ts`

Expected: first column is `300` or lower.

- [ ] **Step 3: Run targeted unit tests**

Run: `npm test -- tests/unit/landing-mobile-scroll-lock.test.ts tests/unit/landing-mobile-backdrop-gesture.test.ts tests/unit/landing-mobile-lifecycle.test.ts`

Expected: PASS.

## Task 9: Documentation Updates

**Files:**

- Modify: `docs/project-analysis.md`
- Modify: `AGENTS.md` if measured high-risk line count or responsibility description changes.

- [ ] **Step 1: Update `docs/project-analysis.md` Section 5.1**

Record the new responsibility split under "Runtime ownership" with measured line counts from `wc -l`.

Required content:

- `use-mobile-card-lifecycle.ts` now owns mobile lifecycle orchestration, queued close, keyboard handoff, viewport reset, and public API composition.
- `use-mobile-scroll-lock.ts` owns phase-based body scroll lock.
- `use-mobile-backdrop-gesture.ts` owns outside gesture state and pointer handlers.
- `mobile-card-lifecycle-dom.ts` owns snapshot and restore measurement helpers.
- `use-mobile-restore-polling.ts` owns restore-ready marker and RAF polling.
- `use-mobile-transient-shell.ts` owns transient shell state and timer.

- [ ] **Step 2: Update `docs/project-analysis.md` Section 9**

Replace the `use-mobile-card-lifecycle.ts` 543-line pressure-point note with the measured new count and the extracted mobile helper set.

- [ ] **Step 3: Update `AGENTS.md` high-risk note**

If the measured lifecycle hook line count or ownership description changed, update the `src/features/landing/grid/use-mobile-card-lifecycle.ts` bullet under "High-Risk Areas".

- [ ] **Step 4: Run documentation-specific verification**

Run: `wc -l src/features/landing/grid/use-mobile-card-lifecycle.ts src/features/landing/grid/use-landing-interaction-controller.ts src/features/landing/grid/use-keyboard-handoff.ts`

Expected: docs line counts match command output.

## Task 10: Landing Grid Scope Verification

**Files:**

- No code edits in this task.

- [ ] **Step 1: Run targeted new and existing unit tests**

Run: `npm test -- tests/unit/landing-mobile-scroll-lock.test.ts tests/unit/landing-mobile-backdrop-gesture.test.ts tests/unit/landing-mobile-lifecycle.test.ts`

Expected: PASS.

- [ ] **Step 2: Run landing grid QA scripts**

Run these commands in order:

```bash
node scripts/qa/check-phase4-grid-contracts.mjs
node scripts/qa/check-phase5-card-contracts.mjs
node scripts/qa/check-phase6-spacing-contracts.mjs
node scripts/qa/check-phase7-state-contracts.mjs
node scripts/qa/check-phase8-accessibility-contracts.mjs
node scripts/qa/check-phase9-performance-contracts.mjs
node scripts/qa/check-phase10-transition-contracts.mjs
```

Expected: each command exits `0`.

- [ ] **Step 3: Run landing grid E2E smoke**

Run: `npx playwright test tests/e2e/state-smoke.spec.ts tests/e2e/grid-smoke.spec.ts`

Expected: PASS.

## Task 11: Final Gates

**Files:**

- No code edits in this task.

- [ ] **Step 1: Run basic gates**

Run in order:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: every command exits `0`.

- [ ] **Step 2: Inspect final diff**

Run: `git diff --stat && git diff -- src/features/landing/grid/use-mobile-card-lifecycle.ts`

Expected:

- production changes are limited to approved landing grid files.
- tests are limited to approved unit test files.
- docs changes are limited to approved docs files.
- no route, locale, storage key, telemetry, consent, transition storage, build config, or external package changes.

## Execution Notes

- Implement one task at a time.
- Watch each new test fail before adding production code.
- Keep all changes surgical; do not reformat unrelated code.
- If preserving the external contract requires changing `landing-catalog-grid.tsx` or the controller call site, stop and re-confirm before continuing.
- If an implementation cannot keep `use-mobile-card-lifecycle.ts` at or below 300 lines, stop after tests pass and re-confirm the line-count target before adding additional abstractions.
