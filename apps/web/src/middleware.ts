import { defineMiddleware } from "astro:middleware";
import { createServerClient, SESSION_COOKIE } from "@storygalore/appwrite-client";
import type { Models } from "@storygalore/appwrite-client";

/**
 * Route groups that require authentication. Middleware is an early gate only;
 * the Policy Engine and authoritative backend commands enforce authorization
 * independently at each execution boundary.
 */
const PROTECTED_PREFIXES = ["/account", "/library", "/settings", "/creator", "/studio", "/admin"];

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
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const returnTo = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/auth/login?returnTo=${returnTo}`);
  }

  return next();
});
