import {notFound} from 'next/navigation';

import {isLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';

export default async function HistoryPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <main>
      <h1>History Placeholder</h1>
      <p>This page is intentionally minimal after reset.</p>
      <a href={buildLocalizedPath(RouteBuilder.landing(), locale)}>Back to landing</a>
    </main>
  );
}
