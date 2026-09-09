import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  RefObject
} from 'react';
import {useCallback, useRef} from 'react';

import {isEnterableCard, type LandingCard} from '@/features/variant-registry';
import {
  DESKTOP_COLLAPSE_DELAY_MS,
  DESKTOP_EXPAND_DELAY_MS,
  isEnterableHandoffCandidate,
  nextHoverIntentToken,
  type HoverIntentAction
} from '@/features/landing/grid/hover-intent';
import {
  getCardRootElement,
  resolveCardBoundaryElement
} from '@/features/landing/grid/interaction-dom';
import type {LandingCardInteractionMode} from '@/features/landing/grid/landing-grid-card';
import type {
  LandingInteractionEvent,
  LandingInteractionState
} from '@/features/landing/model/interaction-state';
import type {DesktopTransitionReason} from '@/features/landing/grid/use-desktop-motion-controller';

type LandingInteractionDispatch = Dispatch<LandingInteractionEvent>;

interface PointerLocation {
  x: number;
  y: number;
  valid: boolean;
}

interface UseHoverIntentControllerInput {
  state: LandingInteractionState;
  dispatch: LandingInteractionDispatch;
  interactionMode: LandingCardInteractionMode;
  isMobileViewport: boolean;
  shellRef: RefObject<HTMLElement | null>;
  setDesktopTransitionReason: (reason: DesktopTransitionReason) => void;
}

interface UseHoverIntentControllerOutput {
  clearHoverTimer: () => void;
  cancelPendingHoverIntent: () => void;
  recordPointerInput: (event: PointerEvent | MouseEvent | WheelEvent) => void;
  isPointerInsideCardBoundary: (cardVariant: string) => boolean;
  resolveHoverHandlers: (card: LandingCard) => {
    onMouseEnter: ReactMouseEventHandler;
    onMouseLeave: ReactMouseEventHandler;
  };
}

type ReactMouseEventHandler = (event: ReactMouseEvent<HTMLElement>) => void;

