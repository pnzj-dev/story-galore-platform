/**
 * Validate a `returnTo` value before redirecting: it must be a relative,
 * same-origin path. Reject absolute URLs, protocol-relative (`//`) URLs,
 * and anything with backslashes to prevent open-redirect/confusion attacks.
 */
export function safeReturnTo(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw;
  }
  return fallback;
}
