'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect} from 'react';

import type {AppLocale} from '@/config/site';
import type {LandingBlogCard} from '@/features/landing/data/types';
import {buildLocalizedPath} from '@/i18n/localized-path';
import {RouteBuilder} from '@/lib/routes/route-builder';
import {
  completePendingLandingTransition,
  terminatePendingLandingTransition
} from '@/features/landing/transition/runtime';
import {readPendingLandingTransition} from '@/features/landing/transition/store';

interface BlogDestinationClientProps {
  locale: AppLocale;
  headingLabel: string;
  listLabel?: string;
  articles: LandingBlogCard[];
  article?: LandingBlogCard | null;
}

export function BlogDestinationClient({
  locale,
  headingLabel,
  listLabel,
  articles,
  article = null
}: BlogDestinationClientProps) {
  const pathname = usePathname();

  useEffect(() => {
    const pendingTransition = readPendingLandingTransition();
    if (!pendingTransition) {
      return;
    }

    if (pendingTransition.targetType !== 'blog' || pendingTransition.targetRoute !== pathname) {
      terminatePendingLandingTransition({
        signal: 'transition_fail',
        resultReason: 'DESTINATION_LOAD_ERROR'
      });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      completePendingLandingTransition({
        targetType: 'blog'
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <section className="landing-shell-card blog-shell-card" data-testid="blog-shell-card">
      <h1>{headingLabel}</h1>
      {article ? (
        <>
          <article className="blog-selected-article" data-testid="blog-selected-article">
            <h2>{article.title}</h2>
            <p>{article.subtitle}</p>
          </article>
        </>
      ) : null}
      {articles.length > 0 ? (
        <section className="blog-article-list">
          {listLabel ? <h2>{listLabel}</h2> : null}
          <ul>
            {articles.map((listedArticle) => (
              <li
                key={listedArticle.variant}
                className="blog-article-list-item"
                data-selected={article?.variant === listedArticle.variant ? 'true' : 'false'}
              >
                <Link
                  className="blog-article-link"
                  href={buildLocalizedPath(RouteBuilder.blogArticle(listedArticle.variant), locale)}
                >
                  <strong>{listedArticle.title}</strong>
                  <span>{listedArticle.subtitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p data-testid="blog-empty-state">No article available.</p>
      )}
    </section>
  );
}
