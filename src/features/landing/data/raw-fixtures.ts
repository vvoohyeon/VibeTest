import type {RawLandingCard} from '@/features/landing/data/types';

export const landingRawFixtures: ReadonlyArray<RawLandingCard> = [
  {
    id: 'test-rhythm-a',
    type: 'test',
    availability: 'available',
    title: {
      en: 'Focus Rhythm A',
      kr: 'Focus Rhythm A'
    },
    subtitle: {
      en: 'Find your default deep-work cadence.',
      kr: 'Find your default deep-work cadence.'
    },
    thumbnailOrIcon: 'icon-test-rhythm-a',
    tags: ['focus', 'daily'],
    isHero: true,
    test: {
      variant: 'rhythm-a',
      previewQuestion: {
        en: 'When do you feel most focused?',
        kr: 'When do you feel most focused?'
      },
      answerChoiceA: {
        en: 'Early morning blocks',
        kr: 'Early morning blocks'
      },
      answerChoiceB: {
        en: 'Late-night sprints',
        kr: 'Late-night sprints'
      },
      meta: {
        estimatedMinutes: 3,
        shares: 2184,
        attempts: 15236
      }
    }
  },
  {
    id: 'test-rhythm-b',
    type: 'test',
    availability: 'available',
    title: {
      en: 'Focus Rhythm B',
      kr: 'Focus Rhythm B'
    },
    subtitle: {
      en: 'LONGTOKENWITHOUTBREAKS_ABCDEFGHIJKLMNOPQRSTUVWXYZ_1234567890_REPEAT_REPEAT_REPEAT',
      kr: 'LONGTOKENWITHOUTBREAKS_ABCDEFGHIJKLMNOPQRSTUVWXYZ_1234567890_REPEAT_REPEAT_REPEAT'
    },
    thumbnailOrIcon: 'icon-test-rhythm-b',
    tags: ['workflow'],
    test: {
      variant: 'rhythm-b',
      previewQuestion: {
        en: 'How often do interruptions break your pace?',
        kr: 'How often do interruptions break your pace?'
      },
      answerChoiceA: {
        en: 'Almost never',
        kr: 'Almost never'
      },
      answerChoiceB: {
        en: 'Multiple times each hour',
        kr: 'Multiple times each hour'
      },
      meta: {
        estimatedMinutes: 4,
        shares: 982,
        attempts: 8392
      }
    }
  },
  {
    id: 'test-debug-sample',
    type: 'test',
    availability: 'available',
    title: {
      en: 'Sample Debug Variant',
      kr: 'Sample Debug Variant'
    },
    subtitle: {
      en: 'Internal reference card for QA and snapshots.',
      kr: 'Internal reference card for QA and snapshots.'
    },
    thumbnailOrIcon: 'icon-test-debug',
    tags: [],
    debug: true,
    sample: true,
    test: {
      variant: 'debug-sample',
      previewQuestion: {
        en: 'Do you prefer deterministic or exploratory planning?',
        kr: 'Do you prefer deterministic or exploratory planning?'
      },
      answerChoiceA: {
        en: 'Deterministic',
        kr: 'Deterministic'
      },
      answerChoiceB: {
        en: 'Exploratory',
        kr: 'Exploratory'
      },
      meta: {
        estimatedMinutes: 2,
        shares: 74,
        attempts: 640
      }
    }
  },
  {
    id: 'test-energy-check',
    type: 'test',
    availability: 'available',
    title: {
      en: 'Energy Allocation Check',
      kr: 'Energy Allocation Check'
    },
    subtitle: {
      en: 'Identify where your mental load leaks each day.',
      kr: 'Identify where your mental load leaks each day.'
    },
    thumbnailOrIcon: 'icon-test-energy',
    tags: ['energy', 'planning'],
    test: {
      variant: 'energy-check',
      previewQuestion: {
        en: 'Which block drains your energy the most?',
        kr: 'Which block drains your energy the most?'
      },
      answerChoiceA: {
        en: 'Context switching',
        kr: 'Context switching'
      },
      answerChoiceB: {
        en: 'Long meetings',
        kr: 'Long meetings'
      },
      meta: {
        estimatedMinutes: 5,
        shares: 1445,
        attempts: 10448
      }
    }
  },
  {
    id: 'test-coming-soon-1',
    type: 'test',
    availability: 'unavailable',
    title: {
      en: 'Creativity Profile (Soon)',
      kr: 'Creativity Profile (Soon)'
    },
    subtitle: {
      en: 'Upcoming variant under editorial review.',
      kr: 'Upcoming variant under editorial review.'
    },
    thumbnailOrIcon: 'icon-test-coming-soon-1',
    tags: ['coming-soon'],
    test: {
      variant: 'creativity-profile',
      previewQuestion: {
        en: 'Placeholder preview question for upcoming card.',
        kr: 'Placeholder preview question for upcoming card.'
      },
      answerChoiceA: {
        en: 'Option A',
        kr: 'Option A'
      },
      answerChoiceB: {
        en: 'Option B',
        kr: 'Option B'
      },
      meta: {
        estimatedMinutes: 4,
        shares: 0,
        attempts: 0
      }
    }
  },
  {
    id: 'test-coming-soon-2',
    type: 'test',
    availability: 'unavailable',
    title: {
      en: 'Burnout Risk Signal (Soon)',
      kr: 'Burnout Risk Signal (Soon)'
    },
    subtitle: {
      en: 'Upcoming resilience check for recurring fatigue patterns.',
      kr: 'Upcoming resilience check for recurring fatigue patterns.'
    },
    thumbnailOrIcon: 'icon-test-coming-soon-2',
    tags: ['coming-soon', 'wellbeing'],
    test: {
      variant: 'burnout-risk',
      previewQuestion: {
        en: 'Placeholder preview question for upcoming card.',
        kr: 'Placeholder preview question for upcoming card.'
      },
      answerChoiceA: {
        en: 'Option A',
        kr: 'Option A'
      },
      answerChoiceB: {
        en: 'Option B',
        kr: 'Option B'
      },
      meta: {
        estimatedMinutes: 4,
        shares: 0,
        attempts: 0
      }
    }
  },
  {
    id: 'blog-ops-handbook',
    type: 'blog',
    availability: 'available',
    title: {
      en: 'Operational Handbook for Stable Releases',
      kr: 'Operational Handbook for Stable Releases'
    },
    subtitle: {
      en: 'Patterns to reduce release-day surprises.',
      kr: 'Patterns to reduce release-day surprises.'
    },
    thumbnailOrIcon: 'icon-blog-ops',
    tags: ['operations', 'release'],
    blog: {
      articleId: 'ops-handbook',
      summary: {
        en: 'This long-form article walks through incident posture, deployment sequencing, rollback ergonomics, observability baselines, and a practical checklist for reducing mean-time-to-detect and mean-time-to-recover. It intentionally includes extended prose so summary clamp and overflow rules can be validated against realistic payload sizes in both desktop and mobile layouts.',
        kr: 'This long-form article walks through incident posture, deployment sequencing, rollback ergonomics, observability baselines, and a practical checklist for reducing mean-time-to-detect and mean-time-to-recover. It intentionally includes extended prose so summary clamp and overflow rules can be validated against realistic payload sizes in both desktop and mobile layouts.'
      },
      meta: {
        readMinutes: 8,
        shares: 1920,
        views: 42401
      },
      primaryCTA: {
        en: 'Read more',
        kr: 'Read more'
      }
    }
  },
  {
    id: 'blog-build-metrics',
    type: 'blog',
    availability: 'available',
    title: {
      en: 'Build Metrics That Actually Matter',
      kr: 'Build Metrics That Actually Matter'
    },
    subtitle: {
      en: 'Avoid vanity charts and pick deterministic release indicators.',
      kr: 'Avoid vanity charts and pick deterministic release indicators.'
    },
    thumbnailOrIcon: 'icon-blog-build-metrics',
    tags: [],
    blog: {
      articleId: 'build-metrics',
      summary: {
        en: 'A compact field guide to selecting build-time, test-time, and runtime quality indicators that correlate with user outcomes.',
        kr: 'A compact field guide to selecting build-time, test-time, and runtime quality indicators that correlate with user outcomes.'
      },
      meta: {
        readMinutes: 6,
        shares: 1180,
        views: 21502
      },
      primaryCTA: {
        en: 'Read more',
        kr: 'Read more'
      }
    }
  },
  {
    id: 'blog-release-gate',
    type: 'blog',
    availability: 'available',
    title: {
      en: 'Designing a Reliable Release Gate',
      kr: 'Designing a Reliable Release Gate'
    },
    subtitle: {
      en: 'How to turn quality assumptions into blocking assertions.',
      kr: 'How to turn quality assumptions into blocking assertions.'
    },
    thumbnailOrIcon: 'icon-blog-release-gate',
    tags: ['qa', 'gate'],
    isHero: true,
    blog: {
      articleId: 'release-gate',
      summary: {
        en: 'A practical implementation strategy for layering static checks, deterministic state assertions, and e2e smoke contracts into one release boundary.',
        kr: 'A practical implementation strategy for layering static checks, deterministic state assertions, and e2e smoke contracts into one release boundary.'
      },
      meta: {
        readMinutes: 5,
        shares: 890,
        views: 17943
      },
      primaryCTA: {
        en: 'Read more',
        default: 'Read more'
      }
    }
  }
] as const;

export function getLandingRawFixtures(): RawLandingCard[] {
  return landingRawFixtures.map((card) => structuredClone(card));
}
