export const MOBILE_EXPANDED_DURATION_MS = 280;

export type LandingMobileExpandedPhase = 'NORMAL' | 'OPENING' | 'OPEN' | 'CLOSING';

export interface LandingMobileSnapshot {
  cardHeightPx: number;
  anchorTopPx: number;
  titleTopPx: number;
}

export interface LandingMobileLifecycleState {
  phase: LandingMobileExpandedPhase;
  cardId: string | null;
  queuedClose: boolean;
  snapshot: LandingMobileSnapshot | null;
}

export type LandingMobileLifecycleEvent =
  | {type: 'OPEN_START'; cardId: string; snapshot: LandingMobileSnapshot}
  | {type: 'OPEN_SETTLED'}
  | {type: 'QUEUE_CLOSE'}
  | {type: 'QUEUE_CLOSE_CANCEL'}
  | {type: 'CLOSE_START'}
  | {type: 'CLOSE_SETTLED'}
  | {type: 'RESET'};

export const initialLandingMobileLifecycleState: LandingMobileLifecycleState = {
  phase: 'NORMAL',
  cardId: null,
  queuedClose: false,
  snapshot: null
};

export function reduceLandingMobileLifecycleState(
  state: LandingMobileLifecycleState,
  event: LandingMobileLifecycleEvent
): LandingMobileLifecycleState {
  switch (event.type) {
    case 'OPEN_START':
      if (state.phase === 'CLOSING') {
        return state;
      }

      return {
        phase: 'OPENING',
        cardId: event.cardId,
        queuedClose: false,
        snapshot: state.snapshot ?? event.snapshot
      };
    case 'OPEN_SETTLED':
      if (state.phase !== 'OPENING') {
        return state;
      }

      if (state.queuedClose) {
        return {
          ...state,
          phase: 'CLOSING'
        };
      }

      return {
        ...state,
        phase: 'OPEN'
      };
    case 'QUEUE_CLOSE':
      if (state.phase === 'OPENING') {
        return {
          ...state,
          queuedClose: true
        };
      }

      if (state.phase !== 'OPEN') {
        return state;
      }

      return {
        ...state,
        phase: 'CLOSING'
      };
    case 'QUEUE_CLOSE_CANCEL':
      if (state.phase !== 'OPENING' || !state.queuedClose) {
        return state;
      }

      return {
        ...state,
        queuedClose: false
      };
    case 'CLOSE_START':
      if (state.phase !== 'OPEN') {
        return state;
      }

      return {
        ...state,
        phase: 'CLOSING'
      };
    case 'CLOSE_SETTLED':
    case 'RESET':
      return initialLandingMobileLifecycleState;
    default:
      return state;
  }
}
