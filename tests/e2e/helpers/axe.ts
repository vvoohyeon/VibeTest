import {expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function formatViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  if (violations.length === 0) {
    return '';
  }

  return violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .map((target) => (Array.isArray(target) ? target.join(' ') : String(target)))
        .join(', ');
      return `${violation.id}: ${violation.help} (${targets})`;
    })
    .join('\n');
}

export async function expectPageToBeAxeClean(page: Page) {
  const results = await new AxeBuilder({page}).analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}
