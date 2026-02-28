import {routing} from '@/i18n/routing';

const localePattern = new RegExp(`^/(${routing.locales.join('|')})/(${routing.locales.join('|')})(/|$)`);

export const routeBuilder = {
  landing: () => '/' as const,
  blog: (source?: string) =>
    source
      ? ({pathname: '/blog', query: {source}} as const)
      : ({pathname: '/blog'} as const),
  history: () => '/history' as const,
  testQuestion: (variant: string) =>
    ({pathname: '/test/[variant]/question', params: {variant}} as const)
};

export function hasDuplicateLocalePrefix(pathname: string) {
  return localePattern.test(pathname);
}
