'use client';

import dynamic from 'next/dynamic';

import type {LandingCard} from '@/features/landing/data';

const LandingCatalogGrid = dynamic(
  () => import('@/features/landing/grid/landing-catalog-grid').then((module) => module.LandingCatalogGrid),
  {
    ssr: false,
    loading: () => (
      <section className="landing-grid-shell" aria-label="Landing Catalog Grid" data-testid="landing-grid-shell" />
    )
  }
);

export function LandingCatalogGridLoader({cards}: {cards: LandingCard[]}) {
  return <LandingCatalogGrid cards={cards} />;
}
