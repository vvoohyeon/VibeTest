import {expect, test, type Locator, type Page} from '@playwright/test';

import {seedTelemetryConsent} from './helpers/consent';

const DESKTOP_VIEWPORT = {width: 1440, height: 980} as const;
const STAGE_SHADOW_BLEED_X_PX = 72;
const STAGE_SHADOW_BLEED_TOP_PX = 56;
const STAGE_SHADOW_BLEED_BOTTOM_PX = 192;
const STAGE_CAPTURE_BOTTOM_EXTRA_PX = 40;
const HOVER_OUT_REPEAT_COUNT = 20;

function buildStageClip(box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>) {
  return {
    x: Math.max(0, Math.floor(box.x - STAGE_SHADOW_BLEED_X_PX)),
    y: Math.max(0, Math.floor(box.y - STAGE_SHADOW_BLEED_TOP_PX)),
    width: Math.ceil(box.width + STAGE_SHADOW_BLEED_X_PX * 2),
    height: Math.ceil(
      box.height +
        STAGE_SHADOW_BLEED_TOP_PX +
        STAGE_SHADOW_BLEED_BOTTOM_PX +
        STAGE_CAPTURE_BOTTOM_EXTRA_PX
    )
  };
}

async function installDesktopShellPhaseObserver(page: Page, cardId: string) {
  await page.evaluate((observedCardId) => {
    const cardElement = document.querySelector<HTMLElement>(`[data-card-id="${observedCardId}"]`);
    if (!cardElement) {
      throw new Error(`Missing card element for ${observedCardId}`);
    }

    const globalWindow = window as typeof window & {
      __desktopShellPhaseLog?: Record<string, string[]>;
      __desktopShellPhaseObserver?: Record<string, MutationObserver>;
    };
    const logs = (globalWindow.__desktopShellPhaseLog ??= {});
    const observers = (globalWindow.__desktopShellPhaseObserver ??= {});

    observers[observedCardId]?.disconnect();
    logs[observedCardId] = [cardElement.getAttribute('data-desktop-shell-phase') ?? ''];

    const observer = new MutationObserver(() => {
      const nextPhase = cardElement.getAttribute('data-desktop-shell-phase') ?? '';
      const currentLog = logs[observedCardId] ?? [];
      if (currentLog[currentLog.length - 1] !== nextPhase) {
        currentLog.push(nextPhase);
      }
      logs[observedCardId] = currentLog;
    });

    observer.observe(cardElement, {
      attributes: true,
      attributeFilter: ['data-desktop-shell-phase']
    });
    observers[observedCardId] = observer;
  }, cardId);
}

async function resetDesktopShellPhaseLog(page: Page, cardId: string) {
  await page.evaluate((observedCardId) => {
    const cardElement = document.querySelector<HTMLElement>(`[data-card-id="${observedCardId}"]`);
    const globalWindow = window as typeof window & {
      __desktopShellPhaseLog?: Record<string, string[]>;
    };
    const logs = (globalWindow.__desktopShellPhaseLog ??= {});
    logs[observedCardId] = [cardElement?.getAttribute('data-desktop-shell-phase') ?? ''];
  }, cardId);
}

async function readDesktopShellPhaseLog(page: Page, cardId: string): Promise<string[]> {
  return page.evaluate((observedCardId) => {
    const globalWindow = window as typeof window & {
      __desktopShellPhaseLog?: Record<string, string[]>;
    };
    return [...(globalWindow.__desktopShellPhaseLog?.[observedCardId] ?? [])];
  }, cardId);
}

async function settleDesktopExpandedCard(page: Page, card: Locator) {
  const initialBox = await card.boundingBox();
  if (!initialBox) {
    throw new Error('Missing bounding box for expanded card.');
  }

  await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
  await expect(card).toHaveAttribute('data-desktop-shell-phase', 'opening');
  await expect(card).toHaveAttribute('data-desktop-shell-phase', 'steady');

  const settledBox = await card.boundingBox();
  if (!settledBox) {
    throw new Error('Missing settled bounding box for expanded card.');
  }

  return settledBox;
}

