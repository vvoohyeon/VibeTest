import type {AppLocale} from '../../../src/config/site';
import {normalizeAllLandingCards} from '../../../src/features/landing/data/adapter';
import {landingRawFixtures} from '../../../src/features/landing/data/raw-fixtures';
import type {LandingCardType, LandingTestCard} from '../../../src/features/landing/data/types';

export const PRIMARY_AVAILABLE_TEST_VARIANT = 'qmbti';
export const PRIMARY_AVAILABLE_TEST_INGRESS_STORAGE_KEY =
  `vivetest-landing-ingress:${PRIMARY_AVAILABLE_TEST_VARIANT}`;
export const PRIMARY_OPT_OUT_TEST_VARIANT = 'energy-check';
export const PRIMARY_OPT_OUT_TEST_INGRESS_STORAGE_KEY = `vivetest-landing-ingress:${PRIMARY_OPT_OUT_TEST_VARIANT}`;
export const PRIMARY_BLOG_VARIANT = 'ops-handbook';
export const SECONDARY_BLOG_VARIANT = 'build-metrics';
export const NON_ENTERABLE_BLOG_VARIANT = 'hidden-beta';

export interface TestVariantInstructionFixture {
  variant: string;
  cardType: LandingCardType;
  instruction: string;
}

export const TEST_VARIANT_INSTRUCTION_FIXTURES_EN: ReadonlyArray<TestVariantInstructionFixture> =
  normalizeAllLandingCards(landingRawFixtures, 'en')
    .filter((card): card is LandingTestCard => card.type === 'test')
    .map((card) => ({
      variant: card.variant,
      cardType: card.cardType,
      instruction: card.test.instruction
    }));

export function buildLocalizedTestRoute(locale: AppLocale, variant: string): string {
  return `/${locale}/test/${variant}`;
}

export function buildLocalizedPrimaryTestRoute(locale: AppLocale): string {
  return buildLocalizedTestRoute(locale, PRIMARY_AVAILABLE_TEST_VARIANT);
}

export function buildLocalizedPrimaryOptOutTestRoute(locale: AppLocale): string {
  return buildLocalizedTestRoute(locale, PRIMARY_OPT_OUT_TEST_VARIANT);
}

export function buildLocalizedBlogIndexRoute(locale: AppLocale): string {
  return `/${locale}/blog`;
}

export function buildLocalizedBlogDetailRoute(locale: AppLocale, variant: string): string {
  return `/${locale}/blog/${variant}`;
}
