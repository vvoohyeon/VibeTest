export type LocaleFreeRoute =
  | {
      pathname: '/';
      params?: undefined;
    }
  | {
      pathname: '/blog';
      params?: undefined;
    }
  | {
      pathname: '/blog/[variant]';
      params: {
        variant: string;
      };
    }
  | {
      pathname: '/history';
      params?: undefined;
    }
  | {
      pathname: '/test/[variant]';
      params: {
        variant: string;
      };
    }
  | {
      pathname: '/test/error';
      params?: undefined;
    };

type LandingRoute = {pathname: '/'; params?: undefined};
type BlogRoute = {pathname: '/blog'; params?: undefined};
type BlogArticleRoute = {
  pathname: '/blog/[variant]';
  params: {
    variant: string;
  };
};
type HistoryRoute = {pathname: '/history'; params?: undefined};
type QuestionRoute = {
  pathname: '/test/[variant]';
  params: {
    variant: string;
  };
};
type TestErrorRoute = {pathname: '/test/error'; params?: undefined};

export const RouteBuilder = {
  landing(): LandingRoute {
    return {pathname: '/'};
  },
  blog(): BlogRoute {
    return {pathname: '/blog'};
  },
  blogArticle(variant: string): BlogArticleRoute {
    return {
      pathname: '/blog/[variant]',
      params: {variant}
    };
  },
  history(): HistoryRoute {
    return {pathname: '/history'};
  },
  question(variant: string): QuestionRoute {
    return {
      pathname: '/test/[variant]',
      params: {variant}
    };
  },
  testError(): TestErrorRoute {
    return {pathname: '/test/error'};
  }
};

export function buildLocaleFreePath(route: LocaleFreeRoute): string {
  if (route.pathname === '/blog/[variant]') {
    return `/blog/${route.params.variant}`;
  }

  if (route.pathname === '/test/[variant]') {
    return `/test/${route.params.variant}`;
  }

  return route.pathname;
}
