import type {LandingMobileSnapshot} from '@/features/landing/grid/mobile-lifecycle';

export function captureMobileSnapshot(shellElement: HTMLElement | null, cardVariant: string): LandingMobileSnapshot {
  if (!shellElement) {
    return {
      cardHeightPx: 0,
      anchorTopPx: 0,
      cardLeftPx: 0,
      cardWidthPx: 0,
      titleTopPx: 0
    };
  }

  const cardElement = shellElement.querySelector<HTMLElement>(
    `[data-testid="landing-grid-card"][data-card-variant="${cardVariant}"]`
  );
  const titleElement = cardElement?.querySelector<HTMLElement>('[data-slot="cardTitle"]');
  const cardRect = cardElement?.getBoundingClientRect();
  const titleRect = titleElement?.getBoundingClientRect();

  return {
    cardHeightPx: cardRect?.height ?? 0,
    anchorTopPx: cardRect?.top ?? 0,
    cardLeftPx: cardRect?.left ?? 0,
    cardWidthPx: cardRect?.width ?? 0,
    titleTopPx: titleRect?.top ?? cardRect?.top ?? 0
  };
}

export function isMobileSnapshotRestoreSettled(
  shellElement: HTMLElement | null,
  cardVariant: string,
  snapshot: LandingMobileSnapshot
): boolean {
  const cardElement = shellElement?.querySelector<HTMLElement>(
    `[data-testid="landing-grid-card"][data-card-variant="${cardVariant}"]`
  );
  const titleElement = cardElement?.querySelector<HTMLElement>('[data-slot="cardTitle"]');
  const cardRect = cardElement?.getBoundingClientRect();
  const titleRect = titleElement?.getBoundingClientRect();

  const heightSettled = Math.abs((cardRect?.height ?? 0) - snapshot.cardHeightPx) <= 1;
  const snapshotTitleOffset = snapshot.titleTopPx - snapshot.anchorTopPx;
  const currentTitleOffset = (titleRect?.top ?? cardRect?.top ?? 0) - (cardRect?.top ?? 0);
  const titleSettled = Math.abs(currentTitleOffset - snapshotTitleOffset) <= 1;

  return heightSettled && titleSettled;
}
