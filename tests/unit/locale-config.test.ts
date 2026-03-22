import {describe, expect, it} from 'vitest';

import {isLocale, localeOptions, locales} from '../../src/config/site';

describe('locale configuration', () => {
  it('keeps the supported locale order stable', () => {
    expect(locales).toEqual(['en', 'kr', 'zs', 'zt', 'ja', 'es', 'fr', 'pt', 'de', 'hi', 'id', 'ru']);
  });

  it('exposes native labels for settings locale buttons', () => {
    expect(localeOptions).toEqual([
      {code: 'en', label: 'English'},
      {code: 'kr', label: '한국어'},
      {code: 'zs', label: '简体中文'},
      {code: 'zt', label: '繁體中文'},
      {code: 'ja', label: '日本語'},
      {code: 'es', label: 'Español'},
      {code: 'fr', label: 'Français'},
      {code: 'pt', label: 'Português'},
      {code: 'de', label: 'Deutsch'},
      {code: 'hi', label: 'हिन्दी'},
      {code: 'id', label: 'Indonesia'},
      {code: 'ru', label: 'Русский'}
    ]);
  });

  it('recognizes only configured locale codes', () => {
    expect(isLocale('zs')).toBe(true);
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('ko')).toBe(false);
    expect(isLocale('zh')).toBe(false);
  });
});
