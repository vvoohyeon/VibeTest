import {notFound} from 'next/navigation';

import {isLocale} from '@/config/site';
import {PageShell} from '@/features/landing/shell';
import {RouteBuilder} from '@/lib/routes/route-builder';

export default async function TestErrorPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams?: Promise<{variant?: string | string[]}>;
}) {
  const {locale} = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawVariant = resolvedSearchParams.variant;
  const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
  const heading = variant
    ? `이 테스트에 진입할 수 없습니다 (variant: ${variant})`
    : '이 테스트에 진입할 수 없습니다';

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <PageShell
      locale={locale}
      context="test"
      currentRoute={RouteBuilder.testError()}
      showDefaultConsentBanner={false}
    >
      <section
        className="grid gap-3 rounded-[16px] p-5 [background:color-mix(in_srgb,var(--panel-solid)_94%,transparent)] [box-shadow:var(--dialog-shadow)]"
        data-testid="test-error-recovery"
      >
        <h1 className="m-0">{heading}</h1>
      </section>
    </PageShell>
  );
}
