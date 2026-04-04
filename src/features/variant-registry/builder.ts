import {resolveAttribute} from '@/features/variant-registry/attribute';
import type {
  InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge,
  LandingMeta,
  LocalizedStringList,
  LocalizedText,
  VariantRegistry,
  VariantRegistryRuntimeLandingCard,
  VariantRegistrySourceBlogCard,
  VariantRegistrySourceCard,
  VariantRegistrySourceTestCard
} from '@/features/variant-registry/types';

const LANDING_VARIANT_PATTERN = /^[a-z0-9-]+$/u;
const SOURCE_CARD_ALLOWED_KEYS = new Set([
  'seq',
  'variant',
  'type',
  'attribute',
  'title',
  'subtitle',
  'tags',
  'meta',
  'debug',
  'sample',
  'instruction',
  'previewQuestion',
  'answerChoiceA',
  'answerChoiceB'
]);
const SOURCE_TEST_REQUIRED_KEYS = [
  'seq',
  'variant',
  'type',
  'attribute',
  'title',
  'subtitle',
  'tags',
  'meta',
  'instruction',
  'previewQuestion',
  'answerChoiceA',
  'answerChoiceB'
] as const;
const SOURCE_BLOG_REQUIRED_KEYS = ['seq', 'variant', 'type', 'attribute', 'title', 'subtitle', 'tags', 'meta'] as const;
const SOURCE_META_ALLOWED_KEYS = new Set(['durationM', 'sharedC', 'engagedC']);

type LooseRecord = Record<string, unknown>;

function isPlainRecord(value: unknown): value is LooseRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertAllowedKeys(value: LooseRecord, allowedKeys: ReadonlySet<string>, context: string): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${context} contains unexpected key "${key}".`);
    }
  }
}

function assertHasRequiredKeys(value: LooseRecord, keys: ReadonlyArray<string>, context: string): void {
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`${context} is missing required key "${key}".`);
    }
  }
}

function normalizeSeq(value: unknown, variant: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`Landing registry source "${variant}" must declare a positive integer seq.`);
  }

  return value as number;
}

function normalizeVariant(value: unknown, index: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Landing registry source row at index ${index} is missing required variant.`);
  }

  const variant = value.trim();
  if (!LANDING_VARIANT_PATTERN.test(variant)) {
    throw new Error(`Landing registry source "${variant}" must match ${LANDING_VARIANT_PATTERN}.`);
  }

  return variant;
}

function normalizeType(value: unknown, variant: string): 'test' | 'blog' {
  if (value === 'test' || value === 'blog') {
    return value;
  }

  throw new Error(`Landing registry source "${variant}" must declare type "test" or "blog".`);
}

function normalizeMeta(value: unknown, variant: string): LandingMeta {
  if (!isPlainRecord(value)) {
    throw new Error(`Landing registry source "${variant}" must define meta.`);
  }

  assertAllowedKeys(value, SOURCE_META_ALLOWED_KEYS, `Landing registry source "${variant}" meta`);
  assertHasRequiredKeys(value, ['durationM', 'sharedC', 'engagedC'], `Landing registry source "${variant}" meta`);

  return {
    durationM: normalizeMetric(value.durationM),
    sharedC: normalizeMetric(value.sharedC),
    engagedC: normalizeMetric(value.engagedC)
  };
}

