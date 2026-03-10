import {describe, expect, it} from 'vitest';

import {resolveProxyDecision} from '../../src/i18n/proxy-policy';

describe('proxy policy', () => {
  it('redirects root requests using cookie first', () => {
    expect(
      resolveProxyDecision({
        pathname: '/',
        cookieLocale: 'kr',
        acceptLanguage: 'en-US,en;q=0.9'
      })
    ).toEqual({
      action: 'redirect',
      pathname: '/kr'
    });
  });

  it('redirects allowlisted locale-less paths', () => {
    expect(
      resolveProxyDecision({
        pathname: '/blog',
        acceptLanguage: 'ko-KR,ko;q=0.9'
      })
    ).toEqual({
      action: 'redirect',
      pathname: '/kr/blog'
    });
  });

  it('rewrites duplicate locale prefixes and non-allowlisted locale-less paths', () => {
    expect(
      resolveProxyDecision({
        pathname: '/en/en/blog'
      })
    ).toEqual({
      action: 'rewrite',
      pathname: '/_not-found'
    });

    expect(
      resolveProxyDecision({
        pathname: '/foo'
      })
    ).toEqual({
      action: 'rewrite',
      pathname: '/_not-found'
    });
  });

  it('passes through already localized and bypass paths', () => {
    expect(
      resolveProxyDecision({
        pathname: '/kr'
      })
    ).toEqual({action: 'next'});

    expect(
      resolveProxyDecision({
        pathname: '/en/blog'
      })
    ).toEqual({action: 'next'});

    expect(
      resolveProxyDecision({
        pathname: '/_next/static/chunk.js'
      })
    ).toEqual({action: 'next'});

    expect(
      resolveProxyDecision({
        pathname: '/_not-found'
      })
    ).toEqual({action: 'next'});
  });
});
