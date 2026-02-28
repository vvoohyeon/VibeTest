export type ConsentState = 'UNKNOWN' | 'OPTED_IN' | 'OPTED_OUT';

export type TelemetryEventName =
  | 'landing_view'
  | 'transition_start'
  | 'transition_complete'
  | 'transition_fail'
  | 'transition_cancel'
  | 'test_attempt_start'
  | 'test_final_submit';

export type TelemetryMetaValue = string | number | boolean | null;

export type TelemetryEvent = {
  eventId: string;
  eventName: TelemetryEventName;
  anonId: string;
  locale: string;
  timestamp: string;
  metadata: Record<string, TelemetryMetaValue>;
};
