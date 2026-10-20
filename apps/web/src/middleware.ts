import { defineMiddleware } from "astro:middleware";
import { createServerClient, SESSION_COOKIE } from "@storygalore/appwrite-client";
import type { Models } from "@storygalore/appwrite-client";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/languages";

/**
 * Route groups that require authentication. Middleware is an early gate only;
 * the Policy Engine and authoritative backend commands enforce authorization
 * independently at each execution boundary.
 */
const PROTECTED_PREFIXES = ["/account", "/library", "/settings", "/creator", "/studio", "/admin"];

/** Split a leading non-default locale prefix (e.g. /fr/settings -> { fr, /settings }). */
function splitLocale(pathname: string): { locale: string; path: string } {
  const parts = pathname.split("/");
  const candidate = parts[1] ?? "";
  if (candidate !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(candidate)) {
    return { locale: candidate, path: "/" + parts.slice(2).join("/") };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

export const onRequest = defineMiddleware(async (context, next) => {
  const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
  const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;

  let user: Models.User | null = null;

  if (endpoint && projectId) {
    const session = context.cookies.get(SESSION_COOKIE)?.value;
    if (session) {
      try {
        const { account } = createServerClient({ endpoint, projectId }, { session });
        user = await account.get();
      } catch {
        // Invalid, expired or revoked session: clear the cookie and treat as anonymous.
        context.cookies.delete(SESSION_COOKIE, { path: "/" });
        user = null;
      }
    }
  }

  context.locals.user = user;

  const pathname = context.url.pathname;
  const { locale, path } = splitLocale(pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const returnTo = encodeURIComponent(pathname + context.url.search);
    const loginPath = locale === DEFAULT_LOCALE ? "/auth/login" : `/${locale}/auth/login`;
    return context.redirect(`${loginPath}?returnTo=${returnTo}`);
  }

  return next();
});
