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
  const orderedThemeOptions =
    resolvedTheme === 'light'
      ? (['dark', 'light'] as const)
      : (['light', 'dark'] as const);

  const handleThemeClick =
    (theme: 'light' | 'dark') => (event: ReactMouseEvent<HTMLButtonElement>) => {
      onThemeChange(theme, event.currentTarget);
    };

  return (
    <div className={`gnb-settings-controls gnb-settings-controls-${scope}`}>
      <div className="gnb-settings-row gnb-settings-row-theme" data-testid={`${scope}-gnb-theme-controls`}>
        <span className="gnb-settings-label">{labels.theme}</span>
        <div className="gnb-settings-theme-actions">
          {orderedThemeOptions.map((theme) => {
            const isCurrentTheme = resolvedTheme === theme;
            const themeLabel = theme === 'light' ? labels.light : labels.dark;

            return (
              <button
                key={theme}
                type="button"
                className="gnb-chip gnb-chip-theme"
                aria-pressed={isCurrentTheme}
                aria-label={themeLabel}
                title={themeLabel}
                data-testid={`${scope}-gnb-theme-${theme}`}
                data-theme-option={theme}
                disabled={isCurrentTheme}
                onClick={handleThemeClick(theme)}
              >
                <ThemeModeIcon theme={theme} className="gnb-chip-icon" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="gnb-settings-row gnb-settings-row-locale" data-testid={`${scope}-gnb-locale-controls`}>
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
    </div>
  );
}
