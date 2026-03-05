import {describe, expect, it} from 'vitest';

import {createLandingCatalog, normalizeLandingCards} from '../../src/features/landing/data/adapter';
import {buildFixtureContractReport} from '../../src/features/landing/data/fixture-contract';
import {landingRawFixtures} from '../../src/features/landing/data/raw-fixtures';
import type {RawLandingCard} from '../../src/features/landing/data/types';

describe('landing fixture and adapter contract', () => {
  it('satisfies fixture minimum counts and diversity requirements', () => {
    const report = buildFixtureContractReport(landingRawFixtures);

    expect(report.testCount).toBeGreaterThanOrEqual(4);
    expect(report.blogCount).toBeGreaterThanOrEqual(3);
    expect(report.unavailableTestCount).toBeGreaterThanOrEqual(2);
    expect(report.unavailableBlogCount).toBe(0);

    expect(report.hasLongTokenSubtitle).toBe(true);
    expect(report.hasLongBodyText).toBe(true);
    expect(report.hasEmptyTags).toBe(true);
    expect(report.hasDebugSample).toBe(true);
    expect(report.hasRequiredSlotOmission).toBe(false);
  });

  it('normalizes locale text with fallback and blocks unavailable blog cards', () => {
    const catalogKr = createLandingCatalog('kr');

    const releaseGateBlog = catalogKr.find((card) => card.id === 'blog-release-gate');
    expect(releaseGateBlog?.type).toBe('blog');
    if (!releaseGateBlog || releaseGateBlog.type !== 'blog') {
      throw new Error('Expected blog-release-gate to be present as a blog card');
    }

    expect(releaseGateBlog.blog.primaryCTA).toBe('Read more');
    expect(catalogKr.some((card) => card.type === 'blog' && card.availability === 'unavailable')).toBe(false);
  });

  it('inserts defaults for missing required slots instead of throwing', () => {
    const malformed: Array<Partial<RawLandingCard>> = [
      {
        id: 'broken-test',
        type: 'test',
        availability: 'available',
        tags: [''],
        test: {
          variant: ''
        }
      } as Partial<RawLandingCard>,
      {
        id: 'broken-blog',
        type: 'blog',
        availability: 'unavailable'
      } as Partial<RawLandingCard>
    ];

    expect(() => normalizeLandingCards(malformed, 'en')).not.toThrow();

    const normalized = normalizeLandingCards(malformed, 'en');
    expect(normalized).toHaveLength(1);

    const onlyCard = normalized[0];
    expect(onlyCard.type).toBe('test');
    expect(onlyCard.title).toBe('');
    expect(onlyCard.subtitle).toBe('');
    expect(onlyCard.thumbnailOrIcon).toBe('icon-placeholder');
    expect(onlyCard.tags).toEqual([]);
    expect(onlyCard.sourceParam).toBe('broken-test');

    if (onlyCard.type !== 'test') {
      throw new Error('Expected normalized card to be a test card');
    }

    expect(onlyCard.test.previewQuestion).toBe('');
    expect(onlyCard.test.answerChoiceA).toBe('');
    expect(onlyCard.test.answerChoiceB).toBe('');
    expect(onlyCard.test.meta).toEqual({
      estimatedMinutes: 0,
      shares: 0,
      attempts: 0
    });
  });
});
