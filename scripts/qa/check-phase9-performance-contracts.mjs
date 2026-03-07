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
  'src/features/landing/grid/landing-catalog-grid-loader.tsx',
  'src/features/landing/grid/landing-catalog-grid.tsx',
  'src/features/landing/grid/use-landing-interaction-controller.ts',
  'src/features/landing/gnb/hooks/use-gnb-capability.ts',
  'src/app/globals.css',
  'tests/e2e/routing-smoke.spec.ts',
  'tests/e2e/state-smoke.spec.ts',
  'tests/e2e/gnb-smoke.spec.ts'
];

for (const relativePath of requiredFiles) {
  if (!fileExists(relativePath)) {
    fail(`Missing required Phase 9 file: ${relativePath}`);
  }
}

if (fileExists('src/features/landing/grid/landing-catalog-grid-loader.tsx')) {
  const loaderFile = read('src/features/landing/grid/landing-catalog-grid-loader.tsx');

  if (/next\/dynamic/u.test(loaderFile) || /ssr:\s*false/u.test(loaderFile)) {
    fail('LandingCatalogGridLoader must not regress to dynamic ssr:false loading.');
  }

  if (!/LandingCatalogGrid/u.test(loaderFile)) {
    fail('LandingCatalogGridLoader must render LandingCatalogGrid directly for SSR-safe markup.');
  }
}

if (fileExists('src/features/landing/grid/landing-catalog-grid.tsx')) {
  const gridFile = read('src/features/landing/grid/landing-catalog-grid.tsx');

  if (!/INITIAL_VIEWPORT_WIDTH/u.test(gridFile) || !/useState<number>\(INITIAL_VIEWPORT_WIDTH\)/u.test(gridFile)) {
    fail('LandingCatalogGrid must keep an SSR-neutral viewport initializer.');
  }

  if (/readViewportWidth/u.test(gridFile)) {
    fail('LandingCatalogGrid must not rely on render-path viewport reads for SSR.');
  }
}

if (fileExists('src/features/landing/grid/use-landing-interaction-controller.ts')) {
  const controllerFile = read('src/features/landing/grid/use-landing-interaction-controller.ts');

  if (!/prefers-reduced-motion/u.test(controllerFile)) {
    fail('Interaction controller must continue syncing prefers-reduced-motion.');
  }

  if (!/useLayoutEffect/u.test(controllerFile)) {
    fail('Interaction controller must use pre-paint synchronization for capability/motion state.');
  }
}

if (fileExists('src/features/landing/gnb/hooks/use-gnb-capability.ts')) {
  const gnbCapabilityFile = read('src/features/landing/gnb/hooks/use-gnb-capability.ts');

  if (!/useLayoutEffect/u.test(gnbCapabilityFile)) {
    fail('GNB capability hook must initialize viewport/hover capability before first paint.');
  }
}

if (fileExists('src/app/globals.css')) {
  const css = read('src/app/globals.css');

  if (!/data-page-state='REDUCED_MOTION'/u.test(css) || !/prefers-reduced-motion:\s*reduce/u.test(css)) {
    fail('Global styles must expose explicit reduced-motion CSS paths.');
  }

  if (!/landing-card-shell-reduced-open/u.test(css) || !/landing-card-shell-reduced-close/u.test(css)) {
    fail('Global styles must define reduced-motion open/close motion tokens.');
  }
}

if (fileExists('tests/e2e/routing-smoke.spec.ts')) {
  const routingSpec = read('tests/e2e/routing-smoke.spec.ts');
  if (!/assertion:B1-hydration/u.test(routingSpec)) {
    fail('Routing smoke must keep hydration warning coverage.');
  }
}

if (fileExists('tests/e2e/state-smoke.spec.ts')) {
  const stateSpec = read('tests/e2e/state-smoke.spec.ts');
  if (!/reduced-motion shrinks desktop motion/u.test(stateSpec)) {
    fail('State smoke must cover reduced-motion and rapid interaction runtime safety.');
  }
}

if (fileExists('tests/e2e/gnb-smoke.spec.ts')) {
  const gnbSpec = read('tests/e2e/gnb-smoke.spec.ts');
  if (!/assertion:B3-desktop-settings/u.test(gnbSpec)) {
    fail('GNB smoke must keep desktop settings hover-open coverage.');
  }
}

if (errors.length > 0) {
  console.error('Phase 9 performance contract checks failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 9 performance contract checks passed.');
