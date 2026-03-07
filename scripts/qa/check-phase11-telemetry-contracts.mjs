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
  'src/features/landing/telemetry/runtime.ts',
  'src/features/landing/telemetry/validation.ts',
  'src/app/api/telemetry/route.ts',
  'tests/unit/landing-telemetry-validation.test.ts',
  'tests/e2e/theme-matrix-smoke.spec.ts'
];

for (const relativePath of requiredFiles) {
  if (!fileExists(relativePath)) {
    fail(`Missing required Phase 11 file: ${relativePath}`);
  }
}

if (fileExists('src/features/landing/telemetry/runtime.ts')) {
  const runtimeFile = read('src/features/landing/telemetry/runtime.ts');

  if (!/UNKNOWN/u.test(runtimeFile) || !/OPTED_OUT/u.test(runtimeFile) || !/OPTED_IN/u.test(runtimeFile)) {
    fail('Telemetry runtime must encode the consent state machine.');
  }

  if (!/randomUUID/u.test(runtimeFile) || !/getRandomValues/u.test(runtimeFile)) {
    fail('Telemetry runtime must prefer randomUUID -> getRandomValues for anonymous IDs.');
  }

  if (!/trackLandingView/u.test(runtimeFile) || !/trackTransitionStart/u.test(runtimeFile) || !/trackFinalSubmit/u.test(runtimeFile)) {
    fail('Telemetry runtime must expose V1 event helpers.');
  }
}

if (fileExists('src/features/landing/telemetry/validation.ts')) {
  const validationFile = read('src/features/landing/telemetry/validation.ts');
  if (!/Forbidden telemetry field/u.test(validationFile) || !/final_responses/u.test(validationFile)) {
    fail('Telemetry validation must reject forbidden fields and require final_responses completeness.');
  }
}

if (fileExists('tests/e2e/theme-matrix-smoke.spec.ts')) {
  const e2eSpec = read('tests/e2e/theme-matrix-smoke.spec.ts');
  if (!/toHaveScreenshot/u.test(e2eSpec)) {
    fail('Theme matrix smoke must capture screenshot baselines.');
  }
}

if (errors.length > 0) {
  console.error('Phase 11 telemetry contract checks failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 11 telemetry contract checks passed.');
