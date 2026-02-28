import {landingFixture} from './fixtures';
import {LandingCard, LandingFixtureCard} from './types';

function normalizeRequired(value: string | undefined) {
  return typeof value === 'string' ? value : '';
}

function adaptCard(fixture: LandingFixtureCard): LandingCard {
  const availability = fixture.type === 'blog' ? 'available' : fixture.availability;

  return {
    id: normalizeRequired(fixture.id),
    type: fixture.type,
    availability,
    title: normalizeRequired(fixture.title),
    subtitle: normalizeRequired(fixture.subtitle),
    thumbnailOrIcon: normalizeRequired(fixture.thumbnailOrIcon),
    tags: Array.isArray(fixture.tags) ? fixture.tags : [],
    variant: fixture.variant,
    previewQuestion: normalizeRequired(fixture.previewQuestion),
    answerChoiceA: normalizeRequired(fixture.answerChoiceA),
    answerChoiceB: normalizeRequired(fixture.answerChoiceB),
    summary: normalizeRequired(fixture.summary),
    metaPrimary: normalizeRequired(fixture.metaPrimary),
    metaSecondary: normalizeRequired(fixture.metaSecondary),
    metaTertiary: normalizeRequired(fixture.metaTertiary),
    sourceParam: normalizeRequired(fixture.id)
  };
}

export function getLandingCards() {
  return landingFixture
    .filter((card) => (process.env.NODE_ENV === 'production' ? !card.isDebug : true))
    .map(adaptCard);
}
