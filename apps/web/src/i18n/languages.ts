/**
 * Canonical language catalog — implements contracts/i18n/language-catalog.yaml.
 * BCP 47 tags are identifiers; direction derives from locale metadata.
 */
export interface LanguageRecord {
  /** Canonical BCP 47 language tag. */
  tag: string;
  /** ISO 639 language code. */
  code: string;
  /** Language self-name. */
  nativeName: string;
  /** Reading direction for the UI locale. */
  direction: "ltr" | "rtl";
}

export const LANGUAGES: Record<string, LanguageRecord> = {
  en: { tag: "en", code: "en", nativeName: "English", direction: "ltr" },
  fr: { tag: "fr", code: "fr", nativeName: "Français", direction: "ltr" },
  ar: { tag: "ar", code: "ar", nativeName: "العربية", direction: "rtl" },
};

export const SUPPORTED_LOCALES = Object.keys(LANGUAGES);
export const DEFAULT_LOCALE = "en";

/**
 * Content languages offered for the user's content-language filter (V1 curated
 * catalog). Independent from the UI locales above — a publication may declare
 * any BCP 47 tag; this is the subset surfaced in the settings form.
 */
export const CONTENT_LANGUAGES: Array<{
  tag: string;
  nativeName: string;
  direction: "ltr" | "rtl";
}> = [
  { tag: "en", nativeName: "English", direction: "ltr" },
  { tag: "fr", nativeName: "Français", direction: "ltr" },
  { tag: "ar", nativeName: "العربية", direction: "rtl" },
  { tag: "es", nativeName: "Español", direction: "ltr" },
  { tag: "de", nativeName: "Deutsch", direction: "ltr" },
  { tag: "pt", nativeName: "Português", direction: "ltr" },
  { tag: "it", nativeName: "Italiano", direction: "ltr" },
  { tag: "nl", nativeName: "Nederlands", direction: "ltr" },
  { tag: "zh", nativeName: "中文", direction: "ltr" },
  { tag: "ja", nativeName: "日本語", direction: "ltr" },
  { tag: "ko", nativeName: "한국어", direction: "ltr" },
  { tag: "hi", nativeName: "हिन्दी", direction: "ltr" },
];

/** Normalize a raw locale to a supported locale, falling back to the default. */
export function normalizeLocale(locale: string | undefined | null): string {
  if (!locale) return DEFAULT_LOCALE;
  const base = locale.toLowerCase().split("-")[0];
  if (LANGUAGES[base]) return base;
  return DEFAULT_LOCALE;
}
