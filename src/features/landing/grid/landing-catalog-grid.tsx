'use client';

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {defaultLocale, isLocale} from '@/config/site';
import type {LandingCard} from '@/features/landing/data';
import {type LandingCardSpacingContract, LandingGridCard} from '@/features/landing/grid/landing-grid-card';
import {buildLandingGridPlan, resolveLandingAvailableWidth} from '@/features/landing/grid/layout-plan';
import {
  buildRowCompensationModel,
  deriveNaturalHeightFromGeometry,
  LANDING_CARD_BASE_GAP_PX
} from '@/features/landing/grid/spacing-plan';
import {resolveDesktopTransformOriginX} from '@/features/landing/grid/hover-intent';
import {useLandingInteractionController} from '@/features/landing/grid/use-landing-interaction-controller';
import {useLandingTransition} from '@/features/landing/transition/use-landing-transition';

const INITIAL_VIEWPORT_WIDTH = 1280;

export const LANDING_GRID_PLAN_CHANGED_EVENT = 'landing:grid-plan-changed';

interface LandingCatalogGridProps {
  cards: LandingCard[];
}

type CardSpacingMap = Record<string, LandingCardSpacingContract>;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.5;
}

function isSameSpacingModel(a: CardSpacingMap, b: CardSpacingMap): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    const left = a[key];
    const right = b[key];

    if (!right) {
      return false;
    }

    if (
      !nearlyEqual(left.baseGapPx, right.baseGapPx) ||
      !nearlyEqual(left.compGapPx, right.compGapPx) ||
      left.needsComp !== right.needsComp ||
      !nearlyEqual(left.naturalHeightPx, right.naturalHeightPx) ||
      !nearlyEqual(left.rowMaxNaturalHeightPx, right.rowMaxNaturalHeightPx)
    ) {
      return false;
    }
  }

  return true;
}

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return INITIAL_VIEWPORT_WIDTH;
  }

  return window.innerWidth;
}

