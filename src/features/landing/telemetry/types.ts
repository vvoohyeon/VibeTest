import type {AppLocale} from '@/config/site';
import type {LandingTransitionResultReason} from '@/features/landing/transition/store';

export type TelemetryConsentState = 'UNKNOWN' | 'OPTED_IN' | 'OPTED_OUT';

export type TelemetryEventType =
  | 'landing_view'
  | 'transition_start'
  | 'transition_complete'
  | 'transition_fail'
  | 'transition_cancel'
  | 'attempt_start'
  | 'final_submit';

export interface TelemetryBaseEvent {
  event_type: TelemetryEventType;
  event_id: string;
  session_id: string | null;
  ts_ms: number;
  locale: AppLocale;
  route: string;
  consent_state: TelemetryConsentState;
}

export interface LandingViewTelemetryEvent extends TelemetryBaseEvent {
  event_type: 'landing_view';
}

export interface TransitionStartTelemetryEvent extends TelemetryBaseEvent {
  event_type: 'transition_start';
  transition_id: string;
  source_card_id: string;
  target_route: string;
}

export interface TransitionTerminalTelemetryEvent extends TelemetryBaseEvent {
  event_type: 'transition_complete' | 'transition_fail' | 'transition_cancel';
  transition_id: string;
  source_card_id: string;
  target_route: string;
  result_reason?: LandingTransitionResultReason;
}

export interface AttemptStartTelemetryEvent extends TelemetryBaseEvent {
  event_type: 'attempt_start';
  transition_id: string;
  variant: string;
  question_index_1based: number;
  dwell_ms_accumulated: number;
  landing_ingress_flag: boolean;
}

export interface FinalSubmitTelemetryEvent extends TelemetryBaseEvent {
  event_type: 'final_submit';
  transition_id: string;
  variant: string;
  question_index_1based: number;
  dwell_ms_accumulated: number;
  landing_ingress_flag: boolean;
  final_responses: Record<string, 'A' | 'B'>;
  final_q1_response: 'A' | 'B';
}

export type TelemetryEvent =
  | LandingViewTelemetryEvent
  | TransitionStartTelemetryEvent
  | TransitionTerminalTelemetryEvent
  | AttemptStartTelemetryEvent
  | FinalSubmitTelemetryEvent;
