'use client';

import type {Route} from 'next';
import {useCallback} from 'react';
import {usePathname, useRouter} from 'next/navigation';

import type {AppLocale} from '@/config/site';
import type {LandingBlogCard, LandingTestCard} from '@/features/landing/data/types';
import {beginLandingTransition} from '@/features/landing/transition/runtime';
import {buildLocalizedPath} from '@/i18n/localized-path';
import {RouteBuilder} from '@/lib/routes/route-builder';

interface UseLandingTransitionInput {
  locale: AppLocale;
  onTransitionStart?: (cardId: string) => void;
}

export function useLandingTransition({locale, onTransitionStart}: UseLandingTransitionInput) {
  const router = useRouter();
  const pathname = usePathname();

  const beginTestTransition = useCallback(
    (card: LandingTestCard, choice: 'A' | 'B') => {
      const targetRoute = buildLocalizedPath(RouteBuilder.question(card.sourceParam), locale);
      const pendingTransition = beginLandingTransition({
        locale,
        route: pathname,
        sourceCardId: card.id,
        targetType: 'test',
        targetRoute,
        variant: card.sourceParam,
        preAnswerChoice: choice
      });

      if (!pendingTransition) {
        return false;
      }

      onTransitionStart?.(card.id);
      router.push(targetRoute as Route);
      return true;
    },
    [locale, onTransitionStart, pathname, router]
  );

  const beginBlogTransition = useCallback(
    (card: LandingBlogCard) => {
      const targetRoute = buildLocalizedPath(RouteBuilder.blog(), locale);
      const pendingTransition = beginLandingTransition({
        locale,
        route: pathname,
        sourceCardId: card.id,
        targetType: 'blog',
        targetRoute,
        blogArticleId: card.sourceParam
      });

      if (!pendingTransition) {
        return false;
      }

      onTransitionStart?.(card.id);
      router.push(targetRoute as Route);
      return true;
    },
    [locale, onTransitionStart, pathname, router]
  );

  return {
    beginTestTransition,
    beginBlogTransition
  };
}
