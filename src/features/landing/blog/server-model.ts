import type {AppLocale} from '@/config/site';
import {
  findLandingBlogCardByVariant,
  listEnterableBlogCards
} from '@/features/landing/data';
import {isEnterableCard} from '@/features/landing/data/card-type';
import type {LandingBlogCard} from '@/features/landing/data/types';

export interface BlogIndexPageModel {
  articles: LandingBlogCard[];
}

export interface BlogDetailPageModel {
  article: LandingBlogCard;
  articles: LandingBlogCard[];
}

export function getBlogIndexPageModel(locale: AppLocale): BlogIndexPageModel {
  return {
    articles: listEnterableBlogCards(locale)
  };
}

export function getBlogDetailPageModel(locale: AppLocale, variant: string): BlogDetailPageModel | null {
  const article = findLandingBlogCardByVariant(locale, variant);
  if (!article || !isEnterableCard(article)) {
    return null;
  }

  return {
    article,
    articles: listEnterableBlogCards(locale)
  };
}
