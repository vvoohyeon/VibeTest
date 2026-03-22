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
        acceptLanguage: 'ja-JP,ja;q=0.9'
      })
    ).toEqual({
      action: 'redirect',
      pathname: '/ja/blog'
    });

    expect(
      resolveProxyDecision({
        pathname: '/test/alpha',
        acceptLanguage: 'ko-KR,ko;q=0.9'
      })
    ).toEqual({
      action: 'redirect',
      pathname: '/kr/test/alpha'
    });
  });

  it('rewrites duplicate locale prefixes but leaves non-app paths to Next not-found handling', () => {
    expect(
      resolveProxyDecision({
        pathname: '/ja/ja/blog'
      })
    ).toEqual({
      action: 'rewrite',
      pathname: '/_not-found'
    });

    expect(
      resolveProxyDecision({
        pathname: '/foo'
      })
    ).toEqual({action: 'next'});

    expect(
      resolveProxyDecision({
        pathname: '/va-123/view'
      })
    ).toEqual({action: 'next'});
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
        pathname: '/ja'
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
