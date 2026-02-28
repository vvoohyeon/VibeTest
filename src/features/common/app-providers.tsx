'use client';

import {ReactNode} from 'react';

import {TelemetryProvider} from '@/lib/telemetry/provider';

import {ThemeProvider} from './theme-provider';

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <ThemeProvider>
      <TelemetryProvider>{children}</TelemetryProvider>
    </ThemeProvider>
  );
}
