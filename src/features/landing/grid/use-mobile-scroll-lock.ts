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
