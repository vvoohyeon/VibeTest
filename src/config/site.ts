const localeMetadata = {
  en: {
    label: 'English'
  },
  kr: {
    label: '한국어'
  },
  zs: {
    label: '简体中文'
  },
  zt: {
    label: '繁體中文'
  },
  ja: {
    label: '日本語'
  },
  es: {
    label: 'Español'
  },
  fr: {
    label: 'Français'
  },
  pt: {
    label: 'Português'
  },
  de: {
    label: 'Deutsch'
  },
  hi: {
    label: 'हिन्दी'
  },
  id: {
    label: 'Indonesia'
  },
  ru: {
    label: 'Русский'
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
