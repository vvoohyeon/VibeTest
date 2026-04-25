import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject
} from 'react';
import {useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useState} from 'react';

import {isEnterableCard, type LandingCard} from '@/features/variant-registry';
import {
  resolveDesktopShellPhase,
  type LandingCardDesktopMotionRole,
  type LandingCardDesktopShellPhase
} from '@/features/landing/grid/desktop-shell-phase';
import type {
  LandingCardMobilePhase,
  LandingCardMobileTransientMode,
  LandingCardViewportTier,
  LandingCardVisualState,
  LandingMobileSnapshotView
} from '@/features/landing/grid/landing-grid-card';
import {
  focusCardByVariant,
  getCardRootElement,
  getExpandedFocusableElements,
  isDocumentLevelFocusTarget,
  isMobileCardElement,
  isVisibleFocusableElement,
  queueFocusCallback,
  resolveAdjacentCardVariant
} from '@/features/landing/grid/interaction-dom';
import {
  initialLandingMobileLifecycleState,
  reduceLandingMobileLifecycleState,
  type LandingMobileLifecycleState
} from '@/features/landing/grid/mobile-lifecycle';
import {
  initialLandingInteractionState,
  isCardKeyboardAriaDisabled,
  isCardPointerInteractionBlocked,
  reduceLandingInteractionState,
  resolveCardStateForVariant,
  resolveCardTabIndex,
  type LandingInteractionState
} from '@/features/landing/model/interaction-state';
import {LANDING_TRANSITION_CLEANUP_EVENT} from '@/features/landing/transition/store';
import {useDesktopMotionController} from '@/features/landing/grid/use-desktop-motion-controller';
import {useHoverIntentController} from '@/features/landing/grid/use-hover-intent-controller';
import {
  useMobileCardLifecycle,
  type MobileBackdropBindings
} from '@/features/landing/grid/use-mobile-card-lifecycle';

