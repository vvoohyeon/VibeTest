import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {isLocale} from '@/config/site';
import {BlogDestinationClient} from '@/features/landing/blog/blog-destination-client';
import {PageShell} from '@/features/landing/shell';
import {RouteBuilder} from '@/lib/routes/route-builder';

export default async function BlogPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'blog'});

  return (
    <PageShell locale={locale} context="blog" currentRoute={RouteBuilder.blog()}>
      <BlogDestinationClient locale={locale} selectedLabel={t('selected')} allArticlesLabel={t('allArticles')} />
    </PageShell>
  );
}
