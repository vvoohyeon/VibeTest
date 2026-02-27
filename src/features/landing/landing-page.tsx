'use client';

import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {createPortal} from 'react-dom';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CatalogCardView} from '@/features/landing/components/catalog-card';
import {SiteHeader} from '@/features/landing/components/site-header';
import {
  getCatalogCards,
  getCatalogLayoutConfig,
  splitHeroAndMainCards
} from '@/features/landing/data/landing-adapter';
import {
  clearPendingTransition,
  consumeLandingScrollY,
  getOrCreateSessionId,
  getPendingTransition,
  rollbackPreAnswer,
  saveLandingScrollY,
  savePreAnswer,
  setLandingIngressFlag,
  setPendingTransition
} from '@/features/landing/session-state';
import {useContainerWidth} from '@/features/landing/hooks/use-container-width';
import {useInteractionMode} from '@/features/landing/hooks/use-interaction-mode';
import {usePageState} from '@/features/landing/hooks/use-page-state';
import {useTelemetry} from '@/features/telemetry/telemetry-provider';
import type {CatalogCard} from '@/features/landing/types';
import {lockBodyScroll, unlockBodyScroll} from '@/lib/body-lock';
import {
  buildBlogRouteWithSource,
  buildTestQuestionRoute,
  hasDuplicateLocaleSegment,
  hasLocalePrefix,
} from '@/lib/route-builder';
import styles from './landing-page.module.css';

const ROUTE_TIMEOUT_MS = 4500;
const TRANSITION_PUSH_DELAY_MS = 180;
const MOBILE_CLOSE_UNLOCK_MS = 240;
const ACTIVE_RAMP_LOCK_MS = 140;
const HOVER_EXPAND_DELAY_MS = 150;

type ForcedTransitionOutcome = 'cancel' | 'locale_duplicate' | 'route_entry_timeout';

type OverlayPlacement = {
  top: number;
  left: number;
  width: number;
};

function readE2EForcedTransitionOutcome(): ForcedTransitionOutcome | null {
  if (typeof window === 'undefined' || !window.navigator.webdriver) {
    return null;
  }

  const forced = new URLSearchParams(window.location.search).get('__e2e_transition_outcome');
  if (forced === 'cancel' || forced === 'locale_duplicate' || forced === 'route_entry_timeout') {
    return forced;
  }

  return null;
}

function getOrigin(index: number, columns: number): '0%' | '50%' | '100%' {
  if (columns <= 1) {
    return '50%';
  }

  const columnIndex = index % columns;

  if (columnIndex === 0) {
    return '0%';
  }

  if (columnIndex === columns - 1) {
    return '100%';
  }

  return '50%';
}

function createTransitionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
}

