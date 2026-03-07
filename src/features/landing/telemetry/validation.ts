import type {TelemetryConsentState, TelemetryEvent} from '@/features/landing/telemetry/types';

const FORBIDDEN_FIELD_PATTERN =
  /^(question_text|answer_text|free_input|free_text|email|ip|fingerprint)$/iu;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertCommonFields(event: TelemetryEvent): void {
  if (!event.event_id.trim()) {
    throw new Error('Telemetry event_id is required.');
  }

  if (!Number.isFinite(event.ts_ms) || event.ts_ms <= 0) {
    throw new Error('Telemetry ts_ms must be a positive finite number.');
  }

  if (!event.route.startsWith('/')) {
    throw new Error('Telemetry route must be a localized pathname.');
  }
}

function assertConsentState(value: TelemetryConsentState): void {
  if (value !== 'UNKNOWN' && value !== 'OPTED_IN' && value !== 'OPTED_OUT') {
    throw new Error(`Unsupported telemetry consent state: ${value}`);
  }
}

function assertNoForbiddenFields(value: unknown): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      assertNoForbiddenFields(entry);
    }
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) {
      throw new Error(`Forbidden telemetry field detected: ${key}`);
    }
    assertNoForbiddenFields(nestedValue);
  }
}

export function validateTelemetryEvent(event: TelemetryEvent): TelemetryEvent {
  assertCommonFields(event);
  assertConsentState(event.consent_state);
  assertNoForbiddenFields(event);

  switch (event.event_type) {
    case 'transition_start':
      if (!event.transition_id.trim() || !event.source_card_id.trim() || !event.target_route.trim()) {
        throw new Error('transition_start requires transition_id, source_card_id, and target_route.');
      }
      break;
    case 'transition_complete':
      if (!event.transition_id.trim() || !event.source_card_id.trim() || !event.target_route.trim()) {
        throw new Error('transition_complete requires transition correlation fields.');
      }
      break;
    case 'transition_fail':
    case 'transition_cancel':
      if (
        !event.transition_id.trim() ||
        !event.source_card_id.trim() ||
        !event.target_route.trim() ||
        !event.result_reason
      ) {
        throw new Error(`${event.event_type} requires transition correlation fields and result_reason.`);
      }
      break;
    case 'attempt_start':
      if (
        !event.transition_id.trim() ||
        !event.variant.trim() ||
        !Number.isFinite(event.question_index_1based) ||
        event.question_index_1based < 1 ||
        !Number.isFinite(event.dwell_ms_accumulated) ||
        event.dwell_ms_accumulated < 0
      ) {
        throw new Error('attempt_start requires transition_id, variant, 1-based question index, and dwell.');
      }
      break;
    case 'final_submit':
      if (
        !event.transition_id.trim() ||
        !event.variant.trim() ||
        !Number.isFinite(event.question_index_1based) ||
        event.question_index_1based < 1 ||
        !Number.isFinite(event.dwell_ms_accumulated) ||
        event.dwell_ms_accumulated < 0
      ) {
        throw new Error('final_submit requires transition_id, variant, 1-based question index, and dwell.');
      }

      if (!isPlainObject(event.final_responses) || Object.keys(event.final_responses).length === 0) {
        throw new Error('final_submit requires final_responses.');
      }

      for (const response of Object.values(event.final_responses)) {
        if (response !== 'A' && response !== 'B') {
          throw new Error('final_submit responses must use semantic A/B codes only.');
        }
      }

      if (event.final_q1_response !== 'A' && event.final_q1_response !== 'B') {
        throw new Error('final_submit requires final_q1_response.');
      }
      break;
    default:
      break;
  }

  return event;
}

export function patchTelemetryEventForTransport(
  event: TelemetryEvent,
  sessionId: string | null,
  consentState: TelemetryConsentState
): TelemetryEvent {
  const patchedEvent: TelemetryEvent = {
    ...event,
    session_id: sessionId,
    consent_state: consentState
  };

  return validateTelemetryEvent(patchedEvent);
}
