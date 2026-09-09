import {notFound} from 'next/navigation';

import {isLocale} from '@/config/site';
import {PageShell} from '@/features/landing/shell';
import {RouteBuilder} from '@/lib/routes/route-builder';

// `.vt-panel` + `.vt-empty*`. 제목 문자열 자체는 손대지 않는다 — 하드코딩된 한국어가 열두
// 로케일 전부에 나가고 있고 raw variant id 가 그 안에 끼워지지만, 그것은 시각 결함이 아니라
// 내용 결함이라 보고 대상이다(BQ-21). routing-smoke 도 이 문자열을 그대로 검사한다.
const testErrorPanelClassName =
  'grid rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5 shadow-[var(--shadow-rest)]';
const testErrorEmptyClassName = 'mx-auto grid max-w-[460px] justify-items-center gap-4 px-4 py-8 text-center';
const testErrorMarkClassName =
  'grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent-fg)]';
const testErrorTitleClassName =
  'm-0 [font:var(--h3)] text-[var(--ink)] [word-break:keep-all] [overflow-wrap:anywhere]';

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
      <section className={testErrorPanelClassName} data-testid="test-error-recovery">
        <div className={testErrorEmptyClassName}>
          <span className={testErrorMarkClassName} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </span>
          <h1 className={testErrorTitleClassName}>{heading}</h1>
        </div>
      </section>
    </PageShell>
  );
}
