import {expect, test} from '@playwright/test';
import {
  clearFlowState,
  expectPreAnswerVariant,
  getEvents,
  openTestCardAndRevealChoices,
  trackHydrationIssues
} from './helpers';

test.describe('Test handshake smoke @smoke', () => {
  test('landing ingress starts from Q2 and pre-answer is consumed on Start', async ({page}) => {
    const hydrationIssues = trackHydrationIssues(page);

    await page.goto('/en');
    await clearFlowState(page);
    await page.goto('/en');

    await openTestCardAndRevealChoices(page);
    const startChoiceButton = page.getByRole('button', {
      name: 'Find one person and start a direct conversation.',
      exact: true
    });
    await expect(startChoiceButton).toBeEnabled();
    await startChoiceButton.focus();
    await startChoiceButton.press('Enter');

    await expect(page).toHaveURL(/\/en\/test\/vibe-core\/question$/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Question 2 of 5').first()).toBeVisible();

    await expectPreAnswerVariant(page, 'vibe-core', true);

    await page.getByRole('button', {name: 'Start', exact: true}).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Question 2 of 5').first()).toBeVisible();
    await expectPreAnswerVariant(page, 'vibe-core', false);

    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Question 2 of 5').first()).toBeVisible();

    const events = await getEvents(page);
    const attemptStarts = events.filter((event) => event.eventName === 'test_attempt_start');
    expect(attemptStarts.length).toBeGreaterThanOrEqual(1);

    expect(hydrationIssues).toEqual([]);
  });

  test('deep-link entry without ingress starts from Q1', async ({page}) => {
    await page.goto('/en');
    await clearFlowState(page);

    await page.goto('/en/test/vibe-core/question');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Question 1 of 5').first()).toBeVisible();

    await page.getByRole('button', {name: 'Start', exact: true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Question 1 of 5').first()).toBeVisible();
  });
});
