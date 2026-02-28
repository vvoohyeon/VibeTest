'use client';

import {ReactNode, useEffect} from 'react';

import {initializeTelemetry} from './client';

export function TelemetryProvider({children}: {children: ReactNode}) {
  useEffect(() => {
    initializeTelemetry();
  }, []);

  return children;
}
