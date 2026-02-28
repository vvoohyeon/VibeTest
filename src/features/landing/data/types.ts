export type CardType = 'test' | 'blog';
export type CardAvailability = 'available' | 'unavailable';

export type LandingFixtureCard = {
  id: string;
  type: CardType;
  availability: CardAvailability;
  title: string;
  subtitle: string;
  thumbnailOrIcon: string;
  tags: string[];
  variant?: string;
  previewQuestion?: string;
  answerChoiceA?: string;
  answerChoiceB?: string;
  summary?: string;
  metaPrimary: string;
  metaSecondary: string;
  metaTertiary: string;
  isDebug?: boolean;
};

export type LandingCard = {
  id: string;
  type: CardType;
  availability: CardAvailability;
  title: string;
  subtitle: string;
  thumbnailOrIcon: string;
  tags: string[];
  variant?: string;
  previewQuestion: string;
  answerChoiceA: string;
  answerChoiceB: string;
  summary: string;
  metaPrimary: string;
  metaSecondary: string;
  metaTertiary: string;
  sourceParam: string;
};
