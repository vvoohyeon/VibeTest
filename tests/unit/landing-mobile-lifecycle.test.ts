import {describe, expect, it} from 'vitest';

import {
  initialLandingMobileLifecycleState,
  MOBILE_EXPANDED_DURATION_MS,
  reduceLandingMobileLifecycleState
} from '../../src/features/landing/grid/mobile-lifecycle';

describe('landing mobile lifecycle reducer', () => {
  it('uses the fixed mobile duration contract', () => {
    expect(MOBILE_EXPANDED_DURATION_MS).toBe(280);
  });

  it('queues close during OPENING and settles back to NORMAL after close', () => {
    const opening = reduceLandingMobileLifecycleState(initialLandingMobileLifecycleState, {
      type: 'OPEN_START',
      cardId: 'test-rhythm-a',
      snapshot: {
        cardHeightPx: 200,
        anchorTopPx: 32,
        titleTopPx: 32
      }
    });
    const queued = reduceLandingMobileLifecycleState(opening, {type: 'QUEUE_CLOSE'});
    const closing = reduceLandingMobileLifecycleState(queued, {type: 'OPEN_SETTLED'});
    const normal = reduceLandingMobileLifecycleState(closing, {type: 'CLOSE_SETTLED'});

    expect(opening.phase).toBe('OPENING');
    expect(queued.queuedClose).toBe(true);
    expect(closing.phase).toBe('CLOSING');
    expect(normal).toEqual(initialLandingMobileLifecycleState);
  });

  it('ignores close-start when not OPEN', () => {
    expect(
      reduceLandingMobileLifecycleState(initialLandingMobileLifecycleState, {
        type: 'CLOSE_START'
      })
    ).toEqual(initialLandingMobileLifecycleState);
  });
});