export function useHoverIntentController({
  state,
  dispatch,
  interactionMode,
  isMobileViewport,
  shellRef,
  setDesktopTransitionReason
}: UseHoverIntentControllerInput): UseHoverIntentControllerOutput {
  const hoverTimerRef = useRef<number | null>(null);
  const hoverIntentTokenRef = useRef(0);
  const pointerWithinCardVariantRef = useRef<string | null>(null);
  const pointerLocationRef = useRef<PointerLocation>({
    x: 0,
    y: 0,
    valid: false
  });

  const clearHoverTimerOnly = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const clearHoverTimer = useCallback(() => {
    clearHoverTimerOnly();
    pointerWithinCardVariantRef.current = null;
  }, [clearHoverTimerOnly]);

  const cancelPendingHoverIntent = useCallback(() => {
    clearHoverTimerOnly();
    hoverIntentTokenRef.current += 1;
    pointerWithinCardVariantRef.current = null;
  }, [clearHoverTimerOnly]);

  const isPointerInsideCardBoundary = useCallback(
    (cardVariant: string) => {
      if (!pointerLocationRef.current.valid) {
        return false;
      }

      const boundaryElement = resolveCardBoundaryElement(shellRef.current, cardVariant);
      if (!boundaryElement) {
        return false;
      }

      const {x, y} = pointerLocationRef.current;
      const rect = boundaryElement.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },
    [shellRef]
  );

  const scheduleHoverIntent = useCallback(
    (input: {
      cardVariant: string;
      delayMs: number;
      action: HoverIntentAction;
      run: () => void;
    }) => {
      clearHoverTimerOnly();
      const nextToken = nextHoverIntentToken(hoverIntentTokenRef.current, input.cardVariant, input.action);
      hoverIntentTokenRef.current = nextToken.token;

      hoverTimerRef.current = window.setTimeout(() => {
        if (hoverIntentTokenRef.current !== nextToken.token) {
          return;
        }

        input.run();
      }, input.delayMs);
    },
    [clearHoverTimerOnly]
  );

  /**
   * collapse 예약. `onMouseLeave` 와 아래의 유실 복구가 **같은** 것을 쓴다.
   */
  const scheduleCollapseForCard = useCallback(
    (cardVariant: string, nowMs: number) => {
      scheduleHoverIntent({
        cardVariant,
        delayMs: DESKTOP_COLLAPSE_DELAY_MS,
        action: 'collapse',
        run: () => {
          if (pointerWithinCardVariantRef.current !== null || isPointerInsideCardBoundary(cardVariant)) {
            return;
          }

          setDesktopTransitionReason('collapse');
          dispatch({
            type: 'CARD_COLLAPSE',
            nowMs: typeof window !== 'undefined' ? window.performance.now() : nowMs,
            interactionMode,
            cardVariant
          });
        }
      });
    },
    [dispatch, interactionMode, isPointerInsideCardBoundary, scheduleHoverIntent, setDesktopTransitionReason]
  );

  /**
   * 포인터 위치와 「지금 어느 카드 안인가」를 기록한다. window `pointermove`/`mousedown` 에
   * 물려 있다(`use-landing-interaction-controller.ts`).
   *
   * **유실된 leave 를 여기서 되돌린다.** 카드를 떠나는 신호는 원래 카드 루트의 React
   * `onMouseLeave` 로만 들어오고, 그것은 브라우저의 `mouseout` 에 실린다. 포인터가 올라앉은
   * 노드가 그 사이 DOM 에서 제거되면 — 카드가 확장하며 접힌 상태의 썸네일을 unmount 하는 것이
   * 바로 그 경우다 — Chromium 은 그 노드로 `mouseout` 을 보낼 수 없고, 카드 루트까지 올라오는
   * 전파 경로가 통째로 사라진다. 그러면 collapse 가 **예약조차 되지 않아** 카드가 hover 에
   * 갇히고, 다른 카드를 건드릴 때까지 닫히지 않는다.
   *
   * 이 자리가 안전한 것은 이벤트 순서 때문이다. 실측 순서는
   * `pointerout → pointerover → mouseout → mouseover → pointermove` 이므로, 정상 경로에서는
   * `pointermove` 가 오기 전에 `onMouseLeave` 가 이미 실행돼 아래 `previousCardVariant` 가
   * `null` 이다. 즉 여기서 카드 이름이 남아 있는 경우는 leave 가 유실됐을 때뿐이며, 이중
   * 예약은 구조적으로 일어나지 않는다.
   */
  const recordPointerInput = useCallback(
    (event: PointerEvent | MouseEvent | WheelEvent) => {
      if ('clientX' in event && 'clientY' in event) {
        pointerLocationRef.current = {
          x: event.clientX,
          y: event.clientY,
          valid: true
        };
      }

      const previousCardVariant = pointerWithinCardVariantRef.current;
      const target = event.target instanceof HTMLElement ? getCardRootElement(event.target) : null;
      const nextCardVariant = target?.dataset.cardVariant ?? null;
      pointerWithinCardVariantRef.current = nextCardVariant;

      if (interactionMode !== 'hover' || isMobileViewport) {
        return;
      }

      if (previousCardVariant === null || previousCardVariant === nextCardVariant) {
        return;
      }

      if (state.expandedCardVariant !== previousCardVariant || state.hoverLock.keyboardMode) {
        return;
      }

      scheduleCollapseForCard(previousCardVariant, event.timeStamp);
    },
    [
      interactionMode,
      isMobileViewport,
      scheduleCollapseForCard,
      state.expandedCardVariant,
      state.hoverLock.keyboardMode
    ]
  );

  const resolveHoverHandlers = useCallback(
    (card: LandingCard) => {
      const cardEnterable = isEnterableCard(card);

      return {
        onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => {
          if (interactionMode !== 'hover' || isMobileViewport) {
            return;
          }

          if (card.type === 'blog') {
            // Blog never expands, so hovering onto it is a plain collapse of any prior
            // test card — not a handoff. 'collapse' keeps the standard close motion
            // (req-landing §8.3 forbids the 0ms exit outside a real handoff source).
            pointerWithinCardVariantRef.current = null;
            clearHoverTimer();
            if (state.expandedCardVariant) {
              setDesktopTransitionReason('collapse');
              dispatch({
                type: 'CARD_COLLAPSE',
                nowMs: event.timeStamp,
                interactionMode,
                cardVariant: state.expandedCardVariant
              });
            }
            return;
          }

          pointerWithinCardVariantRef.current = cardEnterable ? card.variant : null;
          const handoff = isEnterableHandoffCandidate({
            previousExpandedCardVariant: state.expandedCardVariant,
            nextCardVariant: card.variant,
            enterable: cardEnterable
          });

          if (handoff) {
            setDesktopTransitionReason('handoff');
            dispatch({
              type: 'CARD_COLLAPSE',
              nowMs: event.timeStamp,
              interactionMode,
              cardVariant: state.expandedCardVariant
            });
            dispatch({
              type: 'CARD_EXPAND',
              nowMs: event.timeStamp,
              interactionMode,
              cardVariant: card.variant,
              available: cardEnterable
            });
            return;
          }

          if (!cardEnterable) {
            clearHoverTimer();
            if (state.expandedCardVariant) {
              setDesktopTransitionReason('collapse');
              dispatch({
                type: 'CARD_COLLAPSE',
                nowMs: event.timeStamp,
                interactionMode,
                cardVariant: state.expandedCardVariant
              });
            }
            return;
          }

          scheduleHoverIntent({
            cardVariant: card.variant,
            delayMs: DESKTOP_EXPAND_DELAY_MS,
            action: 'expand',
            run: () => {
              if (pointerWithinCardVariantRef.current !== card.variant) {
                return;
              }

              setDesktopTransitionReason('expand');
              dispatch({
                type: 'CARD_EXPAND',
                nowMs: typeof window !== 'undefined' ? window.performance.now() : event.timeStamp,
                interactionMode,
                cardVariant: card.variant,
                available: cardEnterable
              });
            }
          });
        },
        onMouseLeave: (event: ReactMouseEvent<HTMLElement>) => {
          if (interactionMode !== 'hover' || isMobileViewport) {
            return;
          }

          if (card.type === 'blog') {
            return;
          }

          const relatedTarget = event.relatedTarget;
          if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
            return;
          }

          pointerWithinCardVariantRef.current = null;

          if (!cardEnterable) {
            return;
          }

          scheduleCollapseForCard(card.variant, event.timeStamp);
        }
      };
    },
    [
      clearHoverTimer,
      dispatch,
      interactionMode,
      isMobileViewport,
      scheduleCollapseForCard,
      scheduleHoverIntent,
      setDesktopTransitionReason,
      state.expandedCardVariant
    ]
  );

  return {
    clearHoverTimer,
    cancelPendingHoverIntent,
    recordPointerInput,
    isPointerInsideCardBoundary,
    resolveHoverHandlers
  };
}
