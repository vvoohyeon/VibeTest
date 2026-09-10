import {createChecker, fileExists, read} from './_utils.mjs';

const traceabilityFile = 'docs/blocker-traceability.json';
const blockerSourceFile = 'docs/req-landing.md';
const TRACEABILITY_ASSERTION_ID = 'assertion:B19-traceability-registry';
const allowedKinds = new Set(['automated_assertion', 'scenario_test', 'manual_checkpoint']);
const {fail, finish} = createChecker();

/**
 * §14.2 의 release-blocking 항목 번호를 문서에서 읽는다.
 *
 * 종전에는 상한이 `30` 으로 손에 적혀 있었고 §14.2 가 마침 30 개라 우연히 맞았다. 항목이
 * 하나 늘면 그 항목은 루프에 들어오지 않아 **실패가 아니라 침묵으로** 빠진다(원장 `L02`).
 * 그래서 개수를 문서에서 읽고, 읽지 못하면 그것 자체를 실패로 만든다 — 파싱이 조용히 0 을
 * 돌려주면 검사 전체가 무력화되기 때문이다.
 */
function readBlockerItemNumbers(content) {
  // 제목은 줄 단위로 정확히 맞춘다. `indexOf('### 14.2')` 는 `### 14.20` 같은 미래의 절에도
  // 걸려 엉뚱한 구간을 읽는다.
  const startMatch = /^### 14\.2\s/mu.exec(content);
  if (!startMatch) {
    return null;
  }

  const rest = content.slice(startMatch.index);
  const endMatch = /^### 14\.3\s/mu.exec(rest);
  if (!endMatch) {
    return null;
  }

  const numbers = new Set();
  for (const line of rest.slice(0, endMatch.index).split('\n')) {
    const matched = /^(\d+)\.\s/u.exec(line);
    if (matched) {
      numbers.add(Number(matched[1]));
    }
  }

  return numbers.size > 0 ? numbers : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function hasExecutableAssertionReference({content, file, assertionId}) {
  const escapedAssertionId = escapeRegex(assertionId);

  if (file.startsWith('tests/')) {
    return new RegExp(`\\b(?:test|it)\\s*\\(\\s*[\\s\\S]{0,200}?${escapedAssertionId}`, 'u').test(content);
  }

  if (file.startsWith('scripts/qa/')) {
    return new RegExp(`['"\`]${escapedAssertionId}['"\`]`, 'u').test(content);
  }

  return content.includes(assertionId);
}

function hasTraceabilityAnchor({content, file, assertionId, kind}) {
  if (kind === 'automated_assertion') {
    return hasExecutableAssertionReference({content, file, assertionId});
  }

  if (kind === 'manual_checkpoint') {
    return file.startsWith('docs/') && content.includes(assertionId);
  }

  if (kind === 'scenario_test') {
    if (file.startsWith('tests/') || file.startsWith('scripts/qa/')) {
      return hasExecutableAssertionReference({content, file, assertionId});
    }

    return file.startsWith('docs/') && content.includes(assertionId);
  }

  return false;
}

if (TRACEABILITY_ASSERTION_ID !== 'assertion:B19-traceability-registry') {
  fail('Traceability assertion ID drifted from the blocker 19 registry anchor.');
}

if (!fileExists(traceabilityFile)) {
  fail(`Missing traceability registry: ${traceabilityFile}`);
} else {
  const entries = JSON.parse(read(traceabilityFile));
  const blockers = new Set();

  for (const entry of entries) {
    if (typeof entry?.blocker !== 'number') {
      fail(`Traceability entry is missing numeric blocker: ${JSON.stringify(entry)}`);
      continue;
    }

    blockers.add(entry.blocker);

    if (typeof entry.file !== 'string' || entry.file.length === 0) {
      fail(`Traceability entry for blocker ${entry.blocker} is missing file.`);
      continue;
    }

    if (typeof entry.assertionId !== 'string' || entry.assertionId.length === 0) {
      fail(`Traceability entry for blocker ${entry.blocker} is missing assertionId.`);
      continue;
    }

    if (typeof entry.kind !== 'string' || !allowedKinds.has(entry.kind)) {
      fail(`Traceability entry for blocker ${entry.blocker} has invalid kind: ${JSON.stringify(entry.kind)}`);
      continue;
    }

    if (!fileExists(entry.file)) {
      fail(`Traceability entry points to missing file: ${entry.file}`);
      continue;
    }

    const content = read(entry.file);
    if (!content.includes(entry.assertionId)) {
      fail(`Traceability assertionId not found for blocker ${entry.blocker}: ${entry.assertionId}`);
      continue;
    }

    if (!hasTraceabilityAnchor({content, file: entry.file, assertionId: entry.assertionId, kind: entry.kind})) {
      fail(
        `Traceability assertionId is not anchored to the declared ${entry.kind} surface for blocker ${entry.blocker}: ${entry.assertionId}`
      );
    }
  }

  const declaredBlockers = fileExists(blockerSourceFile)
    ? readBlockerItemNumbers(read(blockerSourceFile))
    : null;

  if (!declaredBlockers) {
    fail(`Could not read the §14.2 release-blocking item numbers from ${blockerSourceFile}.`);
  } else {
    // 양방향 대조: 미등재(문서에 있는데 등록부에 없다)와 유령(등록부에 있는데 문서에 없다).
    for (const blocker of [...declaredBlockers].sort((a, b) => a - b)) {
      if (!blockers.has(blocker)) {
        fail(`Traceability registry is missing blocker ${blocker}.`);
      }
    }

    for (const blocker of [...blockers].sort((a, b) => a - b)) {
      if (!declaredBlockers.has(blocker)) {
        fail(`Traceability registry maps blocker ${blocker}, which ${blockerSourceFile} §14.2 does not declare.`);
      }
    }
  }
}

finish('Blocker traceability');
