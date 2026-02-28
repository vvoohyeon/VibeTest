import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

import {localeCookieName} from '@/config/site';
import {
  hasDuplicateLocalePrefix,
  isBypassPath,
  isLocaleLessAllowlistedPath,
  parseLocalePrefix,
  resolveLocaleFromCookieOrHeader,
  withLocalePrefix
} from '@/i18n/locale-resolution';

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (hasDuplicateLocalePrefix(pathname)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/__global_unmatched__';
    rewriteUrl.search = '';
    return NextResponse.rewrite(rewriteUrl);
  }

  const pathnameLocale = parseLocalePrefix(pathname);
  if (pathnameLocale) {
    return NextResponse.next();
  }

  const resolvedLocale = resolveLocaleFromCookieOrHeader({
    cookieLocale: request.cookies.get(localeCookieName)?.value,
    acceptLanguage: request.headers.get('accept-language')
  });

  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = withLocalePrefix('/', resolvedLocale);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLocaleLessAllowlistedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = withLocalePrefix(pathname, resolvedLocale);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
