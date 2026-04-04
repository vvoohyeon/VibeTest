import type {FixtureContractReport, VariantRegistry} from '@/features/variant-registry/types';
import {resolveLocalizedTagsForInspection, resolveLocalizedTextForInspection} from '@/features/variant-registry/localization';

function hasLongToken(value: string): boolean {
  return /[A-Za-z0-9_\-]{30,}/u.test(value);
}

export function buildFixtureContractReport(registry: VariantRegistry): FixtureContractReport {
  const testCount = registry.landingCards.filter((card) => card.type === 'test').length;
  const blogCount = registry.landingCards.filter((card) => card.type === 'blog').length;
  const attributeCounts = registry.landingCards.reduce<Record<string, number>>((counts, card) => {
    counts[card.attribute] = (counts[card.attribute] ?? 0) + 1;
    return counts;
  }, {});

  const hasLongTokenSubtitle = registry.landingCards.some((card) =>
    hasLongToken(resolveLocalizedTextForInspection(card.subtitle))
  );
  const hasLongBlogSubtitle = registry.landingCards
    .filter((card) => card.type === 'blog')
    .some((card) => resolveLocalizedTextForInspection(card.subtitle).length >= 220);
  const hasEmptyTags = registry.landingCards.some((card) => resolveLocalizedTagsForInspection(card.tags).length === 0);
  const hasDebugSample = registry.landingCards.some((card) => card.debug === true || card.sample === true);
  const hasRequiredSlotOmission = registry.landingCards.some((card) => {
    if (card.type === 'blog') {
      return false;
    }

    return !registry.testPreviewPayloadByVariant[card.variant];
  });

  return {
    testCount,
    blogCount,
    availableCount: attributeCounts.available ?? 0,
    unavailableCount: attributeCounts.unavailable ?? 0,
    optOutCount: attributeCounts.opt_out ?? 0,
    hideCount: attributeCounts.hide ?? 0,
    debugCount: attributeCounts.debug ?? 0,
    hasLongTokenSubtitle,
    hasLongBlogSubtitle,
    hasEmptyTags,
    hasDebugSample,
    hasRequiredSlotOmission
  };
}
