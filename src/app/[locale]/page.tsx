import {notFound} from 'next/navigation';

import {isLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';

export default async function LandingPage({
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
      <h1>Landing Placeholder</h1>
      <p>This route is intentionally minimal after reset.</p>
      <ul>
        <li>
          <a href={buildLocalizedPath(RouteBuilder.blog(), locale)}>Blog</a>
        </li>
        <li>
          <a href={buildLocalizedPath(RouteBuilder.history(), locale)}>History</a>
        </li>
        <li>
          <a href={buildLocalizedPath(RouteBuilder.question('demo'), locale)}>Test Question</a>
        </li>
      </ul>
    </main>
  );
}