async function runHoverOutCollapseCycles(input: {
  page: Page;
  card: Locator;
  cardId: string;
  leavePointForBox: (box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>) => {x: number; y: number};
}) {
  let settledBox: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>> | null = null;

  await installDesktopShellPhaseObserver(input.page, input.cardId);

  for (let iteration = 0; iteration < HOVER_OUT_REPEAT_COUNT; iteration += 1) {
    settledBox = await settleDesktopExpandedCard(input.page, input.card);
    await resetDesktopShellPhaseLog(input.page, input.cardId);
    const leavePoint = input.leavePointForBox(settledBox);
    await input.page.mouse.move(
      leavePoint.x,
      leavePoint.y
    );
    await expect(input.card).toHaveAttribute('data-desktop-shell-phase', 'closing');
    await expect(input.card).toHaveAttribute('data-desktop-shell-phase', 'idle');

    const phaseLog = await readDesktopShellPhaseLog(input.page, input.cardId);
    expect(phaseLog).toContain('closing');
    expect(phaseLog).toContain('cleanup-pending');
    expect(phaseLog.at(-1)).toBe('idle');
  }

  if (!settledBox) {
    throw new Error('Missing settled hover-out cycle box.');
  }

  return settledBox;
}

async function expectSteadyExpandedShadowSnapshot(input: {
  page: Page;
  card: Locator;
  snapshotName: string;
}) {
  const settledBox = await settleDesktopExpandedCard(input.page, input.card);
  const screenshot = await input.page.screenshot({
    clip: buildStageClip(settledBox)
  });
  expect(screenshot).toMatchSnapshot(input.snapshotName);
}

test.describe('Safari hover-out ghosting regression', () => {
  test.beforeEach(async ({page}) => {
    await seedTelemetryConsent(page, 'OPTED_OUT');
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/en');
  });

  test('@smoke row1 same-card hover-out collapse keeps cleanup-pending bounded to the desktop stage', async ({page}) => {
    const firstCard = page.locator('[data-card-id="test-rhythm-a"]');
    const firstCardBox = await runHoverOutCollapseCycles({
      page,
      card: firstCard,
      cardId: 'test-rhythm-a',
      leavePointForBox: (box) => ({
        x: box.x + box.width / 2,
        y: Math.max(12, box.y - 48)
      })
    });

    const screenshot = await page.screenshot({
      clip: buildStageClip(firstCardBox)
    });
    expect(screenshot).toMatchSnapshot('hover-out-row1-settled.png');
  });

  test('@smoke lower-row same-card hover-out collapse keeps cleanup-pending bounded to the desktop stage', async ({page}) => {
    const lowerRowCard = page.locator('[data-card-id="blog-build-metrics"]');
    const lowerRowCardBox = await runHoverOutCollapseCycles({
      page,
      card: lowerRowCard,
      cardId: 'blog-build-metrics',
      leavePointForBox: (box) => ({
        x: box.x + box.width / 2,
        y: Math.min(DESKTOP_VIEWPORT.height - 16, box.y + box.height + STAGE_SHADOW_BLEED_BOTTOM_PX + 48)
      })
    });

    const screenshot = await page.screenshot({
      clip: buildStageClip(lowerRowCardBox)
    });
    expect(screenshot).toMatchSnapshot('hover-out-lower-row-settled.png');
  });

  test('@smoke row1 handoff source skips close and cleanup phases', async ({page}) => {
    const firstCard = page.locator('[data-card-id="test-rhythm-a"]');
    const secondCard = page.locator('[data-card-id="test-rhythm-b"]');

    await settleDesktopExpandedCard(page, firstCard);
    await secondCard.hover();

    await expect(firstCard).toHaveAttribute('data-desktop-shell-phase', 'handoff-source');
    await expect(firstCard).not.toHaveAttribute('data-desktop-shell-phase', 'closing');
    await expect(firstCard).not.toHaveAttribute('data-desktop-shell-phase', 'cleanup-pending');
    await expect(secondCard).toHaveAttribute('data-desktop-shell-phase', 'handoff-target');
    await expect(secondCard).toHaveAttribute('data-card-state', 'expanded');
  });

  test('@smoke row1 steady expanded shadow keeps a full envelope', async ({page}) => {
    await expectSteadyExpandedShadowSnapshot({
      page,
      card: page.locator('[data-card-id="test-rhythm-a"]'),
      snapshotName: 'steady-row1-expanded-shadow.png'
    });
  });

  test('@smoke lower-row steady expanded shadow keeps a full envelope', async ({page}) => {
    await expectSteadyExpandedShadowSnapshot({
      page,
      card: page.locator('[data-card-id="blog-build-metrics"]'),
      snapshotName: 'steady-lower-row-expanded-shadow.png'
    });
  });
});
