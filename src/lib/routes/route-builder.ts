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
      pathname: '/history';
      params?: undefined;
    }
  | {
      pathname: '/test/[variant]';
      params: {
        variant: string;
      };
    };

type LandingRoute = {pathname: '/'; params?: undefined};
type BlogRoute = {pathname: '/blog'; params?: undefined};
type HistoryRoute = {pathname: '/history'; params?: undefined};
type QuestionRoute = {
  pathname: '/test/[variant]';
  params: {
    variant: string;
  };
};

export const RouteBuilder = {
  landing(): LandingRoute {
    return {pathname: '/'};
  },
  blog(): BlogRoute {
    return {pathname: '/blog'};
  },
  history(): HistoryRoute {
    return {pathname: '/history'};
  },
  question(variant: string): QuestionRoute {
    return {
      pathname: '/test/[variant]',
      params: {variant}
    };
  }
};

export function buildLocaleFreePath(route: LocaleFreeRoute): string {
  if (route.pathname === '/test/[variant]') {
    return `/test/${route.params.variant}`;
  }

  return route.pathname;
}
