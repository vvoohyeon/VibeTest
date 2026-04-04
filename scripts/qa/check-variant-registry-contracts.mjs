import {readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function walk(relativeDir, results = []) {
  const absoluteDir = path.join(rootDir, relativeDir);

  for (const entry of readdirSync(absoluteDir, {withFileTypes: true})) {
    const relativePath = path.join(relativeDir, entry.name);

    if (
      relativePath.startsWith('docs/archive') ||
      relativePath.startsWith('src/features/variant-registry') ||
      relativePath === 'scripts/qa/check-variant-registry-contracts.mjs'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(relativePath, results);
      continue;
    }

    results.push(relativePath);
  }

  return results;
}

function read(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function exists(relativePath) {
  try {
    return statSync(path.join(rootDir, relativePath)).isFile();
  } catch {
    return false;
  }
}

const scanRoots = ['src', 'tests', 'scripts', 'docs'];
const scanFiles = scanRoots.flatMap((relativeDir) => walk(relativeDir));
const activeDocs = new Set([
  'docs/req-landing.md',
  'docs/req-test.md',
  'docs/project-analysis.md',
  'docs/req-test-plan.md'
]);

const bannedIdentifiers = [
  {label: 'legacy cardType identifier', pattern: /\bcardType\b/u},
  {label: 'legacy blogSummary identifier', pattern: /\bblogSummary\b/u},
  {label: 'legacy articleId identifier', pattern: /\barticleId\b/u},
  {label: 'legacy thumbnailOrIcon identifier', pattern: /\bthumbnailOrIcon\b/u},
  {label: 'legacy isHero identifier', pattern: /\bisHero\b/u}
];

for (const relativePath of scanFiles) {
  const file = read(relativePath);

  for (const {label, pattern} of bannedIdentifiers) {
    if (pattern.test(file)) {
      fail(`Forbidden identifier "${label}" must not appear in ${relativePath}.`);
    }
  }

  if (!relativePath.startsWith('docs/') && /\bsummary\b/u.test(file)) {
    fail(`Legacy summary field/selector token must not appear in ${relativePath}.`);
  }
}

const importBanPattern =
  /from ['"][^'"]*(?:\/raw-fixtures|\/source-fixture|\/variant-registry\.generated)['"]/u;

for (const relativePath of scanFiles.filter((file) => !file.startsWith('docs/'))) {
  const file = read(relativePath);

  if (importBanPattern.test(file)) {
    fail(`Only the registry layer may import fixture/generated registry sources directly: ${relativePath}.`);
  }
}

const consumerPreviewLeakFiles = [
  'src/app/[locale]/test/[variant]/page.tsx',
  'src/features/test/question-bank.ts',
  'src/features/test/test-question-client.tsx',
  'src/features/landing/grid/landing-grid-card.tsx',
  'src/features/landing/blog/server-model.ts',
  'src/features/landing/blog/blog-destination-client.tsx'
];

for (const relativePath of consumerPreviewLeakFiles) {
  if (!exists(relativePath)) {
    continue;
  }

  const file = read(relativePath);

  if (/testPreviewPayloadByVariant/u.test(file)) {
    fail(`Consumer code must not read testPreviewPayloadByVariant directly: ${relativePath}.`);
  }

  if (/\.test\.(previewQuestion|answerChoiceA|answerChoiceB)\b/u.test(file)) {
    fail(`Consumer code must resolve preview payload only through resolveTestPreviewPayload(): ${relativePath}.`);
  }
}

if (exists('src/features/landing/grid/landing-grid-card.tsx')) {
  const cardFile = read('src/features/landing/grid/landing-grid-card.tsx');

  if (!/data-card-attribute=\{card\.attribute\}/u.test(cardFile)) {
    fail('LandingGridCard must expose data-card-attribute from the resolved card attribute.');
  }
}

for (const relativePath of activeDocs) {
  if (!exists(relativePath)) {
    fail(`Missing active contract doc: ${relativePath}.`);
    continue;
  }
}

if (errors.length > 0) {
  console.error('Variant registry contract checks failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Variant registry contract checks passed.');
