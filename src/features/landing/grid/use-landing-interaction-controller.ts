import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject
} from 'react';
import {useEffect, useMemo, useReducer, useState} from 'react';

import type {LandingCard} from '@/features/landing/data';
import type {LandingCardVisualState} from '@/features/landing/grid/landing-grid-card';
import {
  initialLandingInteractionState,
  isCardKeyboardAriaDisabled,
  isCardPointerInteractionBlocked,
  reduceLandingInteractionState,
  resolveCardStateForId,
  resolveCardTabIndex,
  type LandingInteractionState
} from '@/features/landing/model/interaction-state';

export interface LandingCardInteractionBindings {
  state: LandingCardVisualState;
  tabIndex: number;
  ariaDisabled: boolean;
  interactionBlocked: boolean;
  hoverLockEnabled: boolean;
  keyboardMode: boolean;
  onFocus: (event: ReactFocusEvent<HTMLElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseLeave: (event: ReactMouseEvent<HTMLElement>) => void;
}

interface UseLandingInteractionControllerInput {
  cards: LandingCard[];
  viewportWidth: number;
  shellRef: RefObject<HTMLElement | null>;
}

interface UseLandingInteractionControllerResult {
  interactionMode: 'hover' | 'tap';
  interactionState: LandingInteractionState;
  resolveCardInteractionBindings: (card: LandingCard) => LandingCardInteractionBindings;
}

function getExpandedFocusableElements(cardElement: HTMLElement): HTMLElement[] {
  const expandedBody = cardElement.querySelector<HTMLElement>('[data-slot="expandedBody"]');
  if (!expandedBody) {
    return [];
  }

  return Array.from(
    expandedBody.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
  ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
}

function resolveAdjacentCardId(cardIds: readonly string[], currentCardId: string, step: 1 | -1): string | null {
  const index = cardIds.indexOf(currentCardId);
  if (index < 0) {
    return null;
  }

  const nextIndex = index + step;
  if (nextIndex < 0 || nextIndex >= cardIds.length) {
    return null;
  }

  return cardIds[nextIndex] ?? null;
}

function focusCardById(shellElement: HTMLElement | null, cardId: string | null): boolean {
  if (!shellElement || !cardId) {
    return false;
  }

  const selector = `[data-testid="landing-grid-card"][data-card-id="${cardId}"]`;
  const nextCard = shellElement.querySelector<HTMLElement>(selector);
  if (!nextCard) {
    return false;
  }

  nextCard.focus();
  return true;
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
  shellRef
}: UseLandingInteractionControllerInput): UseLandingInteractionControllerResult {
  const [hoverCapability, setHoverCapability] = useState<boolean>(false);
  const [interactionState, dispatchInteraction] = useReducer(
    reduceLandingInteractionState,
    initialLandingInteractionState
  );

  const interactionMode = useMemo(
    () => resolveInteractionMode(viewportWidth, hoverCapability),
    [hoverCapability, viewportWidth]
  );
  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const cardIds = useMemo(() => cards.map((card) => card.id), [cards]);

  useEffect(() => {
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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncReducedMotion = (nowMs: number) => {
      dispatchInteraction({
        type: query.matches ? 'REDUCED_MOTION_ENABLE' : 'REDUCED_MOTION_DISABLE',
        nowMs
      });
    };

    syncReducedMotion(window.performance.now());

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
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
      } else if (event.key === 'Escape') {
        dispatchInteraction({
          type: 'ESCAPE',
          nowMs: event.timeStamp
        });
      }
    };

    const handleGlobalPointerEvent = () => {
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
  }, []);

  const dispatchCardFocus = (cardId: string, nowMs: number) => {
    const card = cardById.get(cardId);
    if (!card) {
      return;
    }

    dispatchInteraction({
      type: 'CARD_FOCUS',
      nowMs,
      interactionMode,
      cardId,
      available: card.availability === 'available'
    });
  };

