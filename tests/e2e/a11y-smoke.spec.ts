import {expect, test, type Page} from '@playwright/test';

import {expectPageToBeAxeClean} from './helpers/axe';

async function focusDesktopSettingsByKeyboard(page: Page) {
  await page.locator('body').click({position: {x: 1, y: 1}});
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('gnb-settings-trigger')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('gnb-settings-panel')).toBeVisible();
}

async function focusMobileMenuByKeyboard(page: Page) {
  await page.locator('body').click({position: {x: 1, y: 1}});
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('gnb-mobile-menu-trigger')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('gnb-mobile-menu-panel')).toBeVisible();
}

async function tabUntilCardFocused(page: Page, cardId: string): Promise<void> {
  for (let attempts = 0; attempts < 50; attempts += 1) {
    await page.keyboard.press('Tab');
    const activeCardId = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement)) {
        return null;
      }

      return activeElement.closest('[data-testid="landing-grid-card"]')?.getAttribute('data-card-id') ?? null;
    });

    if (activeCardId === cardId) {
      return;
    }
  }

  throw new Error(`Failed to focus card via Tab within budget: ${cardId}`);
}

test.describe('Canonical accessibility smoke', () => {
  test('@smoke assertion:B5-axe-canonical landing canonical states remain axe-clean', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');
    await expectPageToBeAxeClean(page);

    const unavailableCard = page.locator('[data-card-id="test-coming-soon-1"]');
    await unavailableCard.getByTestId('landing-grid-card-trigger').focus();
    await expectPageToBeAxeClean(page);
  });

  test('@smoke assertion:B7-axe-canonical gnb canonical open states remain axe-clean', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');
    await focusDesktopSettingsByKeyboard(page);
    await expectPageToBeAxeClean(page);

    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/en');
    await focusMobileMenuByKeyboard(page);
    await expectPageToBeAxeClean(page);
  });

  test('@smoke assertion:B5-axe-canonical mobile expanded and destination shells remain axe-clean', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/en');
    await page.locator('body').click({position: {x: 1, y: 1}});
    await tabUntilCardFocused(page, 'test-rhythm-a');
    await page.keyboard.press('Space');
    await expect(page.locator('[data-card-id="test-rhythm-a"]')).toHaveAttribute('data-mobile-phase', 'OPEN');
    await expectPageToBeAxeClean(page);

    for (const route of ['/en/blog', '/en/history', '/en/test/rhythm-a/question']) {
      await page.goto(route);
      await expectPageToBeAxeClean(page);
    }
  });
});
