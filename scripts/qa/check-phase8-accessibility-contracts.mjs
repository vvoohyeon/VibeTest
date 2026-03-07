import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function fileExists(relativePath) {
  try {
    return statSync(path.join(rootDir, relativePath)).isFile();
  } catch {
    return false;
  }
}

function read(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

const requiredFiles = [
  'src/features/landing/grid/landing-grid-card.tsx',
  'src/features/landing/gnb/site-gnb.tsx',
  'tests/e2e/state-smoke.spec.ts'
];

for (const relativePath of requiredFiles) {
  if (!fileExists(relativePath)) {
    fail(`Missing required Phase 8 file: ${relativePath}`);
  }
}

if (fileExists('src/features/landing/grid/landing-grid-card.tsx')) {
  const cardFile = read('src/features/landing/grid/landing-grid-card.tsx');

  if (!/className="landing-grid-card-trigger"/u.test(cardFile) || !/type="button"/u.test(cardFile)) {
    fail('LandingGridCard must render a semantic primary trigger button.');
  }

  if (/role="button"/u.test(cardFile)) {
    fail('LandingGridCard must not regress to role="button" fallback semantics.');
  }

  if (!/data-testid="landing-grid-card-trigger"/u.test(cardFile)) {
    fail('LandingGridCard must expose primary trigger marker for keyboard smoke coverage.');
  }
}

if (fileExists('src/features/landing/gnb/site-gnb.tsx')) {
  const gnbFile = read('src/features/landing/gnb/site-gnb.tsx');

  if (!/aria-label=\{t\('settings'\)\}/u.test(gnbFile)) {
    fail('Desktop settings trigger must expose an aria-label.');
  }

  if (!/menuAria/u.test(gnbFile) || !/closeMenuAria/u.test(gnbFile) || !/backAria/u.test(gnbFile)) {
    fail('GNB triggers must wire menu/back aria-label message keys.');
  }
}

if (fileExists('src/app/globals.css')) {
  const css = read('src/app/globals.css');
  if (!/:has\(:focus-visible\)/u.test(css)) {
    fail('Card shell focus-visible contract must remain in global styles.');
  }
}

if (fileExists('tests/e2e/state-smoke.spec.ts')) {
  const e2eSpec = read('tests/e2e/state-smoke.spec.ts');
  if (!/landing-grid-card-trigger/u.test(e2eSpec)) {
    fail('State smoke spec must assert focus movement against the semantic trigger.');
  }
}

if (errors.length > 0) {
  console.error('Phase 8 accessibility contract checks failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 8 accessibility contract checks passed.');
