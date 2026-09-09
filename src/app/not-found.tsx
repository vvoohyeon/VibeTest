import Link from 'next/link';

import {linkButtonPrimaryClassName} from '@/features/ui/button-class-names';
import {RouteBuilder} from '@/lib/routes/route-builder';

// `.vt-empty*` 안에 놓인 `.vt-panel`. 이 라우트는 `PageShell` 밖에서 렌더되므로 GNB 도
// 동의 배너도 없고 돌아갈 길은 이 링크 하나뿐이다 — 그래서 링크가 실제 버튼 무게를 받는다.
// 셸을 지워야 하는지는 시각이 아니라 라우팅 문제이고 열린 채로 둔다.
// 카피는 README 의 voice 규칙(무엇이 일어났는지 한 줄 · 행동 하나 · 사과도 오류 코드도 없이)을
// 따른 영어다. 로케일 레이아웃 밖이라 아직 번역되지 않는다(내용 결함으로 남김).
const notFoundMainClassName = 'grid min-h-screen place-items-center px-4 py-6';
const notFoundPanelClassName =
  'w-full max-w-[520px] rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--canvas-elevated)] p-5 shadow-[var(--shadow-rest)]';
const notFoundEmptyClassName = 'mx-auto grid max-w-[460px] justify-items-center gap-4 px-4 py-10 text-center';
const notFoundMarkClassName =
  'grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent-fg)]';
const notFoundTitleClassName = 'm-0 [font:var(--h3)] text-[var(--ink)]';
const notFoundBodyClassName = 'm-0 [font:var(--body-sm)] text-[var(--muted-aa)]';
// 두 404 는 같은 완성형을 쓴다 — 어휘가 갈라진 자리였다(`@/features/ui/button-class-names`).
const notFoundActionClassName = linkButtonPrimaryClassName;

export default function NotFound() {
  return (
    <main className={notFoundMainClassName}>
      <section className={notFoundPanelClassName} data-testid="segment-not-found">
        <div className={notFoundEmptyClassName}>
          <span className={notFoundMarkClassName} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"
            >
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <h1 className={notFoundTitleClassName}>That page is not here</h1>
          <p className={notFoundBodyClassName}>This address is valid, but nothing lives at it any more.</p>
          <Link className={notFoundActionClassName} href={{pathname: RouteBuilder.landing().pathname}}>
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
