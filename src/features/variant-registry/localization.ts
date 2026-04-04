import {defaultLocale, type AppLocale} from '@/config/site';
import type {LocalizedStringList, LocalizedText} from '@/features/variant-registry/types';

function asLocalizedText(value: LocalizedText | string | undefined): LocalizedText {
  if (typeof value === 'string') {
    return {default: value};
  }

  return value && typeof value === 'object' ? value : {};
}

function asLocalizedStringList(
  value: LocalizedStringList | ReadonlyArray<string> | undefined
): LocalizedStringList {
  if (Array.isArray(value)) {
    return {default: value};
  }

  if (value && typeof value === 'object') {
    return value as LocalizedStringList;
  }

  return {};
}

function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

export function resolveLocalizedText(value: LocalizedText | string | undefined, locale: AppLocale): string {
  const normalized = asLocalizedText(value);

  const direct = normalized[locale];
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }

  const fallbackLocaleText = normalized[defaultLocale];
  if (typeof fallbackLocaleText === 'string' && fallbackLocaleText.trim().length > 0) {
    return fallbackLocaleText;
  }

  if (typeof normalized.default === 'string' && normalized.default.trim().length > 0) {
    return normalized.default;
  }

  for (const candidate of Object.values(normalized)) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return '';
}

export function resolveLocalizedTagList(
  value: LocalizedStringList | ReadonlyArray<string> | undefined,
  locale: AppLocale
): string[] {
  const normalized = asLocalizedStringList(value);

  const direct = normalizeTagList(normalized[locale]);
  if (direct.length > 0) {
    return direct;
  }

  const fallbackLocaleTags = normalizeTagList(normalized[defaultLocale]);
  if (fallbackLocaleTags.length > 0) {
    return fallbackLocaleTags;
  }

  const defaultTags = normalizeTagList(normalized.default);
  if (defaultTags.length > 0) {
    return defaultTags;
  }

  for (const candidate of Object.values(normalized)) {
    const candidateTags = normalizeTagList(candidate);
    if (candidateTags.length > 0) {
      return candidateTags;
    }
  }

  return [];
}

export function resolveLocalizedTextForInspection(value: LocalizedText | string | undefined): string {
  return resolveLocalizedText(value, defaultLocale);
}

export function resolveLocalizedTagsForInspection(
  value: LocalizedStringList | ReadonlyArray<string> | undefined
): string[] {
  return resolveLocalizedTagList(value, defaultLocale);
}
