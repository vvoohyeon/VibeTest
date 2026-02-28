export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function createClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const value = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    return `${prefix}_${value}`;
  }

  const random = Math.floor(Math.random() * 1_000_000)
    .toString(16)
    .padStart(6, '0');
  return `${prefix}_${Date.now()}_${random}`;
}
