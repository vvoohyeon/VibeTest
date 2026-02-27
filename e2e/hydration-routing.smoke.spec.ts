import {expect, test} from '@playwright/test';
import {
  expectNoDuplicateLocale,
  openBlogCardAndRevealReadMore,
  openTestCardAndRevealChoices,
  trackHydrationIssues
} from './helpers';

test.describe('Landing routing smoke @smoke', () => {
  test('navigations keep single locale prefix and no hydration warnings', async ({page}) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.goto('/en');
    await expect(page.getByRole('heading', {name: 'Short tests with sharp signals'})).toBeVisible();
    expectNoDuplicateLocale(new URL(page.url()).pathname);

    await page.getByRole('link', {name: 'History'}).click();
    await expect(page).toHaveURL(/\/en\/history$/);
    expectNoDuplicateLocale(new URL(page.url()).pathname);

    await page.goBack();
    await expect(page).toHaveURL(/\/en$/);

    await page.getByRole('link', {name: 'Blog'}).click();
    await expect(page).toHaveURL(/\/en\/blog$/);
    expectNoDuplicateLocale(new URL(page.url()).pathname);

    await page.goBack();
    await expect(page).toHaveURL(/\/en$/);

    await openTestCardAndRevealChoices(page);
    const startDirectConversationButton = page.getByRole('button', {
      name: 'Find one person and start a direct conversation.',
      exact: true
    });
    await expect(startDirectConversationButton).toBeEnabled();
    await startDirectConversationButton.focus();
    await startDirectConversationButton.press('Enter');

    await expect(page).toHaveURL(/\/en\/test\/vibe-core\/question$/);
    expectNoDuplicateLocale(new URL(page.url()).pathname);

    await page.goBack();
    await expect(page).toHaveURL(/\/en$/);

    await openBlogCardAndRevealReadMore(page);
    const readMoreButton = page.getByRole('button', {name: 'Read more', exact: true});
    await expect(readMoreButton).toBeEnabled();
    await readMoreButton.click();

    await expect(page).toHaveURL(/\/en\/blog\?source=blog-speed-vs-depth$/);
    expectNoDuplicateLocale(new URL(page.url()).pathname);

    expect(hydrationIssues).toEqual([]);
  });
});
