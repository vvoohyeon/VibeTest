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

export function shouldCancelOutsideCloseAsScroll(
  input: OutsideGesture,
  event: ReactPointerEvent<HTMLDivElement>
): boolean {
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
