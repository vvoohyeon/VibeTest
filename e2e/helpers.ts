import {expect, type Page} from '@playwright/test';

type TelemetryEnvelope = {
  eventName: string;
  payload: Record<string, unknown>;
};

const HYDRATION_PATTERNS = [
  /hydration/i,
  /did not match/i,
  /text content does not match/i,
  /hydration failed/i,
  /server html/i,
  /server-rendered html/i
];

const DUPLICATE_LOCALE_PATTERN = /\/(en|kr)\/\1(\/|$)/;

export function trackHydrationIssues(page: Page): string[] {
  const issues: string[] = [];

  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') {
      return;
    }

    const text = message.text();
    if (HYDRATION_PATTERNS.some((pattern) => pattern.test(text))) {
      issues.push(`[console:${type}] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    const text = String(error);
    if (HYDRATION_PATTERNS.some((pattern) => pattern.test(text))) {
      issues.push(`[pageerror] ${text}`);
    }
  });

  return issues;
}

export function expectNoDuplicateLocale(pathname: string): void {
  expect(pathname).not.toMatch(DUPLICATE_LOCALE_PATTERN);
}

export async function clearFlowState(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.removeItem('vt:pre-answers');
    sessionStorage.removeItem('vt:landing-ingress');
    sessionStorage.removeItem('vt:pending-transition');
    sessionStorage.removeItem('vt:landing-scroll-y');
    localStorage.removeItem('vt:instruction-seen');

    const win = window as Window & {__VT_EVENTS__?: unknown[]};
    win.__VT_EVENTS__ = [];
  });
}

export async function getEvents(page: Page): Promise<TelemetryEnvelope[]> {
  return page.evaluate(() => {
    const win = window as Window & {__VT_EVENTS__?: unknown[]};
    return (win.__VT_EVENTS__ ?? []) as TelemetryEnvelope[];
  });
}

export async function openTestCardAndRevealChoices(page: Page): Promise<void> {
  const testCard = page.locator('article').filter({hasText: 'Vibe Core Compass'}).first();
  await testCard.scrollIntoViewIfNeeded();
  await expect(testCard).toBeVisible();

  await testCard.hover();
  const answerButton = page.getByRole('button', {
    name: 'Find one person and start a direct conversation.',
    exact: true
  });

  if (!(await answerButton.isVisible())) {
    await page.waitForTimeout(220);
  }

  await expect(answerButton).toBeVisible();
}

export async function openBlogCardAndRevealReadMore(page: Page): Promise<void> {
  const blogCard = page.locator('article').filter({hasText: 'Speed vs Depth: Choosing the Right Tempo'}).first();
  await blogCard.scrollIntoViewIfNeeded();
  await expect(blogCard).toBeVisible();

  await blogCard.hover();
  const readMoreButton = page.getByRole('button', {name: 'Read more', exact: true});

  if (!(await readMoreButton.isVisible())) {
    await page.waitForTimeout(220);
  }

  if (!(await readMoreButton.isVisible())) {
    await blogCard.hover();
    await page.waitForTimeout(220);
  }

  await expect(readMoreButton).toBeVisible();
}

export async function expectPreAnswerVariant(page: Page, variant: string, exists: boolean): Promise<void> {
  const hasVariant = await page.evaluate((targetVariant) => {
    const raw = sessionStorage.getItem('vt:pre-answers');
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return Boolean(parsed[targetVariant]);
    } catch {
      return false;
    }
  }, variant);

  expect(hasVariant).toBe(exists);
}

export async function expectBodyScrollLock(page: Page, expectedLocked: boolean): Promise<void> {
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow === 'hidden').toBe(expectedLocked);
}
