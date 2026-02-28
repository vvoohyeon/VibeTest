import {isLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';
import {notFound} from 'next/navigation';

export default async function BlogPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const routePath = buildLocalizedPath(RouteBuilder.blog(), locale);

  return (
    <main>
      <h1>Blog Placeholder</h1>
      <p>Current route: {routePath}</p>
      <a href={buildLocalizedPath(RouteBuilder.landing(), locale)}>Back to landing</a>
    </main>
  );
}
