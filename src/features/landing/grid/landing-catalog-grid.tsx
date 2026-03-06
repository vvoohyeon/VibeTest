'use client';

import {type CSSProperties, useEffect, useMemo, useRef, useState} from 'react';

import type {LandingCard} from '@/features/landing/data';
import {buildLandingGridPlan, resolveLandingAvailableWidth} from '@/features/landing/grid/layout-plan';

const INITIAL_VIEWPORT_WIDTH = 1280;

export const LANDING_GRID_PLAN_CHANGED_EVENT = 'landing:grid-plan-changed';

interface LandingCatalogGridProps {
  cards: LandingCard[];
}

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return INITIAL_VIEWPORT_WIDTH;
  }

  return window.innerWidth;
}

export function LandingCatalogGrid({cards}: LandingCatalogGridProps) {
  const previousPlanKeyRef = useRef<string | null>(null);

  const [viewportWidth, setViewportWidth] = useState<number>(readViewportWidth);
  const availableWidth = useMemo(() => resolveLandingAvailableWidth(viewportWidth), [viewportWidth]);

  const plan = useMemo(
    () =>
      buildLandingGridPlan({
        viewportWidth,
        availableWidth,
        cardCount: cards.length
      }),
    [availableWidth, cards.length, viewportWidth]
  );

  useEffect(() => {
    let frame = 0;

    const syncViewportWidth = () => {
      const nextViewportWidth = readViewportWidth();
      setViewportWidth((previous) => (previous === nextViewportWidth ? previous : nextViewportWidth));
    };

    const scheduleSync = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncViewportWidth();
      });
    };

    syncViewportWidth();
    window.addEventListener('resize', scheduleSync, {passive: true});

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', scheduleSync);
    };
  }, []);

  useEffect(() => {
    const nextPlanKey = `${plan.tier}:${plan.row1Columns}:${plan.rowNColumns}:${plan.rows
      .map((row) => `${row.columns}-${row.cardCount}`)
      .join('|')}`;

    if (
      previousPlanKeyRef.current &&
      previousPlanKeyRef.current !== nextPlanKey &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(
        new CustomEvent(LANDING_GRID_PLAN_CHANGED_EVENT, {
          detail: {
            previousPlanKey: previousPlanKeyRef.current,
            nextPlanKey
          }
        })
      );
    }

    previousPlanKeyRef.current = nextPlanKey;
  }, [plan]);

  return (
    <section
      className="landing-grid-shell"
      aria-label="Landing Catalog Grid"
      data-testid="landing-grid-shell"
      data-grid-tier={plan.tier}
      data-row1-columns={plan.row1Columns}
      data-rown-columns={plan.rowNColumns}
    >
      <div className="landing-grid-container" data-testid="landing-grid-container">
        {plan.rows.map((row) => (
          <div
            key={row.rowIndex}
            className="landing-grid-row"
            data-testid={`landing-grid-row-${row.rowIndex}`}
            data-row-index={row.rowIndex}
            data-row-role={row.role}
            data-columns={row.columns}
            data-card-count={row.cardCount}
            data-underfilled={row.isUnderfilled ? 'true' : 'false'}
            style={{'--landing-grid-columns': String(row.columns)} as CSSProperties}
          >
            {cards.slice(row.startIndex, row.endIndex).map((card, offset) => {
              const sequence = row.startIndex + offset;

              return (
                <article
                  key={card.id}
                  className="landing-grid-card"
                  data-testid="landing-grid-card"
                  data-card-id={card.id}
                  data-card-seq={sequence}
                  data-card-type={card.type}
                  data-card-availability={card.availability}
                >
                  <h2 className="landing-grid-card-title">{card.title}</h2>
                  <p className="landing-grid-card-subtitle">{card.subtitle}</p>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
