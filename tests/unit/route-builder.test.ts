import {describe, expect, it} from 'vitest';

import {buildLocaleFreePath, RouteBuilder} from '../../src/lib/routes/route-builder';

describe('RouteBuilder', () => {
  it('builds locale-free route objects for landing/blog/history', () => {
    expect(RouteBuilder.landing()).toEqual({pathname: '/'});
    expect(RouteBuilder.blog()).toEqual({pathname: '/blog'});
    expect(RouteBuilder.blogArticle('ops-handbook')).toEqual({
      pathname: '/blog/[variant]',
      params: {variant: 'ops-handbook'}
    });
    expect(RouteBuilder.history()).toEqual({pathname: '/history'});
    expect(RouteBuilder.testError()).toEqual({pathname: '/test/error'});
  });

  it('builds locale-free paths from route objects only', () => {
    expect(buildLocaleFreePath(RouteBuilder.landing())).toBe('/');
    expect(buildLocaleFreePath(RouteBuilder.blog())).toBe('/blog');
    expect(buildLocaleFreePath(RouteBuilder.blogArticle('ops-handbook'))).toBe('/blog/ops-handbook');
    expect(buildLocaleFreePath(RouteBuilder.history())).toBe('/history');
    expect(buildLocaleFreePath(RouteBuilder.question('beta'))).toBe('/test/beta');
    expect(buildLocaleFreePath(RouteBuilder.testError())).toBe('/test/error');
  });
});
