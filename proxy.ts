import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';

import {routing} from './src/i18n/routing';

const handleI18nRouting = createMiddleware(routing);
const PUBLIC_FILE = /\.[^/]+$/;

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number]);
}

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_vercel') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${routing.defaultLocale}`;
    return NextResponse.redirect(redirectUrl);
  }

  const [first, second] = segments;

  if (isLocale(first) && second && isLocale(second)) {
    const invalidUrl = request.nextUrl.clone();
    invalidUrl.pathname = '/__invalid-locale-prefix__';
    return NextResponse.rewrite(invalidUrl);
  }

  if (!isLocale(first)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${routing.defaultLocale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};
