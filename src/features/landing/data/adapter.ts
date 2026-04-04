import {defaultLocale, type AppLocale} from '@/config/site';
import {
  deriveAvailability,
  isCatalogVisibleCard,
  isEnterableCard,
  resolveCardType
} from '@/features/landing/data/card-type';
import {getLandingRawFixtures} from '@/features/landing/data/raw-fixtures';
import type {TelemetryConsentState} from '@/features/landing/telemetry/types';
import type {
  LandingBlogCard,
  LandingCard,
  LandingCatalogAudience,
  LandingContentType,
  LandingTestCard,
  LocalizedStringList,
  LocalizedText
} from '@/features/landing/data/types';

const DEFAULT_CATALOG_AUDIENCE = 'end-user';
const LANDING_VARIANT_PATTERN = /^[a-z0-9-]+$/u;
const LANDING_CARD_ALLOWED_KEYS = new Set([
  'variant',
  'type',
  'cardType',
  'availability',
  'unavailable',
  'title',
  'subtitle',
  'tags',
  'isHero',
  'debug',
  'sample',
  'test',
  'blog'
]);
const RAW_TEST_ALLOWED_KEYS = new Set(['instruction', 'previewQuestion', 'answerChoiceA', 'answerChoiceB', 'meta']);
const RAW_TEST_META_ALLOWED_KEYS = new Set(['estimatedMinutes', 'shares', 'attempts']);
const RAW_BLOG_ALLOWED_KEYS = new Set(['meta']);
const RAW_BLOG_META_ALLOWED_KEYS = new Set(['readMinutes', 'shares', 'views']);

type LooseRecord = Record<string, unknown>;
type LooseRawLandingCard = LooseRecord & {
  test?: LooseRecord;
  blog?: LooseRecord;
};

export interface LandingCatalogOptions {
  audience?: LandingCatalogAudience;
  consentState?: TelemetryConsentState;
}

function asLocalizedText(value: LocalizedText | string | undefined): LocalizedText {
  if (typeof value === 'string') {
    return {default: value};
  }

  return value && typeof value === 'object' ? value : {};
}

function asLocalizedStringList(
  value: LocalizedStringList | ReadonlyArray<string> | undefined
): LocalizedStringList {
  if (Array.isArray(value)) {
    return {default: value};
  }

  if (value && typeof value === 'object') {
    return value as LocalizedStringList;
  }

  return {};
}

function resolveLocalizedText(value: LocalizedText | string | undefined, locale: AppLocale): string {
  const normalized = asLocalizedText(value);

  const direct = normalized[locale];
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }

  const fallbackLocaleText = normalized[defaultLocale];
  if (typeof fallbackLocaleText === 'string' && fallbackLocaleText.trim().length > 0) {
    return fallbackLocaleText;
  }

  if (typeof normalized.default === 'string' && normalized.default.trim().length > 0) {
    return normalized.default;
  }

  for (const candidate of Object.values(normalized)) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return '';
}

function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

