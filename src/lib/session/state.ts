import {createClientId} from '@/lib/utils';

export type PendingTransitionStatus = 'started' | 'complete' | 'fail' | 'cancel';

export type PendingTransition = {
  transitionId: string;
  cardId: string;
  destination: 'test' | 'blog';
  locale: string;
  variant?: string;
  startedAt: number;
  status: PendingTransitionStatus;
  reason?: string;
};

const KEYS = {
  sessionId: 'vt.session.id',
  returnScroll: 'vt.return.scroll',
  pendingTransition: 'vt.transition.pending'
};

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionId() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return 'server';
  }

  const existing = sessionStorage.getItem(KEYS.sessionId);
  if (existing) {
    return existing;
  }

  const next = createClientId('session');
  sessionStorage.setItem(KEYS.sessionId, next);
  return next;
}

export function persistReturnScroll(scrollY: number) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  sessionStorage.setItem(KEYS.returnScroll, String(scrollY));
}

export function consumeReturnScroll() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const value = sessionStorage.getItem(KEYS.returnScroll);
  if (!value) {
    return null;
  }

  sessionStorage.removeItem(KEYS.returnScroll);
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function savePendingTransition(pending: PendingTransition) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  sessionStorage.setItem(KEYS.pendingTransition, JSON.stringify(pending));
}

export function readPendingTransition() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const value = sessionStorage.getItem(KEYS.pendingTransition);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PendingTransition;
  } catch {
    return null;
  }
}

export function clearPendingTransition() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  sessionStorage.removeItem(KEYS.pendingTransition);
}

function keyForVariant(base: string, sessionId: string, variant: string) {
  return `${base}.${sessionId}.${variant}`;
}

export function saveLandingIngressFlag(variant: string) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  const sessionId = getSessionId();
  sessionStorage.setItem(keyForVariant('vt.ingress', sessionId, variant), '1');
}

export function hasLandingIngressFlag(variant: string) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return false;
  }

  const sessionId = getSessionId();
  return sessionStorage.getItem(keyForVariant('vt.ingress', sessionId, variant)) === '1';
}

export function clearLandingIngressFlag(variant: string) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  const sessionId = getSessionId();
  sessionStorage.removeItem(keyForVariant('vt.ingress', sessionId, variant));
}

export type PreAnswerPayload = {
  transitionId: string;
  variant: string;
  choice: 'A' | 'B';
};

export function savePreAnswer(payload: PreAnswerPayload) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  const sessionId = getSessionId();
  sessionStorage.setItem(
    keyForVariant('vt.preanswer', sessionId, payload.variant),
    JSON.stringify(payload)
  );
}

export function readPreAnswer(variant: string) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const sessionId = getSessionId();
  const value = sessionStorage.getItem(keyForVariant('vt.preanswer', sessionId, variant));
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PreAnswerPayload;
  } catch {
    return null;
  }
}

export function consumePreAnswer(variant: string) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const sessionId = getSessionId();
  const key = keyForVariant('vt.preanswer', sessionId, variant);
  const value = sessionStorage.getItem(key);
  if (!value) {
    return null;
  }

  sessionStorage.removeItem(key);
  try {
    return JSON.parse(value) as PreAnswerPayload;
  } catch {
    return null;
  }
}

export function rollbackTransitionState(variant?: string) {
  if (!variant) {
    return;
  }

  clearLandingIngressFlag(variant);
  consumePreAnswer(variant);
}

export function readInstructionSeen(variant: string) {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return false;
  }

  return localStorage.getItem(`vt.instruction.seen.${variant}`) === '1';
}

export function markInstructionSeen(variant: string) {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  localStorage.setItem(`vt.instruction.seen.${variant}`, '1');
}
