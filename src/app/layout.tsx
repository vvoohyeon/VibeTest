import type {Metadata} from 'next';
import Script from 'next/script';
import type {ReactNode} from 'react';

import {defaultLocale} from '@/config/site';

import './globals.css';

export const metadata: Metadata = {
  title: 'VibeTest',
  description: 'Reset baseline placeholder'
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html data-theme="light" lang={defaultLocale} suppressHydrationWarning>
      <body>
        <Script src="/theme-bootstrap.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