function resolveLocalizedTagList(
  value: LocalizedStringList | ReadonlyArray<string> | undefined,
  locale: AppLocale
): string[] {
  const normalized = asLocalizedStringList(value);

  const direct = normalizeTagList(normalized[locale]);
  if (direct.length > 0) {
    return direct;
  }

  const fallbackLocaleTags = normalizeTagList(normalized[defaultLocale]);
  if (fallbackLocaleTags.length > 0) {
    return fallbackLocaleTags;
  }

  const defaultTags = normalizeTagList(normalized.default);
  if (defaultTags.length > 0) {
    return defaultTags;
  }

  for (const candidate of Object.values(normalized)) {
    const candidateTags = normalizeTagList(candidate);
    if (candidateTags.length > 0) {
      return candidateTags;
    }
  }

  return [];
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

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

function assertHasRequiredKey(value: LooseRecord, key: string, context: string): void {
  if (!(key in value)) {
    throw new Error(`${context} is missing required key "${key}".`);
  }
}

function assertHasRequiredKeys(value: LooseRecord, keys: ReadonlyArray<string>, context: string): void {
  for (const key of keys) {
    assertHasRequiredKey(value, key, context);
  }
}

function normalizeType(value: unknown, variant: string): LandingContentType {
  if (value === 'test' || value === 'blog') {
    return value;
  }

  throw new Error(`Landing card "${variant}" must declare type "test" or "blog".`);
}

function normalizeVariant(value: unknown, index: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Landing card at index ${index} is missing required top-level variant.`);
  }

  const variant = value.trim();
  if (!LANDING_VARIANT_PATTERN.test(variant)) {
    throw new Error(`Landing card "${variant}" must match ${LANDING_VARIANT_PATTERN}.`);
  }

  return variant;
}

function assertRawLandingCardShape(rawCard: LooseRawLandingCard, variant: string, type: LandingContentType): void {
  assertAllowedKeys(rawCard, LANDING_CARD_ALLOWED_KEYS, `Landing card "${variant}"`);
  assertHasRequiredKeys(rawCard, ['title', 'subtitle', 'tags'], `Landing card "${variant}"`);

  if (type === 'test') {
    if (rawCard.blog !== undefined) {
      throw new Error(`Landing test card "${variant}" must not define blog payload.`);
    }

    if (!isPlainRecord(rawCard.test)) {
      throw new Error(`Landing test card "${variant}" must define test payload.`);
    }

    assertAllowedKeys(rawCard.test, RAW_TEST_ALLOWED_KEYS, `Landing test card "${variant}"`);
    assertHasRequiredKeys(
      rawCard.test,
      ['instruction', 'previewQuestion', 'answerChoiceA', 'answerChoiceB', 'meta'],
      `Landing test card "${variant}"`
    );

    if (!isPlainRecord(rawCard.test.meta)) {
      throw new Error(`Landing test card "${variant}" must define test.meta payload.`);
    }

    assertAllowedKeys(rawCard.test.meta, RAW_TEST_META_ALLOWED_KEYS, `Landing test card "${variant}" test.meta`);
    assertHasRequiredKeys(rawCard.test.meta, ['estimatedMinutes', 'shares', 'attempts'], `Landing test card "${variant}" test.meta`);
    return;
  }

  if (rawCard.test !== undefined) {
    throw new Error(`Landing blog card "${variant}" must not define test payload.`);
  }

  if (!isPlainRecord(rawCard.blog)) {
    throw new Error(`Landing blog card "${variant}" must define blog payload.`);
  }

  assertAllowedKeys(rawCard.blog, RAW_BLOG_ALLOWED_KEYS, `Landing blog card "${variant}"`);
  assertHasRequiredKeys(rawCard.blog, ['meta'], `Landing blog card "${variant}"`);

  if (!isPlainRecord(rawCard.blog.meta)) {
    throw new Error(`Landing blog card "${variant}" must define blog.meta payload.`);
  }

  assertAllowedKeys(rawCard.blog.meta, RAW_BLOG_META_ALLOWED_KEYS, `Landing blog card "${variant}" blog.meta`);
  assertHasRequiredKeys(rawCard.blog.meta, ['readMinutes', 'shares', 'views'], `Landing blog card "${variant}" blog.meta`);
}

function assertUniqueVariants(rawCards: ReadonlyArray<LooseRawLandingCard>): void {
  const seenVariants = new Set<string>();

  rawCards.forEach((rawCard, index) => {
    const variant = normalizeVariant(rawCard.variant, index);
    if (seenVariants.has(variant)) {
      throw new Error(`Landing variant "${variant}" must be globally unique across test and blog cards.`);
    }
    seenVariants.add(variant);
  });
}

export function normalizeAllLandingCards(
  rawCards: ReadonlyArray<unknown>,
  locale: AppLocale
): LandingCard[] {
  const looseCards = rawCards.map((rawCard, index) => {
    if (!isPlainRecord(rawCard)) {
      throw new Error(`Landing card at index ${index} must be an object.`);
    }

    return rawCard as LooseRawLandingCard;
  });
  assertUniqueVariants(looseCards);

  return looseCards.map((rawCard, index) => {
    const variant = normalizeVariant(rawCard.variant, index);
    const type = normalizeType(rawCard.type, variant);
    assertRawLandingCardShape(rawCard, variant, type);
    const cardType = resolveCardType(rawCard as {
      cardType?: unknown;
      availability?: unknown;
      unavailable?: unknown;
      debug?: unknown;
    });
    const availability = deriveAvailability(cardType);
    const title = resolveLocalizedText(rawCard.title as LocalizedText | string | undefined, locale);
    const subtitle = resolveLocalizedText(rawCard.subtitle as LocalizedText | string | undefined, locale);
    const tags = resolveLocalizedTagList(rawCard.tags as LocalizedStringList | ReadonlyArray<string> | undefined, locale);
    const isHero = rawCard.isHero === true;
    const debug = rawCard.debug === true;
    const sample = rawCard.sample === true;

    if (type === 'blog') {
      const blog = rawCard.blog as LooseRecord & {
        meta: LooseRecord & {
          readMinutes?: unknown;
          shares?: unknown;
          views?: unknown;
        };
      };
      const normalizedBlogCard: LandingBlogCard = {
        variant,
        type,
        cardType,
        availability,
        title,
        subtitle,
        tags,
        isHero,
        debug,
        sample,
        localeResolvedText: {
          title,
          subtitle
        },
        blog: {
          meta: {
            readMinutes: normalizeNumber(blog.meta?.readMinutes),
            shares: normalizeNumber(blog.meta?.shares),
            views: normalizeNumber(blog.meta?.views)
          }
        }
      };

      return normalizedBlogCard;
    }

    const test = rawCard.test as LooseRecord & {
      instruction?: LocalizedText | string;
      previewQuestion?: LocalizedText | string;
      answerChoiceA?: LocalizedText | string;
      answerChoiceB?: LocalizedText | string;
      meta: LooseRecord & {
        estimatedMinutes?: unknown;
        shares?: unknown;
        attempts?: unknown;
      };
    };
    const instruction = resolveLocalizedText(test.instruction, locale);
    const previewQuestion = resolveLocalizedText(test.previewQuestion, locale);
    const answerChoiceA = resolveLocalizedText(test.answerChoiceA, locale);
    const answerChoiceB = resolveLocalizedText(test.answerChoiceB, locale);

    const normalizedTestCard: LandingTestCard = {
      variant,
      type,
      cardType,
      availability,
      title,
      subtitle,
      tags,
      isHero,
      debug,
      sample,
      localeResolvedText: {
        title,
        subtitle,
        instruction,
        previewQuestion,
        answerChoiceA,
        answerChoiceB
      },
      test: {
        instruction,
        previewQuestion,
        answerChoiceA,
        answerChoiceB,
        meta: {
          estimatedMinutes: normalizeNumber(test.meta?.estimatedMinutes),
          shares: normalizeNumber(test.meta?.shares),
          attempts: normalizeNumber(test.meta?.attempts)
        }
      }
    };

    return normalizedTestCard;
  });
}

export const normalizeLandingCards = normalizeAllLandingCards;

export function filterLandingCatalog(cards: ReadonlyArray<LandingCard>, options: LandingCatalogOptions = {}): LandingCard[] {
  const audience = options.audience ?? DEFAULT_CATALOG_AUDIENCE;
  const consentState = options.consentState ?? 'UNKNOWN';

  return cards.filter((card) =>
    isCatalogVisibleCard(card, {
      audience,
      consentState
    })
  );
}

export function createLandingCatalog(locale: AppLocale, options: LandingCatalogOptions = {}): LandingCard[] {
  return filterLandingCatalog(normalizeAllLandingCards(getLandingRawFixtures(), locale), options);
}

export function findLandingCardByVariant(locale: AppLocale, variant: string): LandingCard | null {
  return normalizeAllLandingCards(getLandingRawFixtures(), locale).find((card) => card.variant === variant) ?? null;
}

export function findLandingTestCardByVariant(locale: AppLocale, variant: string): LandingTestCard | null {
  return (
    normalizeAllLandingCards(getLandingRawFixtures(), locale).find(
      (card): card is LandingTestCard => card.type === 'test' && card.variant === variant
    ) ?? null
  );
}

export function findLandingBlogCardByVariant(locale: AppLocale, variant: string): LandingBlogCard | null {
  return (
    normalizeAllLandingCards(getLandingRawFixtures(), locale).find(
      (card): card is LandingBlogCard => card.type === 'blog' && card.variant === variant
    ) ?? null
  );
}

export function listEnterableBlogCards(locale: AppLocale): LandingBlogCard[] {
  return normalizeAllLandingCards(getLandingRawFixtures(), locale).filter(
    (card): card is LandingBlogCard => card.type === 'blog' && isEnterableCard(card)
  );
}