export interface LandingCardInteractionBindings {
  state: LandingCardVisualState;
  desktopMotionRole: LandingCardDesktopMotionRole;
  desktopShellPhase: LandingCardDesktopShellPhase;
  tabIndex: number;
  ariaDisabled: boolean;
  interactionBlocked: boolean;
  hoverLockEnabled: boolean;
  keyboardMode: boolean;
  mobilePhase: LandingCardMobilePhase;
  mobileTransientMode: LandingCardMobileTransientMode;
  mobileRestoreReady: boolean;
  mobileSnapshot: LandingMobileSnapshotView | null;
  onFocus: (event: ReactFocusEvent<HTMLElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseLeave: (event: ReactMouseEvent<HTMLElement>) => void;
  onExpandedBodyKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onAnswerChoiceSelect: (choice: 'A' | 'B', event: ReactMouseEvent<HTMLButtonElement>) => void;
  onPrimaryCtaClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  onMobileClose: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

interface UseLandingInteractionControllerInput {
  cards: LandingCard[];
  viewportWidth: number;
  viewportTier: LandingCardViewportTier;
  shellRef: RefObject<HTMLElement | null>;
  onAnswerChoiceSelect?: (card: LandingCard, choice: 'A' | 'B') => boolean | void;
  onPrimaryCtaSelect?: (card: LandingCard) => boolean | void;
}

interface UseLandingInteractionControllerResult {
  interactionMode: 'hover' | 'tap';
  interactionState: LandingInteractionState;
  prefersReducedMotion: boolean;
  mobileLifecycleState: LandingMobileLifecycleState;
  mobileBackdropBindings: MobileBackdropBindings;
  activeVisualCardVariant: string | null;
  mobileRestoreReadyVariant: string | null;
  resolveCardInteractionBindings: (card: LandingCard) => LandingCardInteractionBindings;
  collapseExpandedCard: () => void;
}

export function resolveInteractionMode(viewportWidth: number, hoverCapability: boolean): 'hover' | 'tap' {
  if (viewportWidth < 768) {
    return 'tap';
  }

  return hoverCapability ? 'hover' : 'tap';
}

export function useLandingInteractionController({
  cards,
  viewportWidth,
  viewportTier,
  shellRef,
  onAnswerChoiceSelect,
  onPrimaryCtaSelect
}: UseLandingInteractionControllerInput): UseLandingInteractionControllerResult {
  const [hoverCapability, setHoverCapability] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [interactionState, dispatchInteraction] = useReducer(
    reduceLandingInteractionState,
    initialLandingInteractionState
  );
  const [mobileLifecycleState, dispatchMobileLifecycle] = useReducer(
    reduceLandingMobileLifecycleState,
    initialLandingMobileLifecycleState
  );
  const [transitionSourceVariant, setTransitionSourceCardVariant] = useState<string | null>(null);

  const interactionMode = useMemo(
    () => resolveInteractionMode(viewportWidth, hoverCapability),
    [hoverCapability, viewportWidth]
  );
  const cardVariants = useMemo(() => cards.map((card) => card.variant), [cards]);
  const firstEnterableCardVariant = useMemo(
    () => cards.find((card) => isEnterableCard(card))?.variant ?? null,
    [cards]
  );
  const isMobileViewport = viewportTier === 'mobile';

  const {
    desktopMotionState,
    desktopTransitionReasonRef,
    setDesktopTransitionReason,
    clearDesktopMotionRuntime
  } = useDesktopMotionController({
    expandedCardVariant: interactionState.expandedCardVariant,
    isMobileViewport
  });
  const {clearHoverTimer, recordPointerInput, resolveHoverHandlers} = useHoverIntentController({
    state: interactionState,
    dispatch: dispatchInteraction,
    interactionMode,
    isMobileViewport,
    shellRef,
    setDesktopTransitionReason
  });
  const {
    mobileRestoreReadyVariant,
    mobileTransientShellState,
    mobileBackdropBindings,
    clearMobileTimers,
    resetMobileRuntime,
    beginMobileOpen,
    beginMobileClose,
    beginMobileKeyboardHandoff
  } = useMobileCardLifecycle({
    interactionMode,
    interactionState,
    dispatchInteraction,
    mobileLifecycleState,
    dispatchMobileLifecycle,
    isMobileViewport,
    shellRef,
    clearHoverTimer
  });

  const focusLandingReverseGnbTarget = useCallback((): boolean => {
    if (typeof document === 'undefined') {
      return false;
    }

    const selectors = isMobileViewport
      ? ['[data-testid="gnb-mobile-menu-trigger"]', '.gnb-mobile .gnb-ci-link']
      : ['[data-testid="gnb-settings-trigger"]', '.gnb-desktop-links a:last-of-type', '.gnb-desktop .gnb-ci-link'];

    for (const selector of selectors) {
      const candidate = document.querySelector<HTMLElement>(selector);
      if (!isVisibleFocusableElement(candidate)) {
        continue;
      }

      candidate.focus();
      return true;
    }

    return false;
  }, [isMobileViewport]);

  const queueLandingReverseGnbTargetFocus = useCallback(() => {
    queueFocusCallback(() => {
      focusLandingReverseGnbTarget();
    });
  }, [focusLandingReverseGnbTarget]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(hover: hover) and (pointer: fine)');

    const syncHoverCapability = () => {
      setHoverCapability(query.matches);
    };

    syncHoverCapability();
    query.addEventListener('change', syncHoverCapability);

    return () => {
      query.removeEventListener('change', syncHoverCapability);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncReducedMotion = (nowMs: number) => {
      setPrefersReducedMotion(query.matches);
      dispatchInteraction({
        type: query.matches ? 'REDUCED_MOTION_ENABLE' : 'REDUCED_MOTION_DISABLE',
        nowMs
      });
    };

    syncReducedMotion(window.performance.now());

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      dispatchInteraction({
        type: event.matches ? 'REDUCED_MOTION_ENABLE' : 'REDUCED_MOTION_DISABLE',
        nowMs: event.timeStamp
      });
    };

    query.addEventListener('change', handleReducedMotionChange);
    return () => {
      query.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  useEffect(() => {
    dispatchInteraction({
      type: 'MODE_SYNC',
      interactionMode
    });
  }, [interactionMode]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = (event: Event) => {
      dispatchInteraction({
        type: document.hidden ? 'PAGE_HIDDEN' : 'PAGE_VISIBLE',
        nowMs: event.timeStamp
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        dispatchInteraction({
          type: 'KEYBOARD_MODE_ENTER'
        });

        if (!event.shiftKey && isDocumentLevelFocusTarget(event.target) && focusCardByVariant(shellRef.current, firstEnterableCardVariant)) {
          event.preventDefault();
          return;
        }
      } else if (event.key === 'Escape') {
        dispatchInteraction({
          type: 'ESCAPE',
          nowMs: event.timeStamp
        });
      }
    };

    const handleGlobalPointerEvent = (event: PointerEvent | MouseEvent | WheelEvent) => {
      recordPointerInput(event);
      dispatchInteraction({
        type: 'KEYBOARD_MODE_EXIT'
      });
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('pointermove', handleGlobalPointerEvent, {passive: true});
    window.addEventListener('mousedown', handleGlobalPointerEvent, {passive: true});
    window.addEventListener('wheel', handleGlobalPointerEvent, {passive: true});

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('pointermove', handleGlobalPointerEvent);
      window.removeEventListener('mousedown', handleGlobalPointerEvent);
      window.removeEventListener('wheel', handleGlobalPointerEvent);
    };
  }, [firstEnterableCardVariant, recordPointerInput, shellRef]);

  useEffect(() => {
    return () => {
      clearHoverTimer();
      clearMobileTimers();
      clearDesktopMotionRuntime();
    };
  }, [
    clearDesktopMotionRuntime,
    clearHoverTimer,
    clearMobileTimers
  ]);

  const collapseExpandedCard = useCallback(() => {
    clearHoverTimer();
    resetMobileRuntime();
    setDesktopTransitionReason('collapse');
    setTransitionSourceCardVariant(null);
    dispatchInteraction({
      type: 'CARD_COLLAPSE',
      nowMs: typeof window !== 'undefined' ? window.performance.now() : 0,
      interactionMode,
      cardVariant: null
    });
  }, [
    clearHoverTimer,
    interactionMode,
    resetMobileRuntime,
    setDesktopTransitionReason
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleTransitionCleanup = () => {
      collapseExpandedCard();
    };

    window.addEventListener(LANDING_TRANSITION_CLEANUP_EVENT, handleTransitionCleanup);
    return () => {
      window.removeEventListener(LANDING_TRANSITION_CLEANUP_EVENT, handleTransitionCleanup);
    };
  }, [collapseExpandedCard]);

  const beginTransition = useCallback((cardVariant: string) => {
    clearHoverTimer();
    resetMobileRuntime();
    setTransitionSourceCardVariant(cardVariant);
    dispatchInteraction({
      type: 'PAGE_TRANSITION_START',
      nowMs: typeof window !== 'undefined' ? window.performance.now() : 0
    });
  }, [clearHoverTimer, resetMobileRuntime]);

  const resolveCardInteractionBindings = (card: LandingCard): LandingCardInteractionBindings => {
    const cardEnterable = isEnterableCard(card);
    const pointerBlocked = isCardPointerInteractionBlocked(interactionState, card.variant);
    const keyboardAriaDisabled = isCardKeyboardAriaDisabled(interactionState, card.variant) || !cardEnterable;
    const cardState = resolveCardStateForVariant(interactionState, card.variant);
    const transitionExpanded =
      interactionState.pageState === 'TRANSITIONING' &&
      transitionSourceVariant === card.variant &&
      cardEnterable;
    const mobileOwnsCard = mobileLifecycleState.cardVariant === card.variant;
    const mobilePhase: LandingCardMobilePhase = mobileOwnsCard ? mobileLifecycleState.phase : 'NORMAL';
    const mobileTransientMode: LandingCardMobileTransientMode =
      mobileTransientShellState.cardVariant === card.variant ? mobileTransientShellState.mode : 'NONE';
    const desktopClosingVisible =
      !isMobileViewport && desktopMotionState.closingCardVariant === card.variant && cardEnterable;
    const desktopCleanupPending =
      !isMobileViewport && desktopMotionState.cleanupPendingCardVariant === card.variant && cardEnterable;
    const desktopMotionRole: LandingCardDesktopMotionRole =
      desktopMotionState.handoffSourceCardVariant === card.variant
        ? 'handoff-source'
        : desktopMotionState.handoffTargetCardVariant === card.variant
          ? 'handoff-target'
          : desktopMotionState.openingCardVariant === card.variant
            ? 'opening'
            : desktopMotionState.closingCardVariant === card.variant
              ? 'closing'
              : !isMobileViewport && (transitionExpanded || (cardState === 'EXPANDED' && cardEnterable))
                ? 'steady'
                : 'idle';
    const desktopShellPhase = resolveDesktopShellPhase({
      available: cardEnterable,
      isMobileViewport,
      motionRole: desktopMotionRole,
      visuallyExpanded: transitionExpanded || (cardState === 'EXPANDED' && cardEnterable),
      cleanupPending: desktopCleanupPending
    });
    const mobileInteractionLocked =
      isMobileViewport &&
      mobileLifecycleState.phase !== 'NORMAL' &&
      (mobileLifecycleState.cardVariant !== card.variant || mobileLifecycleState.phase !== 'OPEN');
    const visualState: LandingCardVisualState =
      transitionExpanded ||
      desktopClosingVisible ||
      desktopCleanupPending ||
      (cardState === 'EXPANDED' && cardEnterable)
        ? 'expanded'
        : cardState === 'FOCUSED'
          ? 'focused'
          : 'normal';
    const mobileSnapshotSource =
      mobileTransientShellState.cardVariant === card.variant && mobileTransientShellState.snapshot
        ? mobileTransientShellState.snapshot
        : mobileOwnsCard
          ? mobileLifecycleState.snapshot
          : null;
    const mobileSnapshot = mobileSnapshotSource
      ? {
          cardHeightPx: mobileSnapshotSource.cardHeightPx,
          anchorTopPx: mobileSnapshotSource.anchorTopPx,
          cardLeftPx: mobileSnapshotSource.cardLeftPx,
          cardWidthPx: mobileSnapshotSource.cardWidthPx,
          titleTopPx: mobileSnapshotSource.titleTopPx,
          snapshotWriteCount: mobileLifecycleState.snapshotWriteCount,
          restoreReady: mobileRestoreReadyVariant === card.variant || (mobileOwnsCard && mobileLifecycleState.restoreReady)
        }
      : null;
    const hoverHandlers = resolveHoverHandlers(card);
    const handleExpandedBodyKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Tab' || !cardEnterable) {
        return;
      }

      dispatchInteraction({type: 'KEYBOARD_MODE_ENTER'});

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) {
        return;
      }

      const cardElement = getCardRootElement(event.currentTarget) ?? event.currentTarget;
      const focusables = getExpandedFocusableElements(cardElement);
      const focusIndex = focusables.findIndex((candidate) => candidate === target);
      if (focusIndex < 0) {
        return;
      }

      if (event.shiftKey) {
        if (focusIndex > 0) {
          event.preventDefault();
          focusables[focusIndex - 1]?.focus();
          return;
        }

        if (isMobileViewport) {
          event.preventDefault();
          beginMobileKeyboardHandoff(card.variant, resolveAdjacentCardVariant(cardVariants, card.variant, -1) ?? card.variant, event.timeStamp);
          return;
        }

        if (focusCardByVariant(shellRef.current, card.variant)) {
          event.preventDefault();
        }
        return;
      }

      if (focusIndex < focusables.length - 1) {
        event.preventDefault();
        focusables[focusIndex + 1]?.focus();
        return;
      }

      const nextCardVariant = resolveAdjacentCardVariant(cardVariants, card.variant, 1);
      if (isMobileViewport) {
        event.preventDefault();
        beginMobileKeyboardHandoff(card.variant, nextCardVariant, event.timeStamp);
        return;
      }

      desktopTransitionReasonRef.current = 'handoff';
      if (focusCardByVariant(shellRef.current, nextCardVariant)) {
        event.preventDefault();
      }
    };

    return {
      state: visualState,
      desktopMotionRole,
      desktopShellPhase,
      hoverLockEnabled: interactionState.hoverLock.enabled,
      keyboardMode: interactionState.hoverLock.keyboardMode,
      interactionBlocked:
        interactionState.pageState === 'TRANSITIONING' ? true : pointerBlocked || mobileInteractionLocked,
      ariaDisabled:
        interactionState.pageState === 'TRANSITIONING'
          ? true
          : keyboardAriaDisabled || mobileInteractionLocked,
      tabIndex:
        interactionState.pageState === 'TRANSITIONING' || mobileInteractionLocked
          ? -1
          : resolveCardTabIndex(interactionState, card.variant),
      mobilePhase,
      mobileTransientMode,
      mobileRestoreReady:
        mobileRestoreReadyVariant === card.variant || (mobileOwnsCard && mobileLifecycleState.restoreReady),
      mobileSnapshot,
      onFocus: (event) => {
        desktopTransitionReasonRef.current =
          interactionState.expandedCardVariant && interactionState.expandedCardVariant !== card.variant && cardEnterable
            ? 'handoff'
            : interactionState.expandedCardVariant && interactionState.expandedCardVariant !== card.variant
              ? 'collapse'
              : 'expand';
        dispatchInteraction({
          type: 'CARD_FOCUS',
          nowMs: event.timeStamp,
          interactionMode,
          cardVariant: card.variant,
          available: cardEnterable
        });
      },
      onKeyDown: (event) => {
        if (event.key === 'Tab') {
          dispatchInteraction({type: 'KEYBOARD_MODE_ENTER'});

          if (!cardEnterable) {
            return;
          }

          const cardElement = getCardRootElement(event.currentTarget) ?? event.currentTarget;
          const isExpanded = interactionState.expandedCardVariant === card.variant;
          const focusables = getExpandedFocusableElements(cardElement);
          const firstFocusable = focusables[0] ?? null;
          const lastFocusable = focusables[focusables.length - 1] ?? null;
          const target = event.target instanceof HTMLElement ? event.target : null;

          if (!event.shiftKey && isExpanded && target === event.currentTarget && firstFocusable) {
            event.preventDefault();
            firstFocusable.focus();
            return;
          }

          if (!event.shiftKey && lastFocusable && target === lastFocusable) {
            const nextCardVariant = resolveAdjacentCardVariant(cardVariants, card.variant, 1);
            desktopTransitionReasonRef.current = 'handoff';
            if (focusCardByVariant(shellRef.current, nextCardVariant)) {
              event.preventDefault();
            }
            return;
          }

          if (event.shiftKey && firstFocusable && target === firstFocusable) {
            if (isMobileViewport) {
              event.preventDefault();
              beginMobileKeyboardHandoff(card.variant, resolveAdjacentCardVariant(cardVariants, card.variant, -1) ?? card.variant, event.timeStamp);
              return;
            }

            const previousCardVariant = resolveAdjacentCardVariant(cardVariants, card.variant, -1);
            desktopTransitionReasonRef.current = 'handoff';
            if (focusCardByVariant(shellRef.current, previousCardVariant)) {
              event.preventDefault();
            }
            return;
          }

          if (event.shiftKey && target === event.currentTarget) {
            const previousCardVariant = resolveAdjacentCardVariant(cardVariants, card.variant, -1);
            if (isMobileViewport) {
              event.preventDefault();
              if (previousCardVariant) {
                beginMobileKeyboardHandoff(card.variant, previousCardVariant, event.timeStamp);
                return;
              }

              beginMobileKeyboardHandoff(card.variant, null, event.timeStamp);
              queueLandingReverseGnbTargetFocus();
              return;
            }

            desktopTransitionReasonRef.current = 'handoff';

            if (focusCardByVariant(shellRef.current, previousCardVariant)) {
              event.preventDefault();
              return;
            }

            desktopTransitionReasonRef.current = 'collapse';
            dispatchInteraction({
              type: 'CARD_COLLAPSE',
              nowMs: event.timeStamp,
              interactionMode,
              cardVariant: card.variant
            });
            queueLandingReverseGnbTargetFocus();
            event.preventDefault();
          }
          return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && keyboardAriaDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          collapseExpandedCard();
          return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault();

          if (!cardEnterable) {
            return;
          }

          if (isMobileCardElement(event.currentTarget)) {
            if (mobileLifecycleState.phase === 'NORMAL' && mobileLifecycleState.cardVariant !== card.variant) {
              beginMobileOpen(card.variant);
            }
            return;
          }

          desktopTransitionReasonRef.current = 'expand';
          dispatchInteraction({
            type: 'CARD_EXPAND',
            nowMs: event.timeStamp,
            interactionMode,
            cardVariant: card.variant,
            available: cardEnterable
          });
        }
      },
      onClick: (event) => {
        if (keyboardAriaDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (!cardEnterable) {
          event.preventDefault();
          return;
        }

        if (isMobileCardElement(event.currentTarget)) {
          if (mobileLifecycleState.phase === 'NORMAL' && mobileLifecycleState.cardVariant !== card.variant) {
            beginMobileOpen(card.variant);
          }
          return;
        }

        desktopTransitionReasonRef.current = 'expand';
        dispatchInteraction({
          type: 'CARD_EXPAND',
          nowMs: event.timeStamp,
          interactionMode,
          cardVariant: card.variant,
          available: cardEnterable
        });
      },
      onMouseEnter: hoverHandlers.onMouseEnter,
      onMouseLeave: hoverHandlers.onMouseLeave,
      onExpandedBodyKeyDown: handleExpandedBodyKeyDown,
      onAnswerChoiceSelect: (choice, event) => {
        if (card.type !== 'test') {
          return;
        }

        const shouldBeginTransition = onAnswerChoiceSelect?.(card, choice) !== false;
        if (shouldBeginTransition) {
          beginTransition(card.variant);
        }
        event.preventDefault();
      },
      onPrimaryCtaClick: (event) => {
        if (card.type !== 'blog') {
          return;
        }

        const shouldBeginTransition = onPrimaryCtaSelect?.(card) !== false;
        if (shouldBeginTransition) {
          beginTransition(card.variant);
        }
        event.preventDefault();
      },
      onMobileClose: (event) => {
        event.preventDefault();
        beginMobileClose();
      }
    };
  };

  const activeVisualCardVariant = isMobileViewport
    ? mobileLifecycleState.cardVariant ?? mobileTransientShellState.cardVariant
    : transitionSourceVariant ??
      interactionState.expandedCardVariant ??
      desktopMotionState.closingCardVariant ??
      desktopMotionState.cleanupPendingCardVariant;

  return {
    interactionMode,
    interactionState,
    prefersReducedMotion,
    mobileLifecycleState,
    mobileBackdropBindings,
    activeVisualCardVariant,
    mobileRestoreReadyVariant,
    resolveCardInteractionBindings,
    collapseExpandedCard
  };
}
