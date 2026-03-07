import {expect, test} from '@playwright/test';

const TELEMETRY_CONSENT_STORAGE_KEY = 'vibetest-telemetry-consent';

function collectForbiddenKeys(value: unknown, trail = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextTrail = trail ? `${trail}.${key}` : key;
    const matches = /^(question_text|answer_text|free_input|free_text|email|ip|fingerprint)$/iu.test(key)
      ? [nextTrail]
      : [];
    return [...matches, ...collectForbiddenKeys(nestedValue, nextTrail)];
  });
}

test.describe('Phase 10/11 transition + telemetry smoke', () => {
  test('@smoke landing test transition records ingress, attempt_start, and final_submit payload completeness', async ({
    page
  }) => {
    const events: Array<Record<string, unknown>> = [];

    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, 'OPTED_IN');
    }, TELEMETRY_CONSENT_STORAGE_KEY);
    await page.route('**/api/telemetry', async (route) => {
      const payload = route.request().postDataJSON();
      if (payload && typeof payload === 'object') {
        events.push(payload as Record<string, unknown>);
      }
      await route.fulfill({status: 204, body: ''});
    });

    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');

    const testCard = page.locator('[data-card-id="test-rhythm-a"]');
    await testCard.getByTestId('landing-grid-card-trigger').click();
    await testCard.locator('[data-slot="answerChoiceA"]').click();

    await expect(page).toHaveURL(/\/en\/test\/rhythm-a\/question$/u);
    await expect(page.getByTestId('test-instruction-overlay')).toBeVisible();
    await expect(page.getByTestId('test-progress')).toHaveText('Question 2 of 4');

    await page.getByTestId('test-start-button').click();
    await expect(page.getByTestId('test-progress')).toHaveText('Question 2 of 4');

    await page.getByTestId('test-choice-a').click();
    await page.getByTestId('test-next-button').click();
    await page.getByTestId('test-choice-b').click();
    await page.getByTestId('test-next-button').click();
    await page.getByTestId('test-choice-a').click();
    await page.getByTestId('test-submit-button').click();

    await expect(page.getByTestId('test-result-panel')).toBeVisible();
    await expect
      .poll(() => events.filter((event) => event.event_type !== 'landing_view').length)
      .toBeGreaterThanOrEqual(4);

    const transitionStart = events.find((event) => event.event_type === 'transition_start');
    const transitionComplete = events.find((event) => event.event_type === 'transition_complete');
    const attemptStart = events.find((event) => event.event_type === 'attempt_start');
    const finalSubmit = events.find((event) => event.event_type === 'final_submit');

    expect(events.filter((event) => event.event_type === 'transition_start')).toHaveLength(1);
    expect(events.filter((event) => event.event_type === 'transition_complete')).toHaveLength(1);
    expect(events.filter((event) => event.event_type === 'attempt_start')).toHaveLength(1);
    expect(events.filter((event) => event.event_type === 'final_submit')).toHaveLength(1);

    expect(transitionStart?.source_card_id).toBe('test-rhythm-a');
    expect(transitionStart?.target_route).toBe('/en/test/rhythm-a/question');
    expect(transitionComplete?.transition_id).toBe(transitionStart?.transition_id);
    expect(attemptStart?.landing_ingress_flag).toBe(true);
    expect(attemptStart?.question_index_1based).toBe(2);
    expect(finalSubmit?.landing_ingress_flag).toBe(true);
    expect(finalSubmit?.question_index_1based).toBe(4);
    expect(finalSubmit?.final_q1_response).toBe('A');
    expect(finalSubmit?.final_responses).toEqual({
      q1: 'A',
      q2: 'A',
      q3: 'B',
      q4: 'A'
    });
    expect(collectForbiddenKeys(finalSubmit)).toEqual([]);

    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(window.sessionStorage).filter((key) => key.startsWith('vibetest-landing-ingress:')).length
        )
      )
      .toBe(0);
  });

  test('@smoke default opted-out policy blocks client telemetry network sends', async ({page}) => {
    let requestCount = 0;

    await page.addInitScript((storageKey) => {
      window.localStorage.removeItem(storageKey);
    }, TELEMETRY_CONSENT_STORAGE_KEY);
    await page.route('**/api/telemetry', async (route) => {
      requestCount += 1;
      await route.fulfill({status: 204, body: ''});
    });

    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');

    const blogCard = page.locator('[data-card-id="blog-ops-handbook"]');
    await blogCard.getByTestId('landing-grid-card-trigger').click();
    await blogCard.locator('[data-slot="primaryCTA"]').click();
    await expect(page).toHaveURL(/\/en\/blog$/u);

    await page.waitForTimeout(300);
    expect(requestCount).toBe(0);
  });

  test('@smoke blog transition selects requested article and landing return restores scroll once', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');

    const blogCard = page.locator('[data-card-id="blog-build-metrics"]');
    await blogCard.getByTestId('landing-grid-card-trigger').click();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await blogCard.locator('[data-slot="primaryCTA"]').click();

    await expect(page).toHaveURL(/\/en\/blog$/u);
    await expect(page.getByTestId('blog-selected-article')).toContainText('Build Metrics That Actually Matter');
    const savedReturnScroll = await page.evaluate(() =>
      Number(window.sessionStorage.getItem('vibetest-landing-return-scroll-y') ?? '0')
    );
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem('vibetest-landing-return-scroll-y')))
      .not.toBeNull();

    await page.getByRole('link', {name: 'VibeTest'}).first().click();
    await expect(page).toHaveURL(/\/en$/u);
    const expectedRestoredScroll = await page.evaluate((initialSavedScroll) => {
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(initialSavedScroll, maxScrollTop);
    }, savedReturnScroll);

    expect(expectedRestoredScroll).toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThanOrEqual(Math.max(1, Math.round(expectedRestoredScroll) - 1));

    const restoredScroll = await page.evaluate(() => window.scrollY);
    expect(restoredScroll).toBeGreaterThanOrEqual(scrollBefore);
    expect(Math.abs(restoredScroll - expectedRestoredScroll)).toBeLessThanOrEqual(2);
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem('vibetest-landing-return-scroll-y')))
      .toBeNull();
  });

  test('@smoke mobile expanded lifecycle keeps scroll lock until explicit close and ignores outside scroll gestures', async ({
    page
  }) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/en');
    await expect(page.getByTestId('landing-grid-shell')).toHaveAttribute('data-grid-tier', 'mobile');

    const card = page.locator('[data-card-id="test-rhythm-a"]');
    await card.getByTestId('landing-grid-card-trigger').click();

    await expect(page.getByTestId('landing-grid-mobile-backdrop')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await expect(card).toHaveAttribute('data-mobile-phase', /OPENING|OPEN/u);

    const backdrop = page.getByTestId('landing-grid-mobile-backdrop');
    await backdrop.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      clientX: 16,
      clientY: 16
    });
    await backdrop.dispatchEvent('pointermove', {
      pointerType: 'touch',
      clientX: 16,
      clientY: 44
    });
    await backdrop.dispatchEvent('pointerup', {
      pointerType: 'touch',
      clientX: 16,
      clientY: 44
    });

    await expect(card).toHaveAttribute('data-mobile-phase', /OPENING|OPEN/u);
    await expect(card).toHaveAttribute('data-mobile-phase', 'OPEN');
    await backdrop.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      clientX: 18,
      clientY: 18
    });
    await backdrop.dispatchEvent('pointerup', {
      pointerType: 'touch',
      clientX: 18,
      clientY: 18
    });
    await expect(card).toHaveAttribute('data-card-state', 'normal');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});
