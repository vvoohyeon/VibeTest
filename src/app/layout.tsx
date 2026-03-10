import type {Metadata} from 'next';
import {headers} from 'next/headers';
import Script from 'next/script';
import type {ReactNode} from 'react';

import {resolveRequestLocaleFromHeaderBag} from '@/i18n/request-locale-header';

import './globals.css';

export const metadata: Metadata = {
  title: 'VibeTest',
  description: 'Reset baseline placeholder'
};

export default async function RootLayout({children}: {children: ReactNode}) {
  const requestHeaders = await headers();
  const locale = resolveRequestLocaleFromHeaderBag(requestHeaders);

  return (
    <html data-theme="light" lang={locale} suppressHydrationWarning>
      <body>
        <Script src="/theme-bootstrap.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
