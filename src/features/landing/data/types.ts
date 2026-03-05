import type {AppLocale} from '@/config/site';

export type LandingCardType = 'test' | 'blog';
export type LandingAvailability = 'available' | 'unavailable';

export type LocalizedText = Partial<Record<AppLocale, string>> & {
  default?: string;
};

export interface RawTestPayload {
  variant: string;
  previewQuestion: LocalizedText;
  answerChoiceA: LocalizedText;
  answerChoiceB: LocalizedText;
  meta: {
    estimatedMinutes: number;
    shares: number;
    attempts: number;
  };
}

export interface RawBlogPayload {
  articleId: string;
  summary: LocalizedText;
  meta: {
    readMinutes: number;
    shares: number;
    views: number;
  };
  primaryCTA?: LocalizedText;
}

interface RawLandingCardCommon {
  id: string;
  type: LandingCardType;
  availability: LandingAvailability;
  title: LocalizedText;
  subtitle: LocalizedText;
  thumbnailOrIcon: string;
  tags: string[];
  isHero?: boolean;
  debug?: boolean;
  sample?: boolean;
}

export interface RawTestCard extends RawLandingCardCommon {
  type: 'test';
  test: RawTestPayload;
}

export interface RawBlogCard extends RawLandingCardCommon {
  type: 'blog';
  blog: RawBlogPayload;
}

export type RawLandingCard = RawTestCard | RawBlogCard;

export interface LocaleResolvedText {
  title: string;
  subtitle: string;
  previewQuestion?: string;
  answerChoiceA?: string;
  answerChoiceB?: string;
  summary?: string;
  primaryCTA?: string;
}

export interface LandingCardCommon {
  id: string;
  type: LandingCardType;
  availability: LandingAvailability;
  title: string;
  subtitle: string;
  thumbnailOrIcon: string;
  tags: string[];
  isHero: boolean;
  sourceParam: string;
  localeResolvedText: LocaleResolvedText;
  debug: boolean;
  sample: boolean;
}

export interface LandingTestCard extends LandingCardCommon {
  type: 'test';
  test: {
    previewQuestion: string;
    answerChoiceA: string;
    answerChoiceB: string;
    meta: {
      estimatedMinutes: number;
      shares: number;
      attempts: number;
    };
  };
}

export interface LandingBlogCard extends LandingCardCommon {
  type: 'blog';
  blog: {
    summary: string;
    primaryCTA: string;
    meta: {
      readMinutes: number;
      shares: number;
      views: number;
    };
  };
}

export type LandingCard = LandingTestCard | LandingBlogCard;

export interface FixtureContractReport {
  testCount: number;
  blogCount: number;
  unavailableTestCount: number;
  unavailableBlogCount: number;
  hasLongTokenSubtitle: boolean;
  hasLongBodyText: boolean;
  hasEmptyTags: boolean;
  hasDebugSample: boolean;
  hasRequiredSlotOmission: boolean;
}
