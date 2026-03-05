import {defaultLocale} from '@/config/site';
import type {FixtureContractReport, LocalizedText, RawLandingCard} from '@/features/landing/data/types';

function hasLongToken(value: string): boolean {
  return /[A-Za-z0-9_\-]{30,}/u.test(value);
}

function resolveForInspection(text: LocalizedText | undefined): string {
  if (!text || typeof text !== 'object') {
    return '';
  }

  if (typeof text[defaultLocale] === 'string') {
    return text[defaultLocale];
  }

  if (typeof text.default === 'string') {
    return text.default;
  }

  for (const candidate of Object.values(text)) {
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return '';
}

function hasRequiredSlotOmission(card: RawLandingCard): boolean {
  if (!card.id || !card.type || !card.availability) {
    return true;
  }

  if (!card.title || !card.subtitle || !card.thumbnailOrIcon || !Array.isArray(card.tags)) {
    return true;
  }

  if (card.type === 'test') {
    return (
      !card.test ||
      !card.test.variant ||
      !card.test.previewQuestion ||
      !card.test.answerChoiceA ||
      !card.test.answerChoiceB ||
      !card.test.meta
    );
  }

  return !card.blog || !card.blog.articleId || !card.blog.summary || !card.blog.meta;
}

export function buildFixtureContractReport(fixtures: ReadonlyArray<RawLandingCard>): FixtureContractReport {
  const testCount = fixtures.filter((card) => card.type === 'test').length;
  const blogCount = fixtures.filter((card) => card.type === 'blog').length;
  const unavailableTestCount = fixtures.filter(
    (card) => card.type === 'test' && card.availability === 'unavailable'
  ).length;
  const unavailableBlogCount = fixtures.filter(
    (card) => card.type === 'blog' && card.availability === 'unavailable'
  ).length;

  const hasLongTokenSubtitle = fixtures.some((card) => hasLongToken(resolveForInspection(card.subtitle)));
  const hasLongBodyText = fixtures
    .filter((card) => card.type === 'blog')
    .some((card) => resolveForInspection(card.blog.summary).length >= 220);
  const hasEmptyTags = fixtures.some((card) => card.tags.length === 0);
  const hasDebugSample = fixtures.some((card) => card.debug === true || card.sample === true);
  const hasRequiredSlotOmissionValue = fixtures.some((card) => hasRequiredSlotOmission(card));

  return {
    testCount,
    blogCount,
    unavailableTestCount,
    unavailableBlogCount,
    hasLongTokenSubtitle,
    hasLongBodyText,
    hasEmptyTags,
    hasDebugSample,
    hasRequiredSlotOmission: hasRequiredSlotOmissionValue
  };
}
