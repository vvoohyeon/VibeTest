'use client';

import {useEffect, useLayoutEffect, useState} from 'react';

interface GnbCapabilityState {
  viewportWidth: number;
  hoverCapable: boolean;
  elevated: boolean;
}

export function useGnbCapability(): GnbCapabilityState {
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));
  const [hoverCapable, setHoverCapable] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });
  const [elevated, setElevated] = useState(() => (typeof window === 'undefined' ? false : window.scrollY > 4));

  useLayoutEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const syncCapability = () => {
      setViewportWidth(window.innerWidth);
      setHoverCapable(hoverQuery.matches);
    };

    syncCapability();
    window.addEventListener('resize', syncCapability, {passive: true});
    hoverQuery.addEventListener('change', syncCapability);

    return () => {
      window.removeEventListener('resize', syncCapability);
      hoverQuery.removeEventListener('change', syncCapability);
    };
  }, []);

  useEffect(() => {
    const syncScroll = () => {
      setElevated(window.scrollY > 4);
    };

    syncScroll();
    window.addEventListener('scroll', syncScroll, {passive: true});

    return () => {
      window.removeEventListener('scroll', syncScroll);
    };
  }, []);

  return {
    viewportWidth,
    hoverCapable,
    elevated
  };
}
