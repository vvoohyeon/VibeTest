import {expect, test} from '@playwright/test';
import {expectBodyScrollLock} from './helpers';

test.describe('Settings and mobile menu smoke @smoke', () => {
  test('desktop settings opens and closes by hover/escape/outside/focus out', async ({page}) => {
    await page.setViewportSize({width: 1280, height: 900});
    await page.goto('/en');

    const settingsTrigger = page.getByRole('button', {name: 'Open settings'});
    const settingsLayer = page.locator('[role="menu"][aria-label="Open settings"]');

    await settingsTrigger.hover();
    await expect(settingsLayer).toBeVisible();

    await page.locator('main').click();
    await expect(settingsLayer).toBeHidden();

    await settingsTrigger.hover();
    await expect(settingsLayer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(settingsLayer).toBeHidden();

    await settingsTrigger.focus();
    await expect(settingsLayer).toBeVisible();

    const historyLink = page.getByRole('link', {name: 'History'}).first();
    await historyLink.focus();
    await expect(settingsLayer).toBeHidden();
  });

  test('mobile hamburger keeps right inset, lock/unlock, and bottom setting controls', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/en');

    const openMenuButton = page.getByRole('button', {name: 'Open menu'});
    const viewportWidth = page.viewportSize()?.width ?? 390;
    const buttonBox = await openMenuButton.boundingBox();
    expect(buttonBox).not.toBeNull();

    if (buttonBox) {
      const rightInset = viewportWidth - (buttonBox.x + buttonBox.width);
      expect(rightInset).toBeGreaterThanOrEqual(14);
      expect(rightInset).toBeLessThanOrEqual(18);
    }

    await openMenuButton.click();
    await expectBodyScrollLock(page, true);

    const backdrop = page.getByRole('button', {name: 'Close menu'});
    await expect(backdrop).toBeVisible();
    await expect(page.getByLabel('Mobile menu')).toBeVisible();

    const languageButton = page.getByRole('button', {name: 'Language: English'});
    const themeButton = page.getByRole('button', {name: 'Theme: Light'});

    await expect(languageButton).toBeVisible();
    await expect(themeButton).toBeVisible();
    await expect(languageButton.locator('svg')).toHaveCount(1);
    await expect(themeButton.locator('svg')).toHaveCount(1);

    await backdrop.click({position: {x: 8, y: 120}});
    await page.waitForTimeout(260);
    await expectBodyScrollLock(page, false);

    await page.goto('/en/blog?source=blog-speed-vs-depth');

    const blogOpenMenuButton = page.getByRole('button', {name: 'Open menu'});
    const blogButtonBox = await blogOpenMenuButton.boundingBox();
    expect(blogButtonBox).not.toBeNull();

    if (blogButtonBox) {
      const rightInset = viewportWidth - (blogButtonBox.x + blogButtonBox.width);
      expect(rightInset).toBeGreaterThanOrEqual(14);
      expect(rightInset).toBeLessThanOrEqual(18);
    }
  });
});
