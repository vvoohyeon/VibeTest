import {expect, test, type Page} from '@playwright/test';
import {
  clearFlowState,
  expectPreAnswerVariant,
  getEvents,
  openTestCardAndRevealChoices
} from './helpers';

type ForcedOutcome = 'cancel' | 'locale_duplicate' | 'route_entry_timeout';

async function runForcedOutcomeFlow(page: Page, outcome: ForcedOutcome) {
  await page.goto(`/en?__e2e_transition_outcome=${outcome}`);
  await clearFlowState(page);
  await page.goto(`/en?__e2e_transition_outcome=${outcome}`);

  await openTestCardAndRevealChoices(page);
  const answerButton = page.getByRole('button', {
    name: 'Find one person and start a direct conversation.',
    exact: true
  });
  await expect(answerButton).toBeEnabled();
  await answerButton.focus();
  await answerButton.press('Enter');

  await expect(page).toHaveURL(/\/en\/?\?__e2e_transition_outcome=/);
  await expectPreAnswerVariant(page, 'vibe-core', false);

  const events = await getEvents(page);
  const starts = events.filter((event) => event.eventName === 'transition_start');
  expect(starts.length).toBeGreaterThan(0);

  const latestStart = starts.at(-1);
  expect(latestStart).toBeTruthy();

  const transitionId = String(latestStart?.payload.transitionId ?? '');
  expect(transitionId.length).toBeGreaterThan(0);

  const terminalEvents = events.filter((event) => {
    if (!['transition_complete', 'transition_fail', 'transition_cancel'].includes(event.eventName)) {
      return false;
    }

    return String(event.payload.transitionId ?? '') === transitionId;
  });

  expect(terminalEvents).toHaveLength(1);
  return terminalEvents[0];
}

test.describe('Transition rollback smoke @smoke', () => {
  test('cancel path rolls back pre-answer and records cancel', async ({page}) => {
    const terminalEvent = await runForcedOutcomeFlow(page, 'cancel');
    expect(terminalEvent.eventName).toBe('transition_cancel');
  });

  test('locale duplicate failure rolls back pre-answer and records fail reason', async ({page}) => {
    const terminalEvent = await runForcedOutcomeFlow(page, 'locale_duplicate');
    expect(terminalEvent.eventName).toBe('transition_fail');
    expect(String(terminalEvent.payload.reason)).toBe('locale_duplicate');
  });

  test('route timeout failure rolls back pre-answer and records fail reason', async ({page}) => {
    const terminalEvent = await runForcedOutcomeFlow(page, 'route_entry_timeout');
    expect(terminalEvent.eventName).toBe('transition_fail');
    expect(String(terminalEvent.payload.reason)).toBe('route_entry_timeout');
  });
});
