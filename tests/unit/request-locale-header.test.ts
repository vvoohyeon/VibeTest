import {describe, expect, it} from 'vitest';

import {
  getRequestLocaleHeaderValueFromPathname,
  REQUEST_LOCALE_HEADER_NAME,
  resolveRequestLocaleFromHeaderBag,
  resolveRequestLocaleHeaderValue
} from '../../src/i18n/request-locale-header';

describe('request locale header contract', () => {
  it('uses the expected request header name', () => {
    expect(REQUEST_LOCALE_HEADER_NAME).toBe('X-NEXT-INTL-LOCALE');
  });

  it('resolves only localized pathnames into request header values', () => {
    expect(getRequestLocaleHeaderValueFromPathname('/en')).toBe('en');
    expect(getRequestLocaleHeaderValueFromPathname('/kr/blog')).toBe('kr');
    expect(getRequestLocaleHeaderValueFromPathname('/zs')).toBe('zs');
    expect(getRequestLocaleHeaderValueFromPathname('/zt/history')).toBe('zt');
    expect(getRequestLocaleHeaderValueFromPathname('/ja/history')).toBe('ja');
    expect(getRequestLocaleHeaderValueFromPathname('/ru/blog')).toBe('ru');
    expect(getRequestLocaleHeaderValueFromPathname('/ru/blog/ops-handbook')).toBe('ru');
    expect(getRequestLocaleHeaderValueFromPathname('/blog')).toBeNull();
    expect(getRequestLocaleHeaderValueFromPathname('/_not-found')).toBeNull();
  });

  it('falls back to the default locale for missing or invalid header values', () => {
    expect(resolveRequestLocaleHeaderValue('en')).toBe('en');
    expect(resolveRequestLocaleHeaderValue('kr')).toBe('kr');
    expect(resolveRequestLocaleHeaderValue('zs')).toBe('zs');
    expect(resolveRequestLocaleHeaderValue('zt')).toBe('zt');
    expect(resolveRequestLocaleHeaderValue('ja')).toBe('ja');
    expect(resolveRequestLocaleHeaderValue('ru')).toBe('ru');
    expect(resolveRequestLocaleHeaderValue('ko')).toBe('en');
    expect(resolveRequestLocaleHeaderValue(undefined)).toBe('en');
  });

  it('resolves the locale from a server header bag', () => {
    expect(
      resolveRequestLocaleFromHeaderBag({
        get(name) {
          return name === REQUEST_LOCALE_HEADER_NAME ? 'kr' : null;
        }
      })
    ).toBe('kr');
  });
});
