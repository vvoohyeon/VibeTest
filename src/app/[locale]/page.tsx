import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {isLocale} from '@/config/site';
import {LandingCatalogGridLoader} from '@/features/landing/grid';
import {LandingRuntime} from '@/features/landing/landing-runtime';
import {loadLandingCardMediaAssetVariants} from '@/features/landing/media/manifest.server';
import {PageShell} from '@/features/landing/shell';
import {RouteBuilder} from '@/lib/routes/route-builder';

export default async function LandingPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'landing'});
  const assetBackedVariants = await loadLandingCardMediaAssetVariants();

  return (
    <PageShell locale={locale} context="landing" currentRoute={RouteBuilder.landing()}>
      <LandingRuntime locale={locale} />
      <section className="landing-hero grid gap-3 py-5 pb-4" aria-label="Landing Hero">
        <h1 className="m-0 text-[clamp(1.5rem,2.4vw,2.2rem)] leading-[1.2] tracking-[-0.01em]">{t('heroTitle')}</h1>
        <p className="m-0 max-w-[70ch] text-[var(--muted-ink)]">{t('heroBody')}</p>
      </section>

      <LandingCatalogGridLoader locale={locale} assetBackedVariants={assetBackedVariants} />
    </PageShell>
  );
}
