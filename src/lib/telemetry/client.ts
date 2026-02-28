'use client';

import {createClientId} from '@/lib/utils';

import {ConsentState, TelemetryEvent, TelemetryEventName, TelemetryMetaValue} from './types';

const CONSENT_KEY = 'vt.telemetry.consent';
const ANON_ID_KEY = 'vt.telemetry.anonId';

let consentState: ConsentState = 'UNKNOWN';
let pendingQueue: TelemetryEvent[] = [];

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getAnonId() {
  const localStorage = getLocalStorage();

  if (!localStorage) {
    return createClientId('anon');
  }

  const existing = localStorage.getItem(ANON_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createClientId('anon');
  localStorage.setItem(ANON_ID_KEY, next);
  return next;
}

function sanitizeMetadata(metadata: Record<string, TelemetryMetaValue>) {
  const result: Record<string, TelemetryMetaValue> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      if (value.length > 80) {
        result[key] = value.slice(0, 80);
      } else {
        result[key] = value;
      }
      continue;
    }

    result[key] = value;
  }

  return result;
}

function sendEvent(event: TelemetryEvent) {
  if (process.env.NODE_ENV !== 'production') {
    window.dispatchEvent(new CustomEvent('vibetest:telemetry', {detail: event}));
  }
}

function flushQueue() {
  if (consentState !== 'OPTED_IN') {
    pendingQueue = [];
    return;
  }

  for (const event of pendingQueue) {
    sendEvent(event);
  }

  pendingQueue = [];
}

export function initializeTelemetry() {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    consentState = 'OPTED_IN';
    return;
  }

  const saved = localStorage.getItem(CONSENT_KEY);

  if (saved === 'OPTED_IN' || saved === 'OPTED_OUT') {
    consentState = saved;
    flushQueue();
    return;
  }

  consentState = 'OPTED_IN';
  localStorage.setItem(CONSENT_KEY, 'OPTED_IN');
  flushQueue();
}

export function updateConsent(nextState: Exclude<ConsentState, 'UNKNOWN'>) {
  const localStorage = getLocalStorage();
  consentState = nextState;

  if (localStorage) {
    localStorage.setItem(CONSENT_KEY, nextState);

    if (nextState === 'OPTED_OUT') {
      localStorage.removeItem(ANON_ID_KEY);
    }
  }

  flushQueue();
}

export function trackEvent(
  eventName: TelemetryEventName,
  locale: string,
  metadata: Record<string, TelemetryMetaValue>
) {
  const event: TelemetryEvent = {
    eventId: createClientId('event'),
    eventName,
    anonId: getAnonId(),
    locale,
    timestamp: new Date().toISOString(),
    metadata: sanitizeMetadata(metadata)
  };

  if (consentState === 'UNKNOWN') {
    pendingQueue.push(event);
    return;
  }

  if (consentState === 'OPTED_OUT') {
    return;
  }

  sendEvent(event);
}
