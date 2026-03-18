'use client';

import type {AppLocale} from '@/config/site';
import {createCorrelationId} from '@/features/landing/lib/correlation-id';
import {trackCardAnswered} from '@/features/landing/telemetry/runtime';
import {emitLandingTransitionSignal} from '@/features/landing/transition/signals';
import {
  clearPendingLandingTransition,
  readPendingLandingTransition,
  rollbackLandingTransition,
  saveLandingReturnScrollY,
  type LandingTransitionResultReason,
  type PendingLandingTransition,
  writeLandingIngress,
  writePendingLandingTransition
} from '@/features/landing/transition/store';

const DUPLICATE_LOCALE_PATH_PATTERN = /\/(en|kr)\/(en|kr)(\/|$)/u;

interface BeginLandingTransitionInput {
  locale: AppLocale;
  route: string;
  sourceCardId: string;
  targetType: 'test' | 'blog';
  targetRoute: string;
  variant?: string;
  blogArticleId?: string;
  preAnswerChoice?: 'A' | 'B';
}

export function beginLandingTransition(input: BeginLandingTransitionInput): PendingLandingTransition | null {
  const transitionId = createCorrelationId('transition');
  const pendingTransition: PendingLandingTransition = {
    transitionId,
    sourceCardId: input.sourceCardId,
    targetRoute: input.targetRoute,
    targetType: input.targetType,
    startedAtMs: Date.now(),
    variant: input.variant,
    blogArticleId: input.blogArticleId,
    preAnswerChoice: input.preAnswerChoice
  };

  writePendingLandingTransition(pendingTransition);
  if (typeof window !== 'undefined') {
    saveLandingReturnScrollY(window.scrollY, input.sourceCardId);
  }

  if (input.targetType === 'test' && input.variant && input.preAnswerChoice) {
    writeLandingIngress({
      variant: input.variant,
      preAnswerChoice: input.preAnswerChoice,
      createdAtMs: pendingTransition.startedAtMs,
      landingIngressFlag: true
    });

    trackCardAnswered({
      locale: input.locale,
      route: input.route,
      sourceCardId: input.sourceCardId,
      targetRoute: input.targetRoute
    });
  }

  emitLandingTransitionSignal({
    signal: 'transition_start',
    transitionId,
    sourceCardId: input.sourceCardId,
    targetRoute: input.targetRoute
  });

  if (DUPLICATE_LOCALE_PATH_PATTERN.test(input.targetRoute)) {
    terminatePendingLandingTransition({
      signal: 'transition_fail',
      resultReason: 'DUPLICATE_LOCALE'
    });
    return null;
  }

  return pendingTransition;
}

export function completePendingLandingTransition(input: {
  targetType: 'test' | 'blog';
}): PendingLandingTransition | null {
  const pendingTransition = readPendingLandingTransition();
  if (!pendingTransition || pendingTransition.targetType !== input.targetType) {
    return null;
  }

  emitLandingTransitionSignal({
    signal: 'transition_complete',
    transitionId: pendingTransition.transitionId,
    sourceCardId: pendingTransition.sourceCardId,
    targetRoute: pendingTransition.targetRoute
  });
  clearPendingLandingTransition();
  return pendingTransition;
}

export function terminatePendingLandingTransition(input: {
  signal: 'transition_fail' | 'transition_cancel';
  resultReason: LandingTransitionResultReason;
}): PendingLandingTransition | null {
  const pendingTransition = readPendingLandingTransition();
  if (!pendingTransition) {
    return null;
  }

  emitLandingTransitionSignal({
    signal: input.signal,
    transitionId: pendingTransition.transitionId,
    sourceCardId: pendingTransition.sourceCardId,
    targetRoute: pendingTransition.targetRoute,
    resultReason: input.resultReason
  });
  rollbackLandingTransition({variant: pendingTransition.variant});
  return pendingTransition;
}
