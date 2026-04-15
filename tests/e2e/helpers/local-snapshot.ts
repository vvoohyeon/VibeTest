import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

import {expect, type Locator, type TestInfo} from '@playwright/test';

async function ensureSnapshotDirectory(snapshotPath: string) {
  await mkdir(dirname(snapshotPath), {recursive: true});
}

export async function expectLocatorToMatchLocalSnapshot(locator: Locator, snapshotName: string, testInfo: TestInfo) {
  const snapshotPath = testInfo.snapshotPath(snapshotName, {kind: 'screenshot'});
  if (existsSync(snapshotPath)) {
    await expect(locator).toHaveScreenshot(snapshotName);
    return;
  }

  await ensureSnapshotDirectory(snapshotPath);
  await locator.screenshot({path: snapshotPath});
}

export async function expectBufferToMatchLocalSnapshot(actual: Buffer, snapshotName: string, testInfo: TestInfo) {
  const snapshotPath = testInfo.snapshotPath(snapshotName, {kind: 'screenshot'});
  if (existsSync(snapshotPath)) {
    expect(actual).toMatchSnapshot(snapshotName);
    return;
  }

  await ensureSnapshotDirectory(snapshotPath);
  await writeFile(snapshotPath, actual);
}
