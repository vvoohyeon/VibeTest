'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef} from 'react';

import type {AppLocale} from '@/config/site';
import {trackLandingView, useTelemetryBootstrap} from '@/features/landing/telemetry/runtime';
import {terminatePendingLandingTransition} from '@/features/landing/transition/runtime';
import {
  clearLandingReturnScroll,
  readLandingReturnCardId,
  readLandingReturnScrollY,
  readPendingLandingTransition
} from '@/features/landing/transition/store';

interface LandingRuntimeProps {
  locale: AppLocale;
}

interface PendingReturnScrollRestore {
  pathname: string;
  scrollY: number;
  sourceCardId: string | null;
}

export function LandingRuntime({locale}: LandingRuntimeProps) {
  const pathname = usePathname();
  const telemetrySnapshot = useTelemetryBootstrap();
  const pendingReturnRestoreRef = useRef<PendingReturnScrollRestore | null>(null);

  useEffect(() => {
    if (pendingReturnRestoreRef.current?.pathname !== pathname) {
      const scrollY = readLandingReturnScrollY();
      pendingReturnRestoreRef.current =
        scrollY === null
          ? null
          : {
              pathname,
              scrollY,
              sourceCardId: readLandingReturnCardId()
            };
    }

    const pendingReturnRestore = pendingReturnRestoreRef.current;
    if (!pendingReturnRestore || pendingReturnRestore.pathname !== pathname) {
      return;
    }

    let frame = 0;
    let attempts = 0;
    let settledFrames = 0;

    const restoreScroll = () => {
      const sourceCardElement = pendingReturnRestore.sourceCardId
        ? document.querySelector<HTMLElement>(`[data-card-id="${pendingReturnRestore.sourceCardId}"]`)
        : null;
      const targetScrollTopFromCard = sourceCardElement
        ? Math.max(0, sourceCardElement.getBoundingClientRect().top + window.scrollY - 96)
        : null;
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextScrollTop = Math.min(targetScrollTopFromCard ?? pendingReturnRestore.scrollY, maxScrollTop);

      window.scrollTo({
        top: nextScrollTop,
        left: 0,
        behavior: 'auto'
      });

      attempts += 1;
      const didSettle = Math.abs(window.scrollY - nextScrollTop) <= 1;
      settledFrames = didSettle ? settledFrames + 1 : 0;

      if (settledFrames >= 2 || attempts >= 60) {
        clearLandingReturnScroll();
        pendingReturnRestoreRef.current = null;
        return;
      }

      if (attempts < 60) {
        frame = window.requestAnimationFrame(restoreScroll);
      }
    };

    frame = window.requestAnimationFrame(restoreScroll);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname]);

  useEffect(() => {
    const pendingTransition = readPendingLandingTransition();
    if (!pendingTransition) {
      return;
    }

    terminatePendingLandingTransition({
      locale,
      route: pathname,
      eventType: 'transition_cancel',
      resultReason: 'USER_CANCEL'
    });
  }, [locale, pathname]);

  useEffect(() => {
    if (!telemetrySnapshot.synced) {
      return;
    }

    trackLandingView({
      locale,
      route: pathname
    });
  }, [locale, pathname, telemetrySnapshot.synced]);

  return null;
}
