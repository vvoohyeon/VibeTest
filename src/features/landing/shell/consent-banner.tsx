'use client';

import {useEffect, useRef, useState} from 'react';

const DEFAULT_BANNER_HEIGHT_PX = 120;
const CONSENT_BUTTON_FOCUS_RING_CLASS =
  'focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring-inner),0_0_0_4px_var(--focus-ring-outer)]';
const CONSENT_BUTTON_BASE_CLASS = [
  'telemetry-consent-banner-button',
  'min-h-[42px] cursor-pointer rounded-full border px-[14px] py-[10px] font-semibold text-[var(--text-strong)]',
  'transition-[border-color,background-color,box-shadow,color] duration-[140ms] ease-out',
  CONSENT_BUTTON_FOCUS_RING_CLASS
].join(' ');
const CONSENT_LINK_CLASS = [
  'telemetry-consent-banner-link',
  'cursor-pointer px-[2px] py-2 text-[var(--muted-ink)] underline decoration-1 underline-offset-[0.18em]',
  'transition-colors duration-[140ms] ease-out hover:text-[var(--text-strong)]',
  CONSENT_BUTTON_FOCUS_RING_CLASS
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
      <div className="telemetry-consent-banner-spacer" aria-hidden="true" style={{height: `${bannerHeight}px`}} />
      <div className="telemetry-consent-banner-layer">
        <section
          ref={bannerRef}
          className="telemetry-consent-banner pointer-events-auto flex w-full max-w-[1280px] items-center justify-between gap-5 rounded-[18px] border px-4 py-[14px] max-[719px]:flex-wrap max-[719px]:justify-start max-[719px]:gap-[14px] max-[719px]:p-[14px]"
          aria-label={regionLabel}
          data-testid={rootTestId}
          style={{
            borderColor: 'var(--surface-divider)',
            background: 'color-mix(in srgb, var(--panel-solid) 94%, transparent)',
            boxShadow: 'var(--surface-shadow)'
          }}
        >
          <p className="telemetry-consent-banner-message m-0 min-w-0 flex-1 basis-[520px] text-[0.96rem] text-[var(--muted-ink)] max-[719px]:basis-full">
            {message}
          </p>
          <div className="telemetry-consent-banner-actions flex shrink-0 flex-wrap items-center justify-end gap-[10px] max-[719px]:basis-full max-[719px]:justify-start">
            <button
              type="button"
              className={`${CONSENT_BUTTON_BASE_CLASS} telemetry-consent-banner-button-accent hover:border-[var(--interactive-accent-border-strong)] hover:[background:var(--interactive-accent-bg-hover)] active:[background:var(--interactive-accent-bg-pressed)]`}
              data-testid={primaryTestId}
              onClick={onPrimaryAction}
              style={{
                borderColor: 'var(--interactive-accent-border)',
                background: 'var(--interactive-accent-bg)',
                boxShadow: 'var(--interactive-accent-shadow)'
              }}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              className={`${CONSENT_BUTTON_BASE_CLASS} telemetry-consent-banner-button-neutral hover:border-[var(--interactive-neutral-border-strong)] hover:[background:var(--interactive-neutral-bg-hover)] active:[background:var(--interactive-neutral-bg-pressed)]`}
              data-testid={secondaryTestId}
              onClick={onSecondaryAction}
              style={{
                borderColor: 'var(--interactive-neutral-border)',
                background: 'var(--interactive-neutral-bg)'
              }}
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