  const dispatchCardActivate = (cardId: string, nowMs: number) => {
    const card = cardById.get(cardId);
    if (!card) {
      return;
    }

    dispatchInteraction({
      type: 'CARD_ACTIVATE',
      nowMs,
      interactionMode,
      cardId,
      available: card.availability === 'available'
    });
  };

  const dispatchCardHoverEnter = (cardId: string, nowMs: number) => {
    const card = cardById.get(cardId);
    if (!card) {
      return;
    }

    dispatchInteraction({
      type: 'CARD_HOVER_ENTER',
      nowMs,
      interactionMode,
      cardId,
      available: card.availability === 'available'
    });
  };

  const dispatchCardHoverLeave = (cardId: string, nowMs: number) => {
    dispatchInteraction({
      type: 'CARD_HOVER_LEAVE',
      nowMs,
      interactionMode,
      cardId
    });
  };

  const resolveCardInteractionBindings = (card: LandingCard): LandingCardInteractionBindings => {
    const pointerBlocked = isCardPointerInteractionBlocked(interactionState, card.id);
    const keyboardAriaDisabled = isCardKeyboardAriaDisabled(interactionState, card.id);
    const cardState = resolveCardStateForId(interactionState, card.id);
    const visualState: LandingCardVisualState =
      cardState === 'EXPANDED' && card.availability === 'available'
        ? 'expanded'
        : cardState === 'FOCUSED'
          ? 'focused'
          : 'normal';

    return {
      state: visualState,
      hoverLockEnabled: interactionState.hoverLock.enabled,
      keyboardMode: interactionState.hoverLock.keyboardMode,
      interactionBlocked: pointerBlocked,
      ariaDisabled: keyboardAriaDisabled,
      tabIndex: resolveCardTabIndex(interactionState, card.id),
      onFocus: (event) => {
        dispatchCardFocus(card.id, event.timeStamp);
      },
      onKeyDown: (event) => {
        if (event.key === 'Tab') {
          dispatchInteraction({type: 'KEYBOARD_MODE_ENTER'});

          if (!card.availability || card.availability !== 'available') {
            return;
          }

          const target = event.target instanceof HTMLElement ? event.target : null;
          const cardElement = event.currentTarget;
          const isExpanded = interactionState.expandedCardId === card.id;
          const focusables = getExpandedFocusableElements(cardElement);
          const firstFocusable = focusables[0] ?? null;
          const lastFocusable = focusables[focusables.length - 1] ?? null;

          if (!event.shiftKey && isExpanded && target === cardElement && firstFocusable) {
            event.preventDefault();
            firstFocusable.focus();
            return;
          }

          if (!event.shiftKey && lastFocusable && target === lastFocusable) {
            const nextCardId = resolveAdjacentCardId(cardIds, card.id, 1);
            if (focusCardById(shellRef.current, nextCardId)) {
              event.preventDefault();
            }
            return;
          }

          if (event.shiftKey && firstFocusable && target === firstFocusable) {
            const previousCardId = resolveAdjacentCardId(cardIds, card.id, -1);
            if (focusCardById(shellRef.current, previousCardId)) {
              event.preventDefault();
            }
          }
          return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && isCardKeyboardAriaDisabled(interactionState, card.id)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (event.key === 'Escape') {
          dispatchInteraction({
            type: 'ESCAPE',
            nowMs: event.timeStamp
          });
          return;
        }

        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault();
          dispatchCardActivate(card.id, event.timeStamp);
        }
      },
      onClick: (event) => {
        if (isCardKeyboardAriaDisabled(interactionState, card.id)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target && target !== event.currentTarget && target.closest('button, a, input, select, textarea')) {
          return;
        }

        dispatchCardActivate(card.id, event.timeStamp);
      },
      onMouseEnter: (event) => {
        dispatchCardHoverEnter(card.id, event.timeStamp);
      },
      onMouseLeave: (event) => {
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
          return;
        }
        dispatchCardHoverLeave(card.id, event.timeStamp);
      }
    };
  };

  return {
    interactionMode,
    interactionState,
    resolveCardInteractionBindings
  };
}
