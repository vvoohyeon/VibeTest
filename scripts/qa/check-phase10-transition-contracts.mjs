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
  'src/features/landing/transition/runtime.ts',
  'src/features/landing/transition/use-landing-transition.ts',
  'src/features/landing/landing-runtime.tsx',
  'src/features/landing/test/test-question-client.tsx',
  'src/features/landing/blog/blog-destination-client.tsx',
  'tests/e2e/transition-telemetry-smoke.spec.ts'
];

for (const relativePath of requiredFiles) {
  if (!fileExists(relativePath)) {
    fail(`Missing required Phase 10 file: ${relativePath}`);
  }
}

if (fileExists('src/features/landing/transition/runtime.ts')) {
  const runtimeFile = read('src/features/landing/transition/runtime.ts');

  if (!/writePendingLandingTransition/u.test(runtimeFile) || !/saveLandingReturnScrollY/u.test(runtimeFile)) {
    fail('Transition runtime must persist pending transition state and return scrollY.');
  }

  if (!/writeLandingIngress/u.test(runtimeFile) || !/trackTransitionStart/u.test(runtimeFile)) {
    fail('Transition runtime must persist landing ingress and emit transition_start.');
  }

  if (!/completePendingLandingTransition/u.test(runtimeFile) || !/terminatePendingLandingTransition/u.test(runtimeFile)) {
    fail('Transition runtime must expose complete/fail-cancel helpers.');
  }
}

if (fileExists('src/features/landing/test/test-question-client.tsx')) {
  const questionClient = read('src/features/landing/test/test-question-client.tsx');

  if (!/consumeLandingIngress/u.test(questionClient) || !/markInstructionSeen/u.test(questionClient)) {
    fail('Test question client must separate ingress read/consume and persist instructionSeen.');
  }

  if (!/trackAttemptStart/u.test(questionClient) || !/trackFinalSubmit/u.test(questionClient)) {
    fail('Test question client must emit attempt_start and final_submit.');
  }
}

if (fileExists('src/features/landing/blog/blog-destination-client.tsx')) {
  const blogClient = read('src/features/landing/blog/blog-destination-client.tsx');
  if (!/completePendingLandingTransition/u.test(blogClient) || !/BLOG_FALLBACK_EMPTY/u.test(blogClient)) {
    fail('Blog destination client must complete transitions and handle empty fallback closure.');
  }
}

if (fileExists('tests/e2e/transition-telemetry-smoke.spec.ts')) {
  const e2eSpec = read('tests/e2e/transition-telemetry-smoke.spec.ts');
  if (!/attempt_start/u.test(e2eSpec) || !/final_submit/u.test(e2eSpec) || !/landing return restores scroll once/u.test(e2eSpec)) {
    fail('Transition smoke must cover attempt_start, final_submit, and one-shot scroll restoration.');
  }
}

if (errors.length > 0) {
  console.error('Phase 10 transition contract checks failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 10 transition contract checks passed.');
