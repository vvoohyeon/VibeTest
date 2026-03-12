'use client';

import {useTranslations} from 'next-intl';
import {useEffect, useRef, useState} from 'react';

import {setTelemetryConsentState, useTelemetryConsentSource} from '@/features/landing/telemetry/consent-source';

const DEFAULT_BANNER_HEIGHT_PX = 120;

export function TelemetryConsentBanner() {
  const t = useTranslations('consent');
  const consentSnapshot = useTelemetryConsentSource();
  const bannerRef = useRef<HTMLElement | null>(null);
  const [bannerHeight, setBannerHeight] = useState(DEFAULT_BANNER_HEIGHT_PX);

  const isVisible = consentSnapshot.synced && consentSnapshot.consentState === 'UNKNOWN';

  useEffect(() => {
    if (!isVisible) {
      return;
    }

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
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="telemetry-consent-banner-spacer" aria-hidden="true" style={{height: `${bannerHeight}px`}} />
      <div className="telemetry-consent-banner-layer">
        <section
          ref={bannerRef}
          className="telemetry-consent-banner"
          aria-label={t('regionLabel')}
          data-testid="telemetry-consent-banner"
        >
          <p className="telemetry-consent-banner-message">{t('message')}</p>
          <div className="telemetry-consent-banner-actions">
            <button
              type="button"
              className="telemetry-consent-banner-button telemetry-consent-banner-button-accent"
              data-testid="telemetry-consent-accept"
              onClick={() => {
                setTelemetryConsentState('OPTED_IN');
              }}
            >
              {t('accept')}
            </button>
            <button
              type="button"
              className="telemetry-consent-banner-button telemetry-consent-banner-button-neutral"
              data-testid="telemetry-consent-deny"
              onClick={() => {
                setTelemetryConsentState('OPTED_OUT');
              }}
            >
              {t('deny')}
            </button>
            <button
              type="button"
              className="telemetry-consent-banner-link"
              data-testid="telemetry-consent-preferences"
              title={t('preferencesTitle')}
              onClick={() => {}}
            >
              {t('preferences')}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