export function LandingCatalogGrid({cards}: LandingCatalogGridProps) {
  const previousPlanKeyRef = useRef<string | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const localeFromContext = useLocale();
  const t = useTranslations('landing');
  const locale = isLocale(localeFromContext) ? localeFromContext : defaultLocale;

  const [viewportWidth, setViewportWidth] = useState<number>(readViewportWidth);
  const [spacingModel, setSpacingModel] = useState<CardSpacingMap>({});
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
  const {beginBlogTransition, beginTestTransition} = useLandingTransition({locale});
  const {
    interactionMode,
    interactionState,
    mobileLifecycleState,
    mobileBackdropBindings,
    resolveCardInteractionBindings,
    collapseExpandedCard
  } = useLandingInteractionController({
    cards,
    viewportWidth,
    viewportTier: plan.tier,
    shellRef,
    onAnswerChoiceSelect: (card, choice) => {
      if (card.type !== 'test') {
        return false;
      }

      return beginTestTransition(card, choice);
    },
    onPrimaryCtaSelect: (card) => {
      if (card.type !== 'blog') {
        return false;
      }

      return beginBlogTransition(card);
    }
  });
  const cardCopy = {
    comingSoon: t('comingSoon'),
    close: t('close'),
    closeExpandedAria: t('closeExpandedAria'),
    metaEstimated: t('metaEstimated'),
    metaShares: t('metaShares'),
    metaAttempts: t('metaAttempts'),
    metaReadTime: t('metaReadTime'),
    metaViews: t('metaViews'),
    readMore: t('readMore')
  };

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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (plan.tier !== 'mobile' && interactionState.expandedCardId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      const nextSpacingModel: CardSpacingMap = {};

      for (const row of plan.rows) {
        const rowCards = cards.slice(row.startIndex, row.endIndex);
        if (rowCards.length === 0) {
          continue;
        }

        const rowElement = shell.querySelector<HTMLElement>(`[data-row-index="${row.rowIndex}"]`);
        if (!rowElement) {
          continue;
        }

        const cardElements = Array.from(rowElement.querySelectorAll<HTMLElement>('[data-testid="landing-grid-card"]'));
        const cardElementById = new Map<string, HTMLElement>();
        for (const element of cardElements) {
          const cardId = element.dataset.cardId;
          if (cardId) {
            cardElementById.set(cardId, element);
          }
        }

        const rowMeasurements = rowCards
          .map((card) => {
            const cardElement = cardElementById.get(card.id);
            if (!cardElement) {
              return null;
            }

            const cardContentElement = cardElement.querySelector<HTMLElement>('.landing-grid-card-content');
            if (!cardContentElement) {
              return null;
            }

            const tagsElement = cardContentElement.querySelector<HTMLElement>('[data-slot="tags"]');
            if (!tagsElement) {
              return null;
            }

            const appliedCompGap = Number.parseFloat(cardElement.dataset.compGap ?? '0') || 0;
            const contentRect = cardContentElement.getBoundingClientRect();
            const tagsRect = tagsElement.getBoundingClientRect();

            return deriveNaturalHeightFromGeometry({
              cardId: card.id,
              contentTop: contentRect.top,
              tagsBottom: tagsRect.bottom,
              appliedCompGap
            });
          })
          .filter((measurement): measurement is {cardId: string; naturalHeight: number} => measurement !== null);

        const rowCompensation = buildRowCompensationModel(rowMeasurements);
        for (const decision of rowCompensation) {
          nextSpacingModel[decision.cardId] = {
            baseGapPx: LANDING_CARD_BASE_GAP_PX,
            compGapPx: decision.compGap,
            needsComp: decision.needsComp,
            naturalHeightPx: decision.naturalHeight,
            rowMaxNaturalHeightPx: decision.rowMaxNaturalHeight
          };
        }
      }

      for (const card of cards) {
        if (nextSpacingModel[card.id]) {
          continue;
        }

        nextSpacingModel[card.id] = {
          baseGapPx: LANDING_CARD_BASE_GAP_PX,
          compGapPx: 0,
          needsComp: false,
          naturalHeightPx: 0,
          rowMaxNaturalHeightPx: 0
        };
      }

      setSpacingModel((previous) => (isSameSpacingModel(previous, nextSpacingModel) ? previous : nextSpacingModel));
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [cards, interactionState.expandedCardId, plan, viewportWidth]);

  useEffect(() => {
    const nextPlanKey = `${plan.tier}:${plan.row1Columns}:${plan.rowNColumns}:${plan.rows
      .map((row) => `${row.columns}-${row.cardCount}`)
      .join('|')}`;

    if (
      previousPlanKeyRef.current &&
      previousPlanKeyRef.current !== nextPlanKey &&
      typeof window !== 'undefined'
    ) {
      if (plan.tier !== 'mobile' && interactionState.expandedCardId) {
        collapseExpandedCard();
      }

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
  }, [collapseExpandedCard, interactionState.expandedCardId, plan]);

  return (
    <section
      ref={shellRef}
      className="landing-grid-shell"
      aria-label="Landing Catalog Grid"
      data-testid="landing-grid-shell"
      data-grid-tier={plan.tier}
      data-row1-columns={plan.row1Columns}
      data-rown-columns={plan.rowNColumns}
      data-page-state={interactionState.pageState}
      data-active-ramp={interactionState.activeRampUntilMs !== null ? 'true' : 'false'}
      data-hover-lock-enabled={interactionState.hoverLock.enabled ? 'true' : 'false'}
      data-hover-lock-card-id={interactionState.hoverLock.cardId ?? ''}
      data-keyboard-mode={interactionState.hoverLock.keyboardMode ? 'true' : 'false'}
      data-mobile-phase={mobileLifecycleState.phase}
    >
      {mobileBackdropBindings.active ? (
        <div
          className="landing-grid-mobile-backdrop"
          data-testid="landing-grid-mobile-backdrop"
          data-state={mobileBackdropBindings.state}
          onPointerDown={mobileBackdropBindings.onPointerDown}
          onPointerMove={mobileBackdropBindings.onPointerMove}
          onPointerUp={mobileBackdropBindings.onPointerUp}
          onPointerCancel={mobileBackdropBindings.onPointerCancel}
        />
      ) : null}
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
              const interactionBindings = resolveCardInteractionBindings(card);

              return (
                <LandingGridCard
                  key={card.id}
                  card={card}
                  state={interactionBindings.state}
                  locale={locale}
                  interactionMode={interactionMode}
                  viewportTier={plan.tier}
                  mobilePhase={interactionBindings.mobilePhase}
                  desktopTransformOriginX={resolveDesktopTransformOriginX({
                    cardOffset: offset,
                    rowCardCount: row.cardCount
                  })}
                  spacing={spacingModel[card.id]}
                  sequence={sequence}
                  copy={cardCopy}
                  hoverLockEnabled={interactionBindings.hoverLockEnabled}
                  keyboardMode={interactionBindings.keyboardMode}
                  interactionBlocked={interactionBindings.interactionBlocked}
                  ariaDisabled={interactionBindings.ariaDisabled}
                  tabIndex={interactionBindings.tabIndex}
                  onFocus={interactionBindings.onFocus}
                  onKeyDown={interactionBindings.onKeyDown}
                  onClick={interactionBindings.onClick}
                  onMouseEnter={interactionBindings.onMouseEnter}
                  onMouseLeave={interactionBindings.onMouseLeave}
                  onAnswerChoiceSelect={interactionBindings.onAnswerChoiceSelect}
                  onPrimaryCtaClick={interactionBindings.onPrimaryCtaClick}
                  onMobileClose={interactionBindings.onMobileClose}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
