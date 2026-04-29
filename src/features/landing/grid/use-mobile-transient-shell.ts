import {useCallback, useEffect, useRef, useState} from 'react';

import type {LandingCardMobileTransientMode} from '@/features/landing/grid/landing-grid-card';
import {
  MOBILE_EXPANDED_DURATION_MS,
  type LandingMobileLifecycleState
} from '@/features/landing/grid/mobile-lifecycle';

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

interface UseMobileTransientShellOutput {
  mobileTransientShellState: MobileTransientShellState;
  clearMobileTransientShellTimer: () => void;
  resetMobileTransientShell: () => void;
  startMobileTransientShell: (
    mode: Exclude<LandingCardMobileTransientMode, 'NONE'>,
    cardVariant: string,
    snapshot: NonNullable<LandingMobileLifecycleState['snapshot']>
  ) => void;
}

export function useMobileTransientShell(): UseMobileTransientShellOutput {
  const [mobileTransientShellState, setMobileTransientShellState] = useState<MobileTransientShellState>(
    initialMobileTransientShellState
  );
  const mobileTransientShellTimerRef = useRef<number | null>(null);

  const clearMobileTransientShellTimer = useCallback(() => {
    if (mobileTransientShellTimerRef.current !== null) {
      window.clearTimeout(mobileTransientShellTimerRef.current);
      mobileTransientShellTimerRef.current = null;
    }
  }, []);

  const resetMobileTransientShell = useCallback(() => {
    clearMobileTransientShellTimer();
    setMobileTransientShellState(initialMobileTransientShellState);
  }, [clearMobileTransientShellTimer]);

  const startMobileTransientShell = useCallback(
    (
      mode: Exclude<LandingCardMobileTransientMode, 'NONE'>,
      cardVariant: string,
      snapshot: NonNullable<LandingMobileLifecycleState['snapshot']>
    ) => {
      clearMobileTransientShellTimer();
      setMobileTransientShellState({
        mode,
        cardVariant,
        snapshot
      });
      mobileTransientShellTimerRef.current = window.setTimeout(() => {
        mobileTransientShellTimerRef.current = null;
        setMobileTransientShellState((current) =>
          current.mode === mode && current.cardVariant === cardVariant
            ? initialMobileTransientShellState
            : current
        );
      }, MOBILE_EXPANDED_DURATION_MS);
    },
    [clearMobileTransientShellTimer]
  );

  useEffect(() => {
    return () => {
      clearMobileTransientShellTimer();
    };
  }, [clearMobileTransientShellTimer]);

  return {
    mobileTransientShellState,
    clearMobileTransientShellTimer,
    resetMobileTransientShell,
    startMobileTransientShell
  };
}
