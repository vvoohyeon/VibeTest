import type {MouseEvent as ReactMouseEvent} from 'react';

import {localeOptions, type AppLocale} from '@/config/site';
import {ThemeModeIcon} from '@/features/landing/gnb/components/theme-mode-icon';

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

export function SettingsControls({
  scope,
  locale,
  resolvedTheme,
  labels,
  onLocaleChange,
  onThemeChange
}: SettingsControlsProps) {
  const currentLocaleOption = localeOptions.find(({code}) => code === locale);
  const alternateLocaleOptions = localeOptions.filter(({code}) => code !== locale);

  const handleThemeClick =
    (theme: 'light' | 'dark') => (event: ReactMouseEvent<HTMLButtonElement>) => {
      onThemeChange(theme, event.currentTarget);
    };

  return (
    <>
      <div className="gnb-settings-row" data-testid={`${scope}-gnb-locale-controls`}>
        <div className="gnb-settings-row-header">
          <span className="gnb-settings-label">{labels.language}</span>
          <span className="gnb-settings-value" data-testid={`${scope}-gnb-current-locale`}>
            {currentLocaleOption?.label ?? locale}
          </span>
        </div>
        <div className="gnb-chip-row">
          {alternateLocaleOptions.map(({code, label}) => (
            <button
              key={code}
              type="button"
              className="gnb-chip"
              onClick={() => onLocaleChange(code)}
            >
              {label}
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
            <ThemeModeIcon theme="light" className="gnb-chip-icon" />
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
            <ThemeModeIcon theme="dark" className="gnb-chip-icon" />
          </button>
        </div>
      </div>
    </>
  );
}
