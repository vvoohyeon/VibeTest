export type LandingTransitionResultReason =
  | 'USER_CANCEL'
  | 'DUPLICATE_LOCALE'
  | 'DESTINATION_TIMEOUT'
  | 'DESTINATION_LOAD_ERROR'
  | 'BLOG_FALLBACK_EMPTY'
  | 'UNKNOWN';

export interface PendingLandingTransition {
  transitionId: string;
  eventId: string;
  sourceCardId: string;
  targetRoute: string;
  targetType: 'test' | 'blog';
  startedAtMs: number;
  variant?: string;
  blogArticleId?: string;
  preAnswerChoice?: 'A' | 'B';
}

export interface LandingIngressRecord {
  variant: string;
  preAnswerChoice: 'A' | 'B';
  transitionId: string;
  createdAtMs: number;
  landingIngressFlag: true;
}

const PENDING_TRANSITION_KEY = 'vibetest-landing-pending-transition';
const RETURN_SCROLL_Y_KEY = 'vibetest-landing-return-scroll-y';
const RETURN_SCROLL_CARD_ID_KEY = 'vibetest-landing-return-card-id';
const INSTRUCTION_SEEN_PREFIX = 'vibetest-test-instruction-seen:';
const LANDING_INGRESS_PREFIX = 'vibetest-landing-ingress:';

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

export function writePendingLandingTransition(transition: PendingLandingTransition): void {
  writeJson(PENDING_TRANSITION_KEY, transition);
}

export function readPendingLandingTransition(): PendingLandingTransition | null {
  return readJson<PendingLandingTransition>(PENDING_TRANSITION_KEY);
}

export function clearPendingLandingTransition(): void {
  const storage = getSessionStorage();
  storage?.removeItem(PENDING_TRANSITION_KEY);
}

export function writeLandingIngress(record: LandingIngressRecord): void {
  writeJson(`${LANDING_INGRESS_PREFIX}${record.variant}`, record);
}

export function readLandingIngress(variant: string): LandingIngressRecord | null {
  return readJson<LandingIngressRecord>(`${LANDING_INGRESS_PREFIX}${variant}`);
}

export function consumeLandingIngress(variant: string): LandingIngressRecord | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const key = `${LANDING_INGRESS_PREFIX}${variant}`;
  const value = readJson<LandingIngressRecord>(key);
  storage.removeItem(key);
  return value;
}

export function clearLandingIngress(variant: string): void {
  const storage = getSessionStorage();
  storage?.removeItem(`${LANDING_INGRESS_PREFIX}${variant}`);
}

export function markInstructionSeen(variant: string): void {
  const storage = getSessionStorage();
  storage?.setItem(`${INSTRUCTION_SEEN_PREFIX}${variant}`, 'true');
}

export function hasSeenInstruction(variant: string): boolean {
  const storage = getSessionStorage();
  return storage?.getItem(`${INSTRUCTION_SEEN_PREFIX}${variant}`) === 'true';
}

export function saveLandingReturnScrollY(scrollY: number, sourceCardId?: string): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(RETURN_SCROLL_Y_KEY, String(Math.max(0, Math.trunc(scrollY))));
  if (sourceCardId) {
    storage.setItem(RETURN_SCROLL_CARD_ID_KEY, sourceCardId);
  } else {
    storage.removeItem(RETURN_SCROLL_CARD_ID_KEY);
  }
}

export function readLandingReturnScrollY(): number | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(RETURN_SCROLL_Y_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function consumeLandingReturnScrollY(): number | null {
  const value = readLandingReturnScrollY();
  clearLandingReturnScroll();
  return value;
}

export function readLandingReturnCardId(): string | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const value = storage.getItem(RETURN_SCROLL_CARD_ID_KEY);
  return value && value.trim().length > 0 ? value : null;
}

export function consumeLandingReturnCardId(): string | null {
  const value = readLandingReturnCardId();
  clearLandingReturnScroll();
  return value;
}

export function clearLandingReturnScroll(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(RETURN_SCROLL_Y_KEY);
  storage.removeItem(RETURN_SCROLL_CARD_ID_KEY);
}

export function rollbackLandingTransition(input: {
  variant?: string;
}): void {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  clearPendingLandingTransition();
  if (input.variant) {
    clearLandingIngress(input.variant);
  }
}
