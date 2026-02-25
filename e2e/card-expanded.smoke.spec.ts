import {expect, test} from '@playwright/test';
import {expectBodyScrollLock} from './helpers';

test.describe('Card interaction and mobile expanded smoke @smoke', () => {
  test('mobile full-bleed expanded keeps in-flow position and allows inner scroll', async ({page}) => {
    await page.setViewportSize({width: 390, height: 320});
    await page.goto('/en');
    const candidates = ['Speed vs Depth: Choosing the Right Tempo', 'Vibe Core Compass'];
    let overflowValidated = false;

    for (const title of candidates) {
      const card = page.locator('article').filter({hasText: title}).first();
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      const beforeScrollY = await page.evaluate(() => window.scrollY);

      await card.click();

      const expandedCard = page.locator('[role="button"][aria-expanded="true"]').first();
      await expect(expandedCard).toBeVisible();

      const expandedBox = await expandedCard.boundingBox();
      expect(expandedBox).not.toBeNull();
      const afterScrollY = await page.evaluate(() => window.scrollY);

      if (expandedBox) {
        expect(Math.abs(afterScrollY - beforeScrollY)).toBeLessThan(3);
        expect(Math.floor(expandedBox.width)).toBeGreaterThanOrEqual(388);
      }

      const expandedBody = expandedCard.locator('[aria-hidden="false"]').first();
      await expect(expandedBody).toBeVisible();

      const innerScrollState = await expandedBody.evaluate((node) => {
        const element = node as HTMLElement;
        return {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight
        };
      });

      await expectBodyScrollLock(page, true);

      if (innerScrollState.scrollHeight > innerScrollState.clientHeight + 1) {
        const scrolledTop = await expandedBody.evaluate((node) => {
          const element = node as HTMLElement;
          element.scrollTop = element.scrollHeight;
          return element.scrollTop;
        });

        expect(scrolledTop).toBeGreaterThan(0);
        overflowValidated = true;
      }

      await page.getByRole('button', {name: 'Close', exact: true}).click();
      await page.waitForTimeout(260);
      await expect(page.locator('[role="button"][aria-expanded="true"]')).toHaveCount(0);

      if (overflowValidated) {
        break;
      }
    }

    expect(overflowValidated).toBeTruthy();
    await expectBodyScrollLock(page, false);
  });

  test('desktop hover-capable mode expands on hover', async ({page}) => {
    await page.setViewportSize({width: 1280, height: 900});
    await page.goto('/en?__e2e_mode=hover');

    const testCard = page.locator('article').filter({hasText: 'Vibe Core Compass'}).first();
    await expect(testCard).toBeVisible();

    await testCard.hover();
    await expect(
      page.getByRole('button', {name: 'Find one person and start a direct conversation.', exact: true})
    ).toBeVisible();
  });

  test('desktop non-hover fallback uses tap expansion', async ({page}) => {
    await page.setViewportSize({width: 1024, height: 900});
    await page.goto('/en?__e2e_mode=tap');

    const testCard = page.locator('article').filter({hasText: 'Vibe Core Compass'}).first();
    await expect(testCard).toBeVisible();

    await testCard.click();
    await expect(
      page.getByRole('button', {name: 'Find one person and start a direct conversation.', exact: true})
    ).toBeVisible();
  });
});