export function LandingPage() {
  const t = useTranslations('landing');
  const router = useRouter();
  const {emit} = useTelemetry();

  const cards = useMemo(() => getCatalogCards(), []);
  const capability = useInteractionMode();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const slotElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const cardElementsRef = useRef<Record<string, HTMLElement | null>>({});

  const containerWidth = useContainerWidth(containerRef);
  const layout = useMemo(() => getCatalogLayoutConfig(containerWidth || capability.width), [capability.width, containerWidth]);
  const {heroCards, mainCards} = useMemo(
    () => splitHeroAndMainCards(cards, layout.heroCount),
    [cards, layout.heroCount]
  );

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedOverlayPlacement, setExpandedOverlayPlacement] = useState<OverlayPlacement | null>(null);
  const [unavailableOverlayCardId, setUnavailableOverlayCardId] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [activeRampLocked, setActiveRampLocked] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);
  const [keyboardModeActive, setKeyboardModeActive] = useState(false);
  const [desktopOverlayHost, setDesktopOverlayHost] = useState<HTMLDivElement | null>(null);

  const routeTimeoutRef = useRef<number | null>(null);
  const activeRampTimerRef = useRef<number | null>(null);
  const hoverIntentTimerRef = useRef<number | null>(null);
  const hoverIntentTokenRef = useRef(0);
  const hoverIntentCardIdRef = useRef<string | null>(null);
  const handoffCardIdRef = useRef<string | null>(null);
  const hadInactiveSinceMountRef = useRef(false);

  const [normalHeights, setNormalHeights] = useState<Record<string, number>>({});
  const [normalHeightsReady, setNormalHeightsReady] = useState(false);

  const pageState = usePageState(transitioning);
  const shouldIgnorePageInput = transitioning || pageState === 'INACTIVE' || activeRampLocked;
  const isDesktopTablet = capability.width >= 768;
  const isDesktopHoverMode = capability.mode === 'HOVER_MODE' && capability.width >= 768;

  const hoverLockTargetId =
    isDesktopHoverMode && pageState !== 'INACTIVE'
      ? expandedCardId ?? unavailableOverlayCardId
      : null;

  const lockOthers = Boolean(hoverLockTargetId);
  const isHoverLockActive =
    lockOthers &&
    capability.mode === 'HOVER_MODE' &&
    capability.width >= 768 &&
    pageState !== 'INACTIVE';

  const cardGridMeta = useMemo(() => {
    const meta = new Map<string, {index: number; columns: number}>();

    heroCards.forEach((card, index) => {
      meta.set(card.id, {index, columns: layout.heroColumns});
    });

    mainCards.forEach((card, index) => {
      meta.set(card.id, {index, columns: layout.mainColumns});
    });

    return meta;
  }, [heroCards, layout.heroColumns, layout.mainColumns, mainCards]);

  const clearHoverIntentTimer = useCallback(() => {
    if (hoverIntentTimerRef.current) {
      window.clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  }, []);

  const resetHoverIntentState = useCallback(() => {
    clearHoverIntentTimer();
    hoverIntentTokenRef.current += 1;
    hoverIntentCardIdRef.current = null;
    handoffCardIdRef.current = null;
  }, [clearHoverIntentTimer]);

  const computeOverlayPlacement = useCallback(
    (cardId: string): OverlayPlacement | null => {
      if (capability.width < 768) {
        return null;
      }

      const slotElement = slotElementsRef.current[cardId];
      const contentElement = contentRef.current;

      if (!slotElement || !contentElement) {
        return null;
      }

      const slotRect = slotElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();

      return {
        top: Math.round(slotRect.top - contentRect.top),
        left: Math.round(slotRect.left - contentRect.left),
        width: Math.round(slotRect.width)
      };
    },
    [capability.width]
  );

  const commitExpand = useCallback(
    (cardId: string): boolean => {
      if (shouldIgnorePageInput) {
        return false;
      }

      if (capability.width >= 768 && !normalHeightsReady) {
        return false;
      }

      setUnavailableOverlayCardId(null);

      if (capability.width >= 768) {
        const placement = computeOverlayPlacement(cardId);

        if (!placement) {
          return false;
        }

        setExpandedOverlayPlacement(placement);
      }

      setExpandedCardId(cardId);
      return true;
    },
    [capability.width, computeOverlayPlacement, normalHeightsReady, shouldIgnorePageInput]
  );

  useEffect(() => {
    getOrCreateSessionId();
    emit('landing_view');
  }, [emit]);

  useEffect(() => {
    const restored = consumeLandingScrollY();
    if (typeof restored !== 'number') {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: restored,
        left: 0,
        behavior: 'auto'
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (capability.width < 768) {
      setKeyboardModeActive(false);
      return;
    }

    const enterKeyboardMode = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setKeyboardModeActive(true);
      }
    };

    const exitKeyboardMode = () => {
      setKeyboardModeActive((prev) => (prev ? false : prev));
    };

    window.addEventListener('keydown', enterKeyboardMode);
    window.addEventListener('pointermove', exitKeyboardMode, {passive: true});
    window.addEventListener('mousedown', exitKeyboardMode);
    window.addEventListener('wheel', exitKeyboardMode, {passive: true});

    return () => {
      window.removeEventListener('keydown', enterKeyboardMode);
      window.removeEventListener('pointermove', exitKeyboardMode);
      window.removeEventListener('mousedown', exitKeyboardMode);
      window.removeEventListener('wheel', exitKeyboardMode);
    };
  }, [capability.width]);

  const cancelTransition = useCallback(
    (params: {transitionId: string; reason: string; variant?: string}) => {
      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
        routeTimeoutRef.current = null;
      }

      emit('transition_cancel', {
        transitionId: params.transitionId,
        reason: params.reason
      });

      if (params.variant) {
        rollbackPreAnswer(params.variant, params.transitionId);
      }

      clearPendingTransition();
      setTransitioning(false);
      unlockBodyScroll({force: true});
    },
    [emit]
  );

  useEffect(() => {
    const stalePending = getPendingTransition();

    if (!stalePending) {
      return;
    }

    cancelTransition({
      transitionId: stalePending.transitionId,
      reason: 'landing_return_cancel',
      variant: stalePending.type === 'test' ? stalePending.variant : undefined
    });
  }, [cancelTransition]);

  useEffect(() => {
    if (!transitioning) {
      return;
    }

    const onPopState = () => {
      const pending = getPendingTransition();

      if (!pending) {
        return;
      }

      cancelTransition({
        transitionId: pending.transitionId,
        reason: 'popstate_cancel',
        variant: pending.type === 'test' ? pending.variant : undefined
      });
    };

    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [cancelTransition, transitioning]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        hadInactiveSinceMountRef.current = true;
        if (activeRampTimerRef.current) {
          window.clearTimeout(activeRampTimerRef.current);
          activeRampTimerRef.current = null;
        }
        setActiveRampLocked(false);
        return;
      }

      if (!hadInactiveSinceMountRef.current) {
        return;
      }

      setActiveRampLocked(true);
      if (activeRampTimerRef.current) {
        window.clearTimeout(activeRampTimerRef.current);
      }

      activeRampTimerRef.current = window.setTimeout(() => {
        setActiveRampLocked(false);
        activeRampTimerRef.current = null;
      }, ACTIVE_RAMP_LOCK_MS);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (pageState !== 'INACTIVE') {
      return;
    }

    resetHoverIntentState();
    setExpandedCardId(null);
    setExpandedOverlayPlacement(null);
    setUnavailableOverlayCardId(null);
  }, [pageState, resetHoverIntentState]);

  useEffect(() => {
    if (capability.width >= 768 || !expandedCardId) {
      return;
    }

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [capability.width, expandedCardId]);

  useEffect(() => {
    if (capability.width < 768) {
      resetHoverIntentState();
      setUnavailableOverlayCardId(null);
      setExpandedOverlayPlacement(null);
      setNormalHeightsReady(false);
    }
  }, [capability.width, resetHoverIntentState]);

  useEffect(() => {
    if (capability.width < 768 || expandedCardId) {
      return;
    }

    const nextHeights: Record<string, number> = {};

    const measure = () => {
      cards.forEach((card) => {
        const element = cardElementsRef.current[card.id];
        if (!element) {
          return;
        }

        nextHeights[card.id] = Math.ceil(element.getBoundingClientRect().height);
      });

      setNormalHeights(nextHeights);
      const ready = cards.every((card) => {
        const height = nextHeights[card.id];
        return Number.isFinite(height) && height > 0;
      });
      setNormalHeightsReady(ready);
    };

    const raf = window.requestAnimationFrame(measure);

    return () => window.cancelAnimationFrame(raf);
  }, [cards, capability.width, expandedCardId, layout.heroColumns, layout.mainColumns]);

  useEffect(() => {
    if (!isDesktopTablet || !expandedCardId) {
      return;
    }

    const syncPlacement = () => {
      const nextPlacement = computeOverlayPlacement(expandedCardId);

      if (!nextPlacement) {
        return;
      }

      setExpandedOverlayPlacement(nextPlacement);
    };

    const raf = window.requestAnimationFrame(syncPlacement);
    window.addEventListener('resize', syncPlacement);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncPlacement);
    };
  }, [computeOverlayPlacement, expandedCardId, isDesktopTablet, layout.heroColumns, layout.mainColumns]);

  useEffect(() => {
    return () => {
      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
      }
      if (activeRampTimerRef.current) {
        window.clearTimeout(activeRampTimerRef.current);
      }
      if (hoverIntentTimerRef.current) {
        window.clearTimeout(hoverIntentTimerRef.current);
      }
      unlockBodyScroll({force: true});
    };
  }, []);

  const closeExpandedMobileCard = useCallback(() => {
    if (shouldIgnorePageInput) {
      return;
    }

    if (capability.width >= 768 || !expandedCardId) {
      setExpandedCardId(null);
      setExpandedOverlayPlacement(null);
      return;
    }

    setMobileClosing(true);

    window.setTimeout(() => {
      setExpandedCardId(null);
      setExpandedOverlayPlacement(null);
      setMobileClosing(false);
      unlockBodyScroll();
    }, MOBILE_CLOSE_UNLOCK_MS);
  }, [capability.width, expandedCardId, shouldIgnorePageInput]);

  const onExpandCard = useCallback(
    (cardId: string) => {
      resetHoverIntentState();
      void commitExpand(cardId);
    },
    [commitExpand, resetHoverIntentState]
  );

  const onCollapseCard = useCallback(
    (cardId: string) => {
      if (shouldIgnorePageInput) {
        return;
      }

      if (expandedCardId !== cardId) {
        return;
      }

      if (capability.width < 768) {
        closeExpandedMobileCard();
        return;
      }

      resetHoverIntentState();
      setExpandedCardId(null);
      setExpandedOverlayPlacement(null);
    },
    [capability.width, closeExpandedMobileCard, expandedCardId, resetHoverIntentState, shouldIgnorePageInput]
  );

  const onHoverEnterAvailable = useCallback(
    (cardId: string) => {
      if (shouldIgnorePageInput || !isDesktopHoverMode) {
        return;
      }

      setUnavailableOverlayCardId(null);

      const handoffFromAnother = handoffCardIdRef.current !== null && handoffCardIdRef.current !== cardId;
      const pendingAnother = hoverIntentCardIdRef.current !== null && hoverIntentCardIdRef.current !== cardId;
      const expandedAnother = expandedCardId !== null && expandedCardId !== cardId;

      handoffCardIdRef.current = null;
      clearHoverIntentTimer();

      const nextToken = hoverIntentTokenRef.current + 1;
      hoverIntentTokenRef.current = nextToken;
      hoverIntentCardIdRef.current = cardId;

      if (handoffFromAnother || pendingAnother || expandedAnother) {
        void commitExpand(cardId);
        return;
      }

      if (expandedCardId === cardId) {
        return;
      }

      hoverIntentTimerRef.current = window.setTimeout(() => {
        if (hoverIntentTokenRef.current !== nextToken) {
          return;
        }

        if (hoverIntentCardIdRef.current !== cardId) {
          return;
        }

        void commitExpand(cardId);
      }, HOVER_EXPAND_DELAY_MS);
    },
    [clearHoverIntentTimer, commitExpand, expandedCardId, isDesktopHoverMode, shouldIgnorePageInput]
  );

  const onHoverLeaveAvailable = useCallback(
    (cardId: string, handoffToAnotherCard: boolean) => {
      if (shouldIgnorePageInput || !isDesktopHoverMode) {
        return;
      }

      if (hoverIntentCardIdRef.current === cardId) {
        hoverIntentCardIdRef.current = null;
      }

      hoverIntentTokenRef.current += 1;
      clearHoverIntentTimer();
      handoffCardIdRef.current = handoffToAnotherCard ? cardId : null;

      if (expandedCardId === cardId) {
        setExpandedCardId(null);
        setExpandedOverlayPlacement(null);
      }
    },
    [clearHoverIntentTimer, expandedCardId, isDesktopHoverMode, shouldIgnorePageInput]
  );

  const onHoverEnterUnavailable = useCallback(
    (cardId: string) => {
      if (shouldIgnorePageInput || !isDesktopHoverMode) {
        return;
      }

      resetHoverIntentState();
      setExpandedCardId(null);
      setExpandedOverlayPlacement(null);
      setUnavailableOverlayCardId(cardId);
    },
    [isDesktopHoverMode, resetHoverIntentState, shouldIgnorePageInput]
  );

  const onHoverLeaveUnavailable = useCallback(
    (cardId: string, handoffToAnotherCard: boolean) => {
      if (shouldIgnorePageInput || !isDesktopHoverMode) {
        return;
      }

      handoffCardIdRef.current = handoffToAnotherCard ? cardId : null;
      setUnavailableOverlayCardId((prev) => (prev === cardId ? null : prev));
    },
    [isDesktopHoverMode, shouldIgnorePageInput]
  );

  const onUnavailableActiveChange = useCallback(
    (cardId: string, active: boolean) => {
      if (shouldIgnorePageInput) {
        return;
      }

      if (capability.mode !== 'HOVER_MODE' || capability.width < 768) {
        return;
      }

      if (active) {
        resetHoverIntentState();
        setExpandedCardId(null);
        setExpandedOverlayPlacement(null);
        setUnavailableOverlayCardId(cardId);
        return;
      }

      setUnavailableOverlayCardId((prev) => (prev === cardId ? null : prev));
    },
    [capability.mode, capability.width, resetHoverIntentState, shouldIgnorePageInput]
  );

  const failTransition = useCallback(
    (params: {transitionId: string; reason: 'locale_duplicate' | 'route_entry_timeout' | 'navigation_error'; variant?: string}) => {
      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
        routeTimeoutRef.current = null;
      }

      emit('transition_fail', {
        transitionId: params.transitionId,
        reason: params.reason
      });

      if (params.variant) {
        rollbackPreAnswer(params.variant, params.transitionId);
      }

      clearPendingTransition();
      setTransitioning(false);
      unlockBodyScroll({force: true});
    },
    [emit]
  );

  const beginTransition = useCallback(
    (target: {
      type: 'test' | 'blog';
      cardId: string;
      variant?: string;
      answer?: 'A' | 'B';
    }) => {
      if (shouldIgnorePageInput) {
        return;
      }

      const transitionId = createTransitionId();

      let pathname = '/';
      const href =
        target.type === 'test'
          ? buildTestQuestionRoute(target.variant ?? '')
          : buildBlogRouteWithSource(target.cardId);

      if (typeof href === 'string') {
        pathname = href;
      } else {
        pathname = href.pathname;
      }

      if (hasLocalePrefix(pathname) || hasDuplicateLocaleSegment(pathname)) {
        failTransition({
          transitionId,
          reason: 'locale_duplicate',
          variant: target.variant
        });
        return;
      }

      if (target.type === 'test' && target.variant && target.answer) {
        savePreAnswer({
          variant: target.variant,
          answer: target.answer,
          transitionId
        });
        setLandingIngressFlag(target.variant);
      }

      saveLandingScrollY(window.scrollY);

      setPendingTransition({
        transitionId,
        startedAt: Date.now(),
        type: target.type,
        cardId: target.cardId,
        variant: target.variant,
        answer: target.answer,
        path: pathname
      });

      emit('transition_start', {
        transitionId,
        targetType: target.type,
        cardId: target.cardId
      });

      setTransitioning(true);
      lockBodyScroll();

      const forcedOutcome = readE2EForcedTransitionOutcome();
      if (forcedOutcome === 'cancel') {
        cancelTransition({
          transitionId,
          reason: 'e2e_forced_cancel',
          variant: target.variant
        });
        return;
      }

      if (forcedOutcome === 'locale_duplicate' || forcedOutcome === 'route_entry_timeout') {
        failTransition({
          transitionId,
          reason: forcedOutcome,
          variant: target.variant
        });
        return;
      }

      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
      }

      routeTimeoutRef.current = window.setTimeout(() => {
        const pending = getPendingTransition();
        if (!pending || pending.transitionId !== transitionId) {
          return;
        }

        failTransition({
          transitionId,
          reason: 'route_entry_timeout',
          variant: target.variant
        });
      }, ROUTE_TIMEOUT_MS);

      window.setTimeout(() => {
        try {
          router.push(href);
        } catch {
          failTransition({
            transitionId,
            reason: 'navigation_error',
            variant: target.variant
          });
        }
      }, TRANSITION_PUSH_DELAY_MS);
    },
    [cancelTransition, emit, failTransition, router, shouldIgnorePageInput]
  );

  const onTriggerTestChoice = useCallback(
    (card: Extract<CatalogCard, {type: 'test'}>, answer: 'A' | 'B') => {
      beginTransition({
        type: 'test',
        cardId: card.id,
        variant: card.variant,
        answer
      });
    },
    [beginTransition]
  );

  const onTriggerBlogReadMore = useCallback(
    (card: Extract<CatalogCard, {type: 'blog'}>) => {
      beginTransition({
        type: 'blog',
        cardId: card.id
      });
    },
    [beginTransition]
  );

  const renderCard = (card: CatalogCard, index: number, columns: number) => {
    const isUnavailable = card.availability === 'unavailable';
    const isExpanded = !isUnavailable && expandedCardId === card.id;
    const isDesktopExpanded = isExpanded && capability.width >= 768;

    const tapModeOverlayVisible = capability.mode === 'TAP_MODE' || capability.width < 768;
    const showUnavailableOverlay = isUnavailable
      ? tapModeOverlayVisible
        ? true
        : unavailableOverlayCardId === card.id
      : false;

    const shouldDisableByHoverLock =
      lockOthers &&
      capability.mode === 'HOVER_MODE' &&
      capability.width >= 768 &&
      hoverLockTargetId !== card.id;

    if (isDesktopExpanded) {
      const placeholderHeight = normalHeights[card.id];
      return (
        <article
          className={styles.desktopExpandedPlaceholder}
          style={placeholderHeight ? {height: `${placeholderHeight}px`} : undefined}
          aria-hidden
        />
      );
    }

    return (
      <CatalogCardView
        card={card}
        isExpanded={isExpanded}
        shouldDisableByHoverLock={shouldDisableByHoverLock}
        showUnavailableOverlay={showUnavailableOverlay}
        interactionMode={capability.mode}
        pageState={pageState}
        isTransitioning={transitioning}
        isMobile={capability.width < 768}
        transformOriginX={getOrigin(index, columns)}
        normalHeightPx={
          capability.width >= 768 && expandedCardId
            ? normalHeights[card.id]
            : undefined
        }
        isHoverLockActive={isHoverLockActive}
        isHoverLockTarget={hoverLockTargetId === card.id}
        allowTabFocusWhileHoverLocked={keyboardModeActive}
        onExpand={onExpandCard}
        onCollapse={onCollapseCard}
        onHoverEnterAvailable={onHoverEnterAvailable}
        onHoverLeaveAvailable={onHoverLeaveAvailable}
        onHoverEnterUnavailable={onHoverEnterUnavailable}
        onHoverLeaveUnavailable={onHoverLeaveUnavailable}
        onUnavailableActiveChange={onUnavailableActiveChange}
        onTriggerTestChoice={onTriggerTestChoice}
        onTriggerBlogReadMore={onTriggerBlogReadMore}
        onRegisterElement={(cardId, element) => {
          cardElementsRef.current[cardId] = element;
        }}
      />
    );
  };

  const expandedDesktopCard =
    expandedCardId && capability.width >= 768
      ? cards.find((card) => card.id === expandedCardId && card.availability === 'available')
      : undefined;

  const expandedDesktopMeta = expandedCardId ? cardGridMeta.get(expandedCardId) : undefined;

  const desktopOverlayCard =
    expandedDesktopCard && expandedOverlayPlacement && expandedDesktopMeta ? (
      <CatalogCardView
        card={expandedDesktopCard}
        isExpanded
        shouldDisableByHoverLock={false}
        showUnavailableOverlay={false}
        interactionMode={capability.mode}
        pageState={pageState}
        isTransitioning={transitioning}
        isMobile={false}
        transformOriginX={getOrigin(expandedDesktopMeta.index, expandedDesktopMeta.columns)}
        isHoverLockActive={isHoverLockActive}
        isHoverLockTarget
        allowTabFocusWhileHoverLocked={keyboardModeActive}
        onExpand={onExpandCard}
        onCollapse={onCollapseCard}
        onHoverEnterAvailable={onHoverEnterAvailable}
        onHoverLeaveAvailable={onHoverLeaveAvailable}
        onHoverEnterUnavailable={onHoverEnterUnavailable}
        onHoverLeaveUnavailable={onHoverLeaveUnavailable}
        onUnavailableActiveChange={onUnavailableActiveChange}
        onTriggerTestChoice={onTriggerTestChoice}
        onTriggerBlogReadMore={onTriggerBlogReadMore}
        onRegisterElement={() => {
          // Overlay card is rendered out of flow. Normal-height measurement is done on in-grid cards.
        }}
        wrapperClassName={styles.desktopExpandedOverlayCard}
        wrapperStyle={{
          top: `${expandedOverlayPlacement.top}px`,
          left: `${expandedOverlayPlacement.left}px`,
          width: `${expandedOverlayPlacement.width}px`
        }}
      />
    ) : null;

  return (
    <div className={styles.page}>
      <SiteHeader context="landing" capability={capability} disableInteractions={transitioning} />

      <main className={styles.container} ref={containerRef}>
        <div className={styles.content} ref={contentRef}>
          <section className={styles.heroInfo} aria-label="Hero">
            <h1 className={styles.heroTitle} data-display>
              {t('title')}
            </h1>
            <p className={styles.heroSubtitle}>{t('subtitle')}</p>
          </section>

          {heroCards.length > 0 ? (
            <section
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${layout.heroColumns}, minmax(0, 1fr))`,
                gap: `${layout.gridGap}px`
              }}
              aria-label="Hero cards"
            >
              {heroCards.map((card, index) => (
                <div
                  key={card.id}
                  className={styles.cardSlot}
                  ref={(element) => {
                    slotElementsRef.current[card.id] = element;
                  }}
                >
                  {renderCard(card, index, layout.heroColumns)}
                </div>
              ))}
            </section>
          ) : null}

          <section
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${layout.mainColumns}, minmax(0, 1fr))`,
              gap: `${layout.gridGap}px`
            }}
            aria-label="Main cards"
          >
            {mainCards.map((card, index) => (
              <div
                key={card.id}
                className={styles.cardSlot}
                ref={(element) => {
                  slotElementsRef.current[card.id] = element;
                }}
              >
                {renderCard(card, index, layout.mainColumns)}
              </div>
            ))}
          </section>

          <div
            className={styles.desktopOverlayLayer}
            ref={(element) => {
              setDesktopOverlayHost(element);
            }}
          />

          {desktopOverlayHost && desktopOverlayCard ? createPortal(desktopOverlayCard, desktopOverlayHost) : null}
        </div>
      </main>

      {capability.width < 768 && (expandedCardId || mobileClosing) ? (
        <button
          type="button"
          className={styles.mobileBackdrop}
          onClick={closeExpandedMobileCard}
          aria-label="Close expanded card"
        />
      ) : null}

      {transitioning ? <div className={styles.transitionOverlay} aria-hidden /> : null}
    </div>
  );
}
