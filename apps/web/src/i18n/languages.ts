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

/** Normalize a raw locale to a supported locale, falling back to the default. */
export function normalizeLocale(locale: string | undefined | null): string {
  if (!locale) return DEFAULT_LOCALE;
  const base = locale.toLowerCase().split("-")[0];
  if (LANGUAGES[base]) return base;
  return DEFAULT_LOCALE;
}
