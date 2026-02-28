import type {Metadata} from 'next';
import {Noto_Sans_KR, Space_Grotesk} from 'next/font/google';
import {ReactNode} from 'react';

import {AppProviders} from '@/features/common/app-providers';

import './globals.css';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap'
});

const bodyFont = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Vibe Test Landing',
  description: 'Interactive landing catalog for tests and blog entries.'
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
