'use client';

import type {AppLocale} from '@/config/site';
import {
  trackTransitionStart,
  trackTransitionTerminal,
  createCorrelationId
} from '@/features/landing/telemetry/runtime';
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
    eventId: createCorrelationId('transition-start'),
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
      transitionId,
      createdAtMs: pendingTransition.startedAtMs,
      landingIngressFlag: true
    });
  }

  trackTransitionStart({
    locale: input.locale,
    route: input.route,
    transitionId,
    sourceCardId: input.sourceCardId,
    targetRoute: input.targetRoute
  });

  if (DUPLICATE_LOCALE_PATH_PATTERN.test(input.targetRoute)) {
    terminatePendingLandingTransition({
      locale: input.locale,
      route: input.route,
      eventType: 'transition_fail',
      resultReason: 'DUPLICATE_LOCALE'
    });
    return null;
  }

  return pendingTransition;
}

export function completePendingLandingTransition(input: {
  locale: AppLocale;
  route: string;
  targetType: 'test' | 'blog';
}): PendingLandingTransition | null {
  const pendingTransition = readPendingLandingTransition();
  if (!pendingTransition || pendingTransition.targetType !== input.targetType) {
    return null;
  }

  trackTransitionTerminal({
    eventType: 'transition_complete',
    locale: input.locale,
    route: input.route,
    transitionId: pendingTransition.transitionId,
    sourceCardId: pendingTransition.sourceCardId,
    targetRoute: pendingTransition.targetRoute
  });
  clearPendingLandingTransition();
  return pendingTransition;
}

export function terminatePendingLandingTransition(input: {
  locale: AppLocale;
  route: string;
  eventType: 'transition_fail' | 'transition_cancel';
  resultReason: LandingTransitionResultReason;
}): PendingLandingTransition | null {
  const pendingTransition = readPendingLandingTransition();
  if (!pendingTransition) {
    return null;
  }

  trackTransitionTerminal({
    eventType: input.eventType,
    locale: input.locale,
    route: input.route,
    transitionId: pendingTransition.transitionId,
    sourceCardId: pendingTransition.sourceCardId,
    targetRoute: pendingTransition.targetRoute,
    resultReason: input.resultReason
  });
  rollbackLandingTransition({variant: pendingTransition.variant});
  return pendingTransition;
}
