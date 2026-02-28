import {notFound} from 'next/navigation';

import {isLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';

export default async function QuestionPage({
  params
}: {
  params: Promise<{locale: string; variant: string}>;
}) {
  const {locale, variant} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const routePath = buildLocalizedPath(RouteBuilder.question(variant), locale);

  return (
    <main>
      <h1>Question Placeholder</h1>
      <p>Variant: {variant}</p>
      <p>Current route: {routePath}</p>
      <a href={buildLocalizedPath(RouteBuilder.landing(), locale)}>Back to landing</a>
    </main>
  );
}
