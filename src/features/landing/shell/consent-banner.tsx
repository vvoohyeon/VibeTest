'use client';

import {useEffect, useRef, useState} from 'react';

const DEFAULT_BANNER_HEIGHT_PX = 120;
const CONSENT_BANNER_SPACER_CLASS = 'telemetry-consent-banner-spacer flex-none';
const CONSENT_BANNER_LAYER_CLASS =
  'telemetry-consent-banner-layer pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-[1075] flex justify-center px-4';
// `.vt-banner` — floating 표면이되 scrim 은 없다. 배너는 페이지 **위에** 떠 있지만 아무것도
// 막지 않으므로, 아닌 것(모달)처럼 읽혀서는 안 된다. 종전에는 94% 반투명 패널에
// `--surface-divider` 를 두르고 18px 반경이었다.
const CONSENT_BANNER_SURFACE_CLASS =
  'rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]';
// L10: `outline-none` 을 같은 `focus-visible` 의 outline shorthand 와 함께 쓰면 링 두께가
// 0 으로 계산된다. shorthand 만 쓴다.
const CONSENT_BUTTON_FOCUS_RING_CLASS =
  'focus-visible:[outline:2px_solid_var(--focus-ring)] focus-visible:[outline-offset:2px]';
// 테두리 **색**은 변종만 정한다 — 바탕이 함께 정하면 명시도가 같아 emit 순서가 승자를 정한다.
const CONSENT_BUTTON_BASE_CLASS = [
  'telemetry-consent-banner-button',
  'inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border px-4 py-3',
  'text-[15px] font-semibold leading-none tracking-[-0.01em]',
  '[transition-property:background-color,border-color,box-shadow,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-standard)] motion-reduce:transition-none',
  CONSENT_BUTTON_FOCUS_RING_CLASS
].join(' ');
const CONSENT_PRIMARY_BUTTON_CLASS = [
  CONSENT_BUTTON_BASE_CLASS,
  'telemetry-consent-banner-button-accent',
  'border-[var(--accent-solid)] bg-[var(--accent-solid)] text-[var(--fg-on-accent)]',
  'hover:border-[var(--accent-solid-hover)] hover:bg-[var(--accent-solid-hover)]',
  'active:border-[var(--accent-solid-pressed)] active:bg-[var(--accent-solid-pressed)]'
].join(' ');
// 거부는 수락과 **같은 버튼 무게**를 유지한다. 명세 표본은 이 자리에 quiet 를 두지만, 배너의
// 두 선택지는 서로 대칭인 동의 응답이고 어느 한쪽을 텍스트로 낮추면 그 대칭이 깨진다. quiet 는
// 셋째 행동(설정)이 가져간다. 지시 오버레이의 거부는 흐름을 빠져나가는 탈출구라 다르다.
const CONSENT_SECONDARY_BUTTON_CLASS = [
  CONSENT_BUTTON_BASE_CLASS,
  'telemetry-consent-banner-button-neutral',
  'border-[var(--hairline-strong)] bg-[var(--panel-solid)] text-[var(--ink-soft)]',
  'hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]',
  'active:bg-[var(--surface-strong)]'
].join(' ');
const CONSENT_LINK_CLASS = [
  CONSENT_BUTTON_BASE_CLASS,
  'telemetry-consent-banner-link',
  'min-h-[var(--tap-min)] border-[transparent] bg-transparent px-3 py-[10px] text-[var(--muted-aa)]',
  'hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-body)]'
].join(' ');

interface ConsentBannerProps {
  regionLabel: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  preferencesLabel: string;
  preferencesTitle: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onPreferencesAction?: () => void;
  rootTestId?: string;
  primaryTestId?: string;
  secondaryTestId?: string;
  preferencesTestId?: string;
}

export function ConsentBanner({
  regionLabel,
  message,
  primaryLabel,
  secondaryLabel,
  preferencesLabel,
  preferencesTitle,
  onPrimaryAction,
  onSecondaryAction,
  onPreferencesAction,
  rootTestId = 'telemetry-consent-banner',
  primaryTestId = 'telemetry-consent-accept',
  secondaryTestId = 'telemetry-consent-deny',
  preferencesTestId = 'telemetry-consent-preferences'
}: ConsentBannerProps) {
  const bannerRef = useRef<HTMLElement | null>(null);
  const [bannerHeight, setBannerHeight] = useState(DEFAULT_BANNER_HEIGHT_PX);

  useEffect(() => {
    const bannerElement = bannerRef.current;
    if (!bannerElement) {
      return;
    }

    const updateBannerHeight = () => {
      setBannerHeight(Math.max(DEFAULT_BANNER_HEIGHT_PX, Math.ceil(bannerElement.getBoundingClientRect().height)));
    };

    updateBannerHeight();
    window.addEventListener('resize', updateBannerHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', updateBannerHeight);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateBannerHeight();
    });
    resizeObserver.observe(bannerElement);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBannerHeight);
    };
  }, []);

  return (
    <>
      <div className={CONSENT_BANNER_SPACER_CLASS} aria-hidden="true" style={{height: `${bannerHeight}px`}} />
      <div className={CONSENT_BANNER_LAYER_CLASS}>
        <section
          ref={bannerRef}
          className={`telemetry-consent-banner pointer-events-auto flex w-full max-w-[1280px] items-center justify-between gap-5 px-5 py-4 max-[719px]:flex-wrap max-[719px]:justify-start max-[719px]:gap-[14px] max-[719px]:p-[14px] ${CONSENT_BANNER_SURFACE_CLASS}`}
          aria-label={regionLabel}
          data-testid={rootTestId}
        >
          <p className="telemetry-consent-banner-message m-0 min-w-0 flex-1 basis-[520px] text-[14px] leading-[1.55] text-[var(--ink-body)] max-[719px]:basis-full">
            {message}
          </p>
          <div className="telemetry-consent-banner-actions flex shrink-0 flex-wrap items-center justify-end gap-2 max-[719px]:basis-full max-[719px]:justify-start">
            <button
              type="button"
              className={CONSENT_PRIMARY_BUTTON_CLASS}
              data-testid={primaryTestId}
              onClick={onPrimaryAction}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              className={CONSENT_SECONDARY_BUTTON_CLASS}
              data-testid={secondaryTestId}
              onClick={onSecondaryAction}
            >
              {secondaryLabel}
            </button>
            <button
              type="button"
              className={CONSENT_LINK_CLASS}
              data-testid={preferencesTestId}
              title={preferencesTitle}
              onClick={onPreferencesAction}
            >
              {preferencesLabel}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
