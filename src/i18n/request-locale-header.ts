import {defaultLocale, isLocale, type AppLocale} from '@/config/site';
import {parseLocalePrefix} from '@/i18n/locale-resolution';

export const REQUEST_LOCALE_HEADER_NAME = 'X-NEXT-INTL-LOCALE';

export function resolveRequestLocaleHeaderValue(value: string | null | undefined): AppLocale {
  if (value && isLocale(value)) {
    return value;
  }

  return defaultLocale;
}

export function getRequestLocaleHeaderValueFromPathname(pathname: string): AppLocale | null {
  return parseLocalePrefix(pathname);
}

export function resolveRequestLocaleFromHeaderBag(headers: Pick<Headers, 'get'>): AppLocale {
  return resolveRequestLocaleHeaderValue(headers.get(REQUEST_LOCALE_HEADER_NAME));
}
