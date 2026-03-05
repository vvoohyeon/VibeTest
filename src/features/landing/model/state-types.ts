export const pageStates = [
  'ACTIVE',
  'INACTIVE',
  'REDUCED_MOTION',
  'SENSOR_DENIED',
  'TRANSITIONING'
] as const;

export type PageState = (typeof pageStates)[number];

export const cardStates = ['NORMAL', 'EXPANDED', 'FOCUSED'] as const;

export type CardState = (typeof cardStates)[number];

export const interactionModes = ['TAP_MODE', 'HOVER_MODE'] as const;

export type InteractionMode = (typeof interactionModes)[number];

export const transitionTerminalResults = ['complete', 'fail', 'cancel'] as const;

export type TransitionTerminalResult = (typeof transitionTerminalResults)[number];

export interface TransitionCorrelation {
  transitionId: string;
  eventId: string;
  sourceCardId: string;
  targetRoute: string;
  resultReason?: string;
}

export interface HoverLockState {
  enabled: boolean;
  cardId: string | null;
  keyboardMode: boolean;
}
