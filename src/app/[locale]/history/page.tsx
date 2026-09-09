import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {isLocale} from '@/config/site';
import {PageShell} from '@/features/landing/shell';
import {RouteBuilder} from '@/lib/routes/route-builder';

// `.vt-panel` + `.vt-empty*`. 이 페이지에는 아직 항목을 렌더하는 코드가 없으므로 화면 전체가
// 사실상 빈 상태다 — 종전에는 그것이 제목과 본문 두 줄로만 표현돼 있었고 빈 상태로 읽히지
// 않았다. `Locale: …` 은 페이지 본문에 남아 있는 디버그 문자열이며, 내용 결함으로 보고할
// 대상이지 여기서 조용히 지울 대상이 아니다(BQ-21: design.md 는 카피를 지배하지 않는다).
const historyPanelClassName =
  'landing-shell-card grid rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5 shadow-[var(--shadow-rest)]';
const historyEmptyClassName = 'mx-auto grid max-w-[460px] justify-items-center gap-4 px-4 py-10 text-center';
const historyEmptyMarkClassName =
  'grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent-fg)]';
const historyEmptyTitleClassName = 'm-0 [font:var(--h3)] text-[var(--ink)]';
const historyEmptyBodyClassName = 'm-0 [font:var(--body-sm)] text-[var(--muted-aa)]';

export default async function HistoryPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'history'});

  return (
    <PageShell locale={locale} context="history" currentRoute={RouteBuilder.history()}>
      <section className={historyPanelClassName}>
        <div className={historyEmptyClassName}>
          <span className={historyEmptyMarkClassName} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 2" />
            </svg>
          </span>
          <h1 className={historyEmptyTitleClassName}>{t('title')}</h1>
          <p className={historyEmptyBodyClassName}>{t('body')}</p>
          <p className={historyEmptyBodyClassName}>{`Locale: ${locale}`}</p>
        </div>
      </section>
    </PageShell>
  );
}
