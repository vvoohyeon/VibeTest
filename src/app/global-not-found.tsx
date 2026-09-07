import Link from 'next/link';

import {APP_BODY_CLASSNAME} from '@/app/app-body-class';
import {defaultLocale} from '@/config/site';
import {RouteBuilder} from '@/lib/routes/route-builder';

import './globals.css';

// 이 라우트는 루트 레이아웃을 거치지 않고 제 `<html>`/`<body>` 를 직접 렌더한다. 그래서
// 레이아웃이 하는 두 가지가 여기서는 일어나지 않는다. 첫째, **스타일시트가 실리지 않았다** —
// 실측: `document.styleSheets.length === 0`, 규칙 0 개, `h1` 이 브라우저 기본 32px, 토큰
// `--canvas-elevated` 는 빈 문자열. 이 파일이 지금까지 적어 온 모든 Tailwind 클래스는 한 번도
// 적용된 적이 없다. 위의 import 가 그것을 고친다. 둘째, 테마 부트스트랩이 없어 `data-theme` 가
// 붙지 않으므로 항상 라이트로 그려진다 — 그것은 라우팅/부트스트랩 문제라 열린 채로 둔다.
// 카피는 하드코딩된 영어 그대로다(내용 결함으로 보고 대상, BQ-21).
const globalNotFoundMainClassName = 'grid min-h-screen place-items-center px-4 py-6';
const globalNotFoundPanelClassName =
  'w-full max-w-[520px] rounded-[var(--radius-lg)] border border-[var(--surface-divider)] bg-[var(--panel-solid)] p-5 shadow-[var(--card-shadow)]';
const globalNotFoundEmptyClassName = 'mx-auto grid max-w-[460px] justify-items-center gap-4 px-4 py-10 text-center';
const globalNotFoundMarkClassName =
  'grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent-fg)]';
const globalNotFoundTitleClassName = 'm-0 text-[20px] font-semibold leading-[1.3] text-[var(--ink)]';
const globalNotFoundBodyClassName = 'm-0 text-[14px] leading-[1.55] text-[var(--muted-aa)]';
const globalNotFoundActionClassName =
  'inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-solid)] bg-[var(--accent-solid)] px-4 py-3 text-[15px] font-semibold leading-none tracking-[-0.01em] text-[var(--fg-on-accent)] no-underline [transition-property:background-color,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-standard)] motion-reduce:transition-none hover:border-[var(--accent-solid-hover)] hover:bg-[var(--accent-solid-hover)] focus-visible:[outline:2px_solid_var(--focus-ring)] focus-visible:[outline-offset:2px]';

export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale}>
      <body className={APP_BODY_CLASSNAME}>
        <main className={globalNotFoundMainClassName}>
          <section className={globalNotFoundPanelClassName}>
            <div className={globalNotFoundEmptyClassName}>
              <span className={globalNotFoundMarkClassName} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </span>
              <h1 className={globalNotFoundTitleClassName}>Global Not Found</h1>
              <p className={globalNotFoundBodyClassName}>The requested path is outside the supported route contract.</p>
              <Link className={globalNotFoundActionClassName} href={{pathname: RouteBuilder.landing().pathname}}>
                Return home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
