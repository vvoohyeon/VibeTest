import {describe, expect, it} from 'vitest';

import {buildLocaleFreePath, buildLocalizedPath, RouteBuilder} from '../../src/lib/routes/route-builder';

describe('RouteBuilder', () => {
  it('builds locale-free route objects for landing/blog/history', () => {
    expect(RouteBuilder.landing()).toEqual({pathname: '/'});
    expect(RouteBuilder.blog()).toEqual({pathname: '/blog'});
    expect(RouteBuilder.history()).toEqual({pathname: '/history'});
  });

  it('builds localized paths with a single locale prefix', () => {
    expect(buildLocalizedPath(RouteBuilder.landing(), 'en')).toBe('/en');
    expect(buildLocalizedPath(RouteBuilder.blog(), 'kr')).toBe('/kr/blog');
    expect(buildLocalizedPath(RouteBuilder.history(), 'en')).toBe('/en/history');
    expect(buildLocalizedPath(RouteBuilder.question('alpha'), 'kr')).toBe('/kr/test/alpha/question');
  });

  it('builds locale-free paths from route objects', () => {
    expect(buildLocaleFreePath(RouteBuilder.landing())).toBe('/');
    expect(buildLocaleFreePath(RouteBuilder.blog())).toBe('/blog');
    expect(buildLocaleFreePath(RouteBuilder.history())).toBe('/history');
    expect(buildLocaleFreePath(RouteBuilder.question('beta'))).toBe('/test/beta/question');
  });
});
