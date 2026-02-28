export const locales = ['en', 'kr'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const localeCookieName = 'NEXT_LOCALE';

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
