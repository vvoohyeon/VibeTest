import type {MouseEvent as ReactMouseEvent} from 'react';

import {locales, type AppLocale} from '@/config/site';

interface SettingsControlLabels {
  language: string;
  theme: string;
  light: string;
  dark: string;
}

interface SettingsControlsProps {
  scope: 'desktop' | 'mobile';
  locale: AppLocale;
  resolvedTheme: 'light' | 'dark';
  labels: SettingsControlLabels;
  onLocaleChange: (locale: AppLocale) => void;
  onThemeChange: (theme: 'light' | 'dark', sourceEl: HTMLElement | null) => void;
}

function ThemeChipIcon({theme}: {theme: 'light' | 'dark'}) {
  if (theme === 'light') {
    return (
      <svg
        aria-hidden="true"
        className="gnb-chip-icon gnb-chip-icon-light"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4.25" />
        <path d="M12 2.75v2.5" />
        <path d="M12 18.75v2.5" />
        <path d="m4.93 4.93 1.77 1.77" />
        <path d="m17.3 17.3 1.77 1.77" />
        <path d="M2.75 12h2.5" />
        <path d="M18.75 12h2.5" />
        <path d="m4.93 19.07 1.77-1.77" />
        <path d="m17.3 6.7 1.77-1.77" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="gnb-chip-icon gnb-chip-icon-dark"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M15.1 4.2a8.75 8.75 0 1 0 4.7 15.13A9.35 9.35 0 0 1 16.2 20 9.2 9.2 0 0 1 7 10.8c0-2.68 1.14-5.1 2.97-6.78a8.28 8.28 0 0 0 5.13.18Z" fill="currentColor" />
    </svg>
  );
}

export function SettingsControls({
  scope,
  locale,
  resolvedTheme,
  labels,
  onLocaleChange,
  onThemeChange
}: SettingsControlsProps) {
  const handleThemeClick =
    (theme: 'light' | 'dark') => (event: ReactMouseEvent<HTMLButtonElement>) => {
      onThemeChange(theme, event.currentTarget);
    };

  return (
    <>
      <div className="gnb-settings-row" data-testid={`${scope}-gnb-locale-controls`}>
        <span className="gnb-settings-label">{labels.language}</span>
        <div className="gnb-chip-row">
          {locales.map((localeOption) => (
            <button
              key={localeOption}
              type="button"
              className="gnb-chip"
              aria-pressed={locale === localeOption}
              onClick={() => onLocaleChange(localeOption)}
              disabled={locale === localeOption}
            >
              {localeOption.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="gnb-settings-row" data-testid={`${scope}-gnb-theme-controls`}>
        <span className="gnb-settings-label">{labels.theme}</span>
        <div className="gnb-chip-row">
          <button
            type="button"
            className="gnb-chip gnb-chip-theme"
            aria-pressed={resolvedTheme === 'light'}
            aria-label={labels.light}
            title={labels.light}
            data-testid={`${scope}-gnb-theme-light`}
            data-theme-option="light"
            disabled={resolvedTheme === 'light'}
            onClick={handleThemeClick('light')}
          >
            <ThemeChipIcon theme="light" />
          </button>
          <button
            type="button"
            className="gnb-chip gnb-chip-theme"
            aria-pressed={resolvedTheme === 'dark'}
            aria-label={labels.dark}
            title={labels.dark}
            data-testid={`${scope}-gnb-theme-dark`}
            data-theme-option="dark"
            disabled={resolvedTheme === 'dark'}
            onClick={handleThemeClick('dark')}
          >
            <ThemeChipIcon theme="dark" />
          </button>
        </div>
      </div>
    </>
  );
}
