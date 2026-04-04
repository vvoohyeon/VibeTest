import type {AppLocale} from '@/config/site';

export type LandingContentType = 'test' | 'blog';
export type LandingCardAttribute = 'available' | 'unavailable' | 'hide' | 'opt_out' | 'debug';
export type LandingAvailability = 'available' | 'unavailable';
export type LandingCatalogAudience = 'end-user' | 'qa';

export type LocalizedText = Partial<Record<AppLocale, string>> & {
  default?: string;
};

export type LocalizedStringList = Partial<Record<AppLocale, ReadonlyArray<string>>> & {
  default?: ReadonlyArray<string>;
};

export interface LandingMeta {
  durationM: number;
  sharedC: number;
  engagedC: number;
}

// inline Q1 preview is temporary until Questions Q1 migration.
export interface InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge {
  previewQuestion: LocalizedText;
  answerChoiceA: LocalizedText;
  answerChoiceB: LocalizedText;
}

interface VariantRegistrySourceCardCommon {
  seq: number;
  variant: string;
  type: LandingContentType;
  attribute: LandingCardAttribute;
  title: LocalizedText;
  subtitle: LocalizedText;
  tags: LocalizedStringList;
  meta: LandingMeta;
  debug?: boolean;
  sample?: boolean;
}

export interface VariantRegistrySourceTestCard
  extends VariantRegistrySourceCardCommon,
    InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge {
  type: 'test';
  instruction: LocalizedText | string;
}

export interface VariantRegistrySourceBlogCard extends VariantRegistrySourceCardCommon {
  type: 'blog';
}

export type VariantRegistrySourceCard = VariantRegistrySourceTestCard | VariantRegistrySourceBlogCard;

interface VariantRegistryRuntimeCardCommon {
  variant: string;
  type: LandingContentType;
  attribute: LandingCardAttribute;
  title: LocalizedText;
  subtitle: LocalizedText;
  tags: LocalizedStringList;
  debug: boolean;
  sample: boolean;
}

export interface VariantRegistryRuntimeTestCard extends VariantRegistryRuntimeCardCommon {
  type: 'test';
  test: {
    instruction: LocalizedText | string;
    meta: LandingMeta;
  };
}

export interface VariantRegistryRuntimeBlogCard extends VariantRegistryRuntimeCardCommon {
  type: 'blog';
  blog: {
    meta: LandingMeta;
  };
}

export type VariantRegistryRuntimeLandingCard =
  | VariantRegistryRuntimeTestCard
  | VariantRegistryRuntimeBlogCard;

export interface VariantRegistry {
  landingCards: ReadonlyArray<VariantRegistryRuntimeLandingCard>;
  testPreviewPayloadByVariant: Readonly<Record<string, InlineQ1PreviewIsTemporaryUntilQuestionsQ1MigrationBridge>>;
}

export interface LocaleResolvedText {
  title: string;
  subtitle: string;
  instruction?: string;
}

export interface LandingCardCommon {
  variant: string;
  type: LandingContentType;
  attribute: LandingCardAttribute;
  availability: LandingAvailability;
  title: string;
  subtitle: string;
  tags: string[];
  localeResolvedText: LocaleResolvedText;
  debug: boolean;
  sample: boolean;
}

export interface LandingTestCard extends LandingCardCommon {
  type: 'test';
  test: {
    instruction: string;
    meta: LandingMeta;
  };
}

export interface LandingBlogCard extends LandingCardCommon {
  type: 'blog';
  blog: {
    meta: LandingMeta;
  };
}

export type LandingCard = LandingTestCard | LandingBlogCard;

export interface TestPreviewPayload {
  variant: string;
  previewQuestion: string;
  answerChoiceA: string;
  answerChoiceB: string;
}

export interface FixtureContractReport {
  testCount: number;
  blogCount: number;
  availableCount: number;
  unavailableCount: number;
  optOutCount: number;
  hideCount: number;
  debugCount: number;
  hasLongTokenSubtitle: boolean;
  hasLongBlogSubtitle: boolean;
  hasEmptyTags: boolean;
  hasDebugSample: boolean;
  hasRequiredSlotOmission: boolean;
}
