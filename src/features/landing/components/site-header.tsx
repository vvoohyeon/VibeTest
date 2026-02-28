'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useCallback, useEffect, useRef, useState} from 'react';

import {useTheme} from '@/features/common/theme-provider';
import {Link, useRouter} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {routeBuilder} from '@/lib/routing/route-builder';
import {cx} from '@/lib/utils';

import styles from './site-header.module.css';

type SiteHeaderContext = 'landing' | 'blog';

type Props = {
  context: SiteHeaderContext;
};

const MOBILE_BREAKPOINT = 768;
const HOVER_CLOSE_GRACE_MS = 140;
const MOBILE_CLOSE_MS = 280;

export function SiteHeader({context}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const {mode, toggleMode} = useTheme();

  const [viewportWidth, setViewportWidth] = useState(0);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = viewportWidth > 0 ? viewportWidth < MOBILE_BREAKPOINT : true;
  const canHoverOpenSettings = !isMobile && hoverCapable;

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
      const supportsHover =
        window.matchMedia('(hover: hover)').matches &&
        window.matchMedia('(pointer: fine)').matches;
      setHoverCapable(supportsHover);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 4);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!settingsRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', onDocumentClick);
    window.addEventListener('keydown', onEsc);

    return () => {
      window.removeEventListener('mousedown', onDocumentClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      return;
    }

    const timer = window.setTimeout(() => {
      document.body.style.overflow = '';
    }, MOBILE_CLOSE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [menuOpen]);

  const closeHoverTimer = useCallback(() => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);

  const openSettings = useCallback(() => {
    closeHoverTimer();
    setSettingsOpen(true);
  }, [closeHoverTimer]);

  const scheduleSettingsClose = useCallback(() => {
    closeHoverTimer();
    hoverCloseTimer.current = setTimeout(() => {
      setSettingsOpen(false);
    }, HOVER_CLOSE_GRACE_MS);
  }, [closeHoverTimer]);

  useEffect(() => {
    return () => {
      closeHoverTimer();
    };
  }, [closeHoverTimer]);

  const toggleLanguage = useCallback(() => {
    const nextLocale =
      locale === routing.defaultLocale ? routing.locales[1] : routing.defaultLocale;

    if (context === 'blog') {
      router.replace(routeBuilder.blog(), {locale: nextLocale});
    } else {
      router.replace(routeBuilder.landing(), {locale: nextLocale});
    }

    setSettingsOpen(false);
    setMenuOpen(false);
  }, [context, locale, router]);

  const onBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(routeBuilder.landing());
  }, [router]);

  return (
    <>
      <header
        className={cx(styles.header, hasScrolled && styles.headerRaised)}
        data-context={context}
      >
        <div className={styles.headerInner}>
          <div className={styles.leftZone}>
            {isMobile && context === 'blog' ? (
              <button
                type="button"
                className={styles.backButton}
                aria-label={t('nav.back')}
                onClick={onBack}
                data-cursor="interactive"
              >
                {t('nav.back')}
              </button>
            ) : (
              <Link href={routeBuilder.landing()} className={styles.brand}>
                {t('brand')}
              </Link>
            )}
          </div>

          {!isMobile && (
            <nav className={styles.desktopNav} aria-label="Main navigation">
              <Link href={routeBuilder.history()}>{t('nav.history')}</Link>
              <Link href={routeBuilder.blog()}>{t('nav.blog')}</Link>
            </nav>
          )}

          <div className={styles.rightZone}>
            {!isMobile ? (
              <div
                ref={settingsRef}
                className={styles.settingsShell}
                onMouseEnter={canHoverOpenSettings ? openSettings : undefined}
                onMouseLeave={canHoverOpenSettings ? scheduleSettingsClose : undefined}
                onFocus={canHoverOpenSettings ? undefined : openSettings}
                onBlur={(event) => {
                  const nextTarget = event.relatedTarget;
                  if (nextTarget instanceof Node && settingsRef.current?.contains(nextTarget)) {
                    return;
                  }
                  setSettingsOpen(false);
                }}
              >
                <button
                  type="button"
                  className={styles.settingsTrigger}
                  aria-label={t('settings.open')}
                  onClick={canHoverOpenSettings ? undefined : () => setSettingsOpen((prev) => !prev)}
                  data-cursor="interactive"
                >
                  <span>{t('language.en')}/{t('language.kr')}</span>
                  <span aria-hidden="true">{mode === 'light' ? 'L' : 'D'}</span>
                </button>
                <div
                  className={cx(styles.settingsLayer, settingsOpen && styles.settingsLayerOpen)}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleLanguage}
                    data-cursor="interactive"
                  >
                    {t('language.switch')}: {locale === 'en' ? t('language.en') : t('language.kr')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleMode}
                    data-cursor="interactive"
                  >
                    {t('theme.toggle')}: {mode === 'light' ? t('theme.light') : t('theme.dark')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles.menuTrigger}
                aria-label={menuOpen ? t('settings.menuClose') : t('settings.menu')}
                onClick={() => setMenuOpen((prev) => !prev)}
                data-cursor="interactive"
              >
                <span />
                <span />
                <span />
              </button>
            )}
          </div>
        </div>
      </header>

      {isMobile && (
        <>
          <button
            type="button"
            className={cx(styles.mobileBackdrop, menuOpen && styles.mobileBackdropOpen)}
            aria-label={t('settings.menuClose')}
            onClick={() => setMenuOpen(false)}
          />
          <aside className={cx(styles.mobilePanel, menuOpen && styles.mobilePanelOpen)}>
            <div className={styles.mobileMenuLinks}>
              <Link href={routeBuilder.landing()} onClick={() => setMenuOpen(false)}>
                {t('nav.home')}
              </Link>
              <Link href={routeBuilder.history()} onClick={() => setMenuOpen(false)}>
                {t('nav.history')}
              </Link>
              <Link href={routeBuilder.blog()} onClick={() => setMenuOpen(false)}>
                {t('nav.blog')}
              </Link>
            </div>
            <div className={styles.mobileControls}>
              <button type="button" onClick={toggleLanguage} data-cursor="interactive">
                <span className={styles.controlIcon} aria-hidden="true">
                  L
                </span>
                <span>
                  {t('language.label')}: {locale === 'en' ? t('language.en') : t('language.kr')}
                </span>
              </button>
              <button type="button" onClick={toggleMode} data-cursor="interactive">
                <span className={styles.controlIcon} aria-hidden="true">
                  T
                </span>
                <span>
                  {t('theme.toggle')}: {mode === 'light' ? t('theme.light') : t('theme.dark')}
                </span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
