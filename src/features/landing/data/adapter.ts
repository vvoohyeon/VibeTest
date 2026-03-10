import {defaultLocale, type AppLocale} from '@/config/site';
import {getLandingRawFixtures} from '@/features/landing/data/raw-fixtures';
import type {
  LandingAvailability,
  LandingBlogCard,
  LandingCard,
  LandingCardType,
  LandingTestCard,
  LocalizedText,
  RawBlogPayload,
  RawLandingCard,
  RawTestPayload
} from '@/features/landing/data/types';

const DEFAULT_THUMBNAIL_OR_ICON = 'icon-placeholder';
const DEFAULT_BLOG_PRIMARY_CTA: LocalizedText = {
  en: 'Read more',
  kr: 'Read more',
  default: 'Read more'
};
const DEFAULT_CATALOG_AUDIENCE = 'end-user';

type LooseRawLandingCard = Partial<RawLandingCard> & {
  test?: Partial<RawTestPayload>;
  blog?: Partial<RawBlogPayload>;
};

export type LandingCatalogAudience = 'end-user' | 'qa';

export interface LandingCatalogOptions {
  audience?: LandingCatalogAudience;
}

function asLocalizedText(value: LocalizedText | undefined): LocalizedText {
  return value && typeof value === 'object' ? value : {};
}

function resolveLocalizedText(value: LocalizedText | undefined, locale: AppLocale): string {
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

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

function normalizeType(value: unknown): LandingCardType {
  return value === 'blog' ? 'blog' : 'test';
}

function normalizeAvailability(value: unknown): LandingAvailability {
  return value === 'unavailable' ? 'unavailable' : 'available';
}

function shouldIncludeCard(card: Pick<LandingCard, 'debug' | 'sample'>, audience: LandingCatalogAudience): boolean {
  if (audience === 'qa') {
    return true;
  }

  return !card.debug && !card.sample;
}

export function normalizeLandingCards(
  rawCards: ReadonlyArray<Partial<RawLandingCard>>,
  locale: AppLocale,
  options: LandingCatalogOptions = {}
): LandingCard[] {
  const normalizedCards: LandingCard[] = [];
  const audience = options.audience ?? DEFAULT_CATALOG_AUDIENCE;

  for (const [index, inputCard] of rawCards.entries()) {
    const rawCard = (inputCard ?? {}) as LooseRawLandingCard;
    const type = normalizeType(rawCard.type);
    const availability = normalizeAvailability(rawCard.availability);

    if (type === 'blog' && availability === 'unavailable') {
      continue;
    }

    const id = normalizeString(rawCard.id, `missing-card-${index + 1}`);
    const title = resolveLocalizedText(rawCard.title, locale);
    const subtitle = resolveLocalizedText(rawCard.subtitle, locale);
    const thumbnailOrIcon = normalizeString(rawCard.thumbnailOrIcon, DEFAULT_THUMBNAIL_OR_ICON);
    const tags = normalizeTags(rawCard.tags);
    const isHero = rawCard.isHero === true;
    const debug = rawCard.debug === true;
    const sample = rawCard.sample === true;

    if (type === 'blog') {
      const blog = rawCard.blog ?? {};
      const sourceParam = normalizeString(blog.articleId, id);
      const summary = resolveLocalizedText(blog.summary, locale);
      const primaryCTA = resolveLocalizedText(blog.primaryCTA ?? DEFAULT_BLOG_PRIMARY_CTA, locale);

      const normalizedBlogCard: LandingBlogCard = {
        id,
        type,
        availability,
        title,
        subtitle,
        thumbnailOrIcon,
        tags,
        isHero,
        sourceParam,
        debug,
        sample,
        localeResolvedText: {
          title,
          subtitle,
          summary,
          primaryCTA
        },
        blog: {
          summary,
          primaryCTA,
          meta: {
            readMinutes: normalizeNumber(blog.meta?.readMinutes),
            shares: normalizeNumber(blog.meta?.shares),
            views: normalizeNumber(blog.meta?.views)
          }
        }
      };

      if (shouldIncludeCard(normalizedBlogCard, audience)) {
        normalizedCards.push(normalizedBlogCard);
      }
      continue;
    }

    const test = rawCard.test ?? {};
    const sourceParam = normalizeString(test.variant, id);
    const previewQuestion = resolveLocalizedText(test.previewQuestion, locale);
    const answerChoiceA = resolveLocalizedText(test.answerChoiceA, locale);
    const answerChoiceB = resolveLocalizedText(test.answerChoiceB, locale);

    const normalizedTestCard: LandingTestCard = {
      id,
      type,
      availability,
      title,
      subtitle,
      thumbnailOrIcon,
      tags,
      isHero,
      sourceParam,
      debug,
      sample,
      localeResolvedText: {
        title,
        subtitle,
        previewQuestion,
        answerChoiceA,
        answerChoiceB
      },
      test: {
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

    if (shouldIncludeCard(normalizedTestCard, audience)) {
      normalizedCards.push(normalizedTestCard);
    }
  }

  return normalizedCards;
}

export function createLandingCatalog(locale: AppLocale, options: LandingCatalogOptions = {}): LandingCard[] {
  return normalizeLandingCards(getLandingRawFixtures(), locale, options);
}
