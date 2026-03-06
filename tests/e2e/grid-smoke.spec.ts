import {expect, test} from '@playwright/test';

test.describe('Phase 4 grid smoke', () => {
  test('@smoke desktop wide row rules and underfilled final row contract', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'desktop');
    await expect(shell).toHaveAttribute('data-row1-columns', '3');
    await expect(shell).toHaveAttribute('data-rown-columns', '4');

    const row0 = page.getByTestId('landing-grid-row-0');
    const row1 = page.getByTestId('landing-grid-row-1');
    const row2 = page.getByTestId('landing-grid-row-2');

    await expect(row0).toHaveAttribute('data-row-role', 'hero');
    await expect(row0).toHaveAttribute('data-columns', '3');
    await expect(row0).toHaveAttribute('data-card-count', '3');

    await expect(row1).toHaveAttribute('data-row-role', 'main');
    await expect(row1).toHaveAttribute('data-columns', '4');
    await expect(row1).toHaveAttribute('data-card-count', '4');

    await expect(row2).toHaveAttribute('data-columns', '4');
    await expect(row2).toHaveAttribute('data-card-count', '2');
    await expect(row2).toHaveAttribute('data-underfilled', 'true');

    const row0Cards = row0.getByTestId('landing-grid-card');
    const row1Cards = row1.getByTestId('landing-grid-card');
    const row2Cards = row2.getByTestId('landing-grid-card');

    await expect(row0Cards).toHaveCount(3);
    await expect(row1Cards).toHaveCount(4);
    await expect(row2Cards).toHaveCount(2);

    await expect(row0Cards.nth(2)).toHaveAttribute('data-card-seq', '2');
    await expect(row1Cards.first()).toHaveAttribute('data-card-seq', '3');

    const row1FirstBox = await row1Cards.first().boundingBox();
    const row2FirstBox = await row2Cards.first().boundingBox();
    const row2Box = await row2.boundingBox();

    expect(row1FirstBox).not.toBeNull();
    expect(row2FirstBox).not.toBeNull();
    expect(row2Box).not.toBeNull();

    const widthDelta = Math.abs((row1FirstBox?.width ?? 0) - (row2FirstBox?.width ?? 0));
    expect(widthDelta).toBeLessThanOrEqual(1);

    const leftAlignmentDelta = Math.abs((row2FirstBox?.x ?? 0) - (row2Box?.x ?? 0));
    expect(leftAlignmentDelta).toBeLessThanOrEqual(1);
  });

  test('@smoke desktop medium uses row1=2 and row2+=3', async ({page}) => {
    await page.setViewportSize({width: 1180, height: 980});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'desktop');
    await expect(shell).toHaveAttribute('data-row1-columns', '2');
    await expect(shell).toHaveAttribute('data-rown-columns', '3');

    await expect(page.getByTestId('landing-grid-row-0')).toHaveAttribute('data-card-count', '2');
    await expect(page.getByTestId('landing-grid-row-1')).toHaveAttribute('data-card-count', '3');
  });

  test('@smoke desktop narrow is reachable and keeps row1=2 row2+=2', async ({page}) => {
    await page.setViewportSize({width: 1024, height: 980});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'desktop');
    await expect(shell).toHaveAttribute('data-row1-columns', '2');
    await expect(shell).toHaveAttribute('data-rown-columns', '2');

    await expect(page.getByTestId('landing-grid-row-0')).toHaveAttribute('data-card-count', '2');
    await expect(page.getByTestId('landing-grid-row-1')).toHaveAttribute('data-card-count', '2');
  });

  test('@smoke tablet wide uses hero=2 and main=3', async ({page}) => {
    await page.setViewportSize({width: 1023, height: 980});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'tablet');
    await expect(shell).toHaveAttribute('data-row1-columns', '2');
    await expect(shell).toHaveAttribute('data-rown-columns', '3');

    await expect(page.getByTestId('landing-grid-row-0')).toHaveAttribute('data-card-count', '2');
    await expect(page.getByTestId('landing-grid-row-1')).toHaveAttribute('data-card-count', '3');
  });

  test('@smoke tablet narrow uses hero=2 and main=2', async ({page}) => {
    await page.setViewportSize({width: 900, height: 980});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'tablet');
    await expect(shell).toHaveAttribute('data-row1-columns', '2');
    await expect(shell).toHaveAttribute('data-rown-columns', '2');

    await expect(page.getByTestId('landing-grid-row-0')).toHaveAttribute('data-card-count', '2');
    await expect(page.getByTestId('landing-grid-row-1')).toHaveAttribute('data-card-count', '2');
  });

  test('@smoke mobile keeps one-column rows', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto('/en');

    const shell = page.getByTestId('landing-grid-shell');
    await expect(shell).toHaveAttribute('data-grid-tier', 'mobile');
    await expect(shell).toHaveAttribute('data-row1-columns', '1');
    await expect(shell).toHaveAttribute('data-rown-columns', '1');

    await expect(page.getByTestId('landing-grid-row-0')).toHaveAttribute('data-columns', '1');
    await expect(page.getByTestId('landing-grid-row-1')).toHaveAttribute('data-columns', '1');
  });

  test('@smoke card type label is removed and subtitle clamp is consistent across rows', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 980});
    await page.goto('/en');

    await expect(page.locator('.landing-grid-card-kicker')).toHaveCount(0);

    const heroSubtitle = page.locator('[data-row-index="0"] .landing-grid-card-subtitle').first();
    const mainSubtitle = page.locator('[data-row-index="1"] .landing-grid-card-subtitle').first();

    const heroClamp = await heroSubtitle.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('-webkit-line-clamp').trim()
    );
    const mainClamp = await mainSubtitle.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('-webkit-line-clamp').trim()
    );

    expect(heroClamp).toBe('2');
    expect(mainClamp).toBe('2');
  });
});
