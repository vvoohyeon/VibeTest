import {expect, test} from '@playwright/test';

const THEME_STORAGE_KEY = 'vibetest-theme';

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.addInitScript(
    ([storageKey, nextTheme]) => {
      window.localStorage.setItem(storageKey, nextTheme);
    },
    [THEME_STORAGE_KEY, theme] as const
  );
}

test.describe('Phase 11 theme matrix smoke', () => {
  test('@smoke theme matrix captures landing, blog, history, and test surfaces in light/dark states', async ({
    page
  }) => {
    await page.setViewportSize({width: 1280, height: 900});

    await setTheme(page, 'light');
    await page.goto('/en');
    await expect(page.locator('.page-shell')).toHaveScreenshot('theme-landing-light.png');

    await page.context().clearCookies();
    await page.close();
  });

  test('@smoke theme matrix captures expanded dark landing and destination pages', async ({browser}) => {
    const darkLanding = await browser.newPage({
      viewport: {width: 1280, height: 900}
    });
    await darkLanding.addInitScript(([storageKey, nextTheme]) => {
      window.localStorage.setItem(storageKey, nextTheme);
    }, [THEME_STORAGE_KEY, 'dark'] as const);
    await darkLanding.goto('http://127.0.0.1:4173/en');
    const landingCard = darkLanding.locator('[data-card-id="test-rhythm-a"]');
    await landingCard.getByTestId('landing-grid-card-trigger').click();
    await expect(darkLanding.locator('.page-shell')).toHaveScreenshot('theme-landing-dark-expanded.png');

    const darkBlog = await browser.newPage({
      viewport: {width: 1280, height: 900}
    });
    await darkBlog.addInitScript(([storageKey, nextTheme]) => {
      window.localStorage.setItem(storageKey, nextTheme);
    }, [THEME_STORAGE_KEY, 'dark'] as const);
    await darkBlog.goto('http://127.0.0.1:4173/en/blog');
    await expect(darkBlog.locator('.page-shell')).toHaveScreenshot('theme-blog-dark.png');

    const lightHistory = await browser.newPage({
      viewport: {width: 1280, height: 900}
    });
    await lightHistory.addInitScript(([storageKey, nextTheme]) => {
      window.localStorage.setItem(storageKey, nextTheme);
    }, [THEME_STORAGE_KEY, 'light'] as const);
    await lightHistory.goto('http://127.0.0.1:4173/en/history');
    await expect(lightHistory.locator('.page-shell')).toHaveScreenshot('theme-history-light.png');

    const darkTest = await browser.newPage({
      viewport: {width: 1280, height: 900}
    });
    await darkTest.addInitScript(([storageKey, nextTheme]) => {
      window.localStorage.setItem(storageKey, nextTheme);
    }, [THEME_STORAGE_KEY, 'dark'] as const);
    await darkTest.goto('http://127.0.0.1:4173/en/test/rhythm-a/question');
    await expect(darkTest.locator('.page-shell')).toHaveScreenshot('theme-test-dark.png');

    await darkLanding.close();
    await darkBlog.close();
    await lightHistory.close();
    await darkTest.close();
  });
});