function normalizeMetric(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeLocalizedText(value: unknown, context: string): LocalizedText | string {
  if (typeof value === 'string') {
    return value;
  }

  if (isPlainRecord(value)) {
    return value as LocalizedText;
  }

  throw new Error(`${context} must be a localized text map or string.`);
}

function normalizeLocalizedStringList(value: unknown, context: string): LocalizedStringList {
  if (Array.isArray(value)) {
    return {default: value.filter((tag): tag is string => typeof tag === 'string')};
  }

  if (isPlainRecord(value)) {
    return value as LocalizedStringList;
  }

  throw new Error(`${context} must be a localized string-list map.`);
}

function normalizePreviewBridge(
  rawCard: LooseRecord,
  variant: string
): InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge {
  return {
    previewQuestion: normalizeLocalizedText(
      rawCard.previewQuestion,
      `Landing registry source "${variant}" previewQuestion`
    ) as LocalizedText,
    answerChoiceA: normalizeLocalizedText(
      rawCard.answerChoiceA,
      `Landing registry source "${variant}" answerChoiceA`
    ) as LocalizedText,
    answerChoiceB: normalizeLocalizedText(
      rawCard.answerChoiceB,
      `Landing registry source "${variant}" answerChoiceB`
    ) as LocalizedText
  };
}

function normalizeSourceCard(rawCard: unknown, index: number): VariantRegistrySourceCard {
  if (!isPlainRecord(rawCard)) {
    throw new Error(`Landing registry source row at index ${index} must be an object.`);
  }

  assertAllowedKeys(rawCard, SOURCE_CARD_ALLOWED_KEYS, `Landing registry source row at index ${index}`);

  const variant = normalizeVariant(rawCard.variant, index);
  const type = normalizeType(rawCard.type, variant);
  const seq = normalizeSeq(rawCard.seq, variant);

  if (type === 'test') {
    assertHasRequiredKeys(rawCard, SOURCE_TEST_REQUIRED_KEYS as unknown as string[], `Landing registry source "${variant}"`);

    const normalizedTestCard: VariantRegistrySourceTestCard = {
      seq,
      variant,
      type,
      attribute: resolveAttribute({attribute: rawCard.attribute, availability: rawCard.availability, unavailable: rawCard.unavailable, debug: rawCard.debug}),
      title: normalizeLocalizedText(rawCard.title, `Landing registry source "${variant}" title`) as LocalizedText,
      subtitle: normalizeLocalizedText(rawCard.subtitle, `Landing registry source "${variant}" subtitle`) as LocalizedText,
      tags: normalizeLocalizedStringList(rawCard.tags, `Landing registry source "${variant}" tags`),
      meta: normalizeMeta(rawCard.meta, variant),
      debug: rawCard.debug === true,
      sample: rawCard.sample === true,
      instruction: normalizeLocalizedText(rawCard.instruction, `Landing registry source "${variant}" instruction`),
      ...normalizePreviewBridge(rawCard, variant)
    };

    return normalizedTestCard;
  }

  assertHasRequiredKeys(rawCard, SOURCE_BLOG_REQUIRED_KEYS as unknown as string[], `Landing registry source "${variant}"`);

  const normalizedBlogCard: VariantRegistrySourceBlogCard = {
    seq,
    variant,
    type,
    attribute: resolveAttribute({attribute: rawCard.attribute, availability: rawCard.availability, unavailable: rawCard.unavailable, debug: rawCard.debug}),
    title: normalizeLocalizedText(rawCard.title, `Landing registry source "${variant}" title`) as LocalizedText,
    subtitle: normalizeLocalizedText(rawCard.subtitle, `Landing registry source "${variant}" subtitle`) as LocalizedText,
    tags: normalizeLocalizedStringList(rawCard.tags, `Landing registry source "${variant}" tags`),
    meta: normalizeMeta(rawCard.meta, variant),
    debug: rawCard.debug === true,
    sample: rawCard.sample === true
  };

  return normalizedBlogCard;
}

function assertUniqueVariantAndSeq(sourceCards: ReadonlyArray<VariantRegistrySourceCard>): void {
  const seenVariants = new Set<string>();
  const seenSeqs = new Set<number>();

  for (const sourceCard of sourceCards) {
    if (seenVariants.has(sourceCard.variant)) {
      throw new Error(`Landing registry source variant "${sourceCard.variant}" must be globally unique.`);
    }

    if (seenSeqs.has(sourceCard.seq)) {
      throw new Error(`Landing registry source seq "${String(sourceCard.seq)}" must be globally unique.`);
    }

    seenVariants.add(sourceCard.variant);
    seenSeqs.add(sourceCard.seq);
  }
}

function buildRuntimeLandingCard(sourceCard: VariantRegistrySourceCard): VariantRegistryRuntimeLandingCard {
  if (sourceCard.type === 'test') {
    return {
      variant: sourceCard.variant,
      type: sourceCard.type,
      attribute: sourceCard.attribute,
      title: sourceCard.title,
      subtitle: sourceCard.subtitle,
      tags: sourceCard.tags,
      debug: sourceCard.debug === true,
      sample: sourceCard.sample === true,
      test: {
        instruction: sourceCard.instruction,
        meta: sourceCard.meta
      }
    };
  }

  return {
    variant: sourceCard.variant,
    type: sourceCard.type,
    attribute: sourceCard.attribute,
    title: sourceCard.title,
    subtitle: sourceCard.subtitle,
    tags: sourceCard.tags,
    debug: sourceCard.debug === true,
    sample: sourceCard.sample === true,
    blog: {
      meta: sourceCard.meta
    }
  };
}

export function buildVariantRegistry(sourceCards: ReadonlyArray<unknown>): VariantRegistry {
  const normalizedSourceCards = sourceCards.map((sourceCard, index) => normalizeSourceCard(sourceCard, index));
  assertUniqueVariantAndSeq(normalizedSourceCards);

  const sortedSourceCards = [...normalizedSourceCards].sort((left, right) => left.seq - right.seq);
  const landingCards = sortedSourceCards.map((sourceCard) => buildRuntimeLandingCard(sourceCard));
  const testPreviewPayloadByVariant = sortedSourceCards.reduce<
    Record<string, InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge>
  >((accumulator, sourceCard) => {
    if (sourceCard.type === 'test') {
      accumulator[sourceCard.variant] = {
        previewQuestion: sourceCard.previewQuestion,
        answerChoiceA: sourceCard.answerChoiceA,
        answerChoiceB: sourceCard.answerChoiceB
      };
    }

    return accumulator;
  }, {});

  return {
    landingCards,
    testPreviewPayloadByVariant
  };
}
