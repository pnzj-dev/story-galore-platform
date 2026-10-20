import { DEFAULT_LOCALE, LANGUAGES, normalizeLocale } from "./languages";
import en from "./messages/en";
import fr from "./messages/fr";
import ar from "./messages/ar";

const MESSAGES: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  fr,
  ar,
};

export type MessageKey = keyof typeof en;

export interface Translations {
  locale: string;
  dir: "ltr" | "rtl";
  t: (key: MessageKey) => string;
}

/** Resolve the translations for a locale (falls back to the default). */
export function getTranslations(locale: string | undefined | null): Translations {
  const loc = normalizeLocale(locale);
  const dict = MESSAGES[loc] ?? MESSAGES[DEFAULT_LOCALE];
  const dir = LANGUAGES[loc]?.direction ?? "ltr";
  return {
    locale: loc,
    dir,
    t: (key) => dict[key] ?? en[key] ?? key,
  };
}

/** Strip a leading non-default locale prefix (e.g. /fr/settings -> /settings). */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  const candidate = parts[1] ?? "";
  if (candidate !== DEFAULT_LOCALE && LANGUAGES[candidate]) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}
