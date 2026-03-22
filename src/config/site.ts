const localeMetadata = {
  en: {
    label: 'English'
  },
  kr: {
    label: '한국어'
  },
  ja: {
    label: '日本語'
  }
} as const;

export type AppLocale = keyof typeof localeMetadata;

export const locales = Object.keys(localeMetadata) as AppLocale[];

export const localeOptions: ReadonlyArray<{
  code: AppLocale;
  label: string;
}> = locales.map((locale) => ({
  code: locale,
  label: localeMetadata[locale].label
}));

export const localeSegmentPatternSource = locales.join('|');

export const defaultLocale: AppLocale = 'en';

export const localeCookieName = 'NEXT_LOCALE';

export function isLocale(value: string): value is AppLocale {
  return Object.hasOwn(localeMetadata, value);
}
