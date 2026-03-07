'use client';

import type {LandingCard} from '@/features/landing/data';
import {LandingCatalogGrid} from '@/features/landing/grid/landing-catalog-grid';

interface LandingCatalogGridLoaderProps {
  cards: LandingCard[];
}

export function LandingCatalogGridLoader({cards}: LandingCatalogGridLoaderProps) {
  return <LandingCatalogGrid cards={cards} />;
}
