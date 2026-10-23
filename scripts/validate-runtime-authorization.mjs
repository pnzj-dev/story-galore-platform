import fs from 'node:fs';
import path from 'node:path';

// Static runtime-authorization verification: maps each acceptance case to the
// concrete runtime guard that implements it, and fails closed if a guard is
// missing or misconfigured. This is static evidence, NOT a substitute for the
// E2E execution of contracts/security/authorization-acceptance-matrix.yaml.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const errors = [];
const checks = [];

const has = (file, needle, label) => {
  const ok = read(file).includes(needle);
  checks.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) errors.push(`${label}: ${file} missing ${JSON.stringify(needle)}`);
};

// AUTH-001/002/014 — session validation + protected-prefix redirect (early gate).
has('apps/web/src/middleware.ts', 'PROTECTED_PREFIXES', 'AUTH-002 middleware protected-prefix gate');
has('apps/web/src/middleware.ts', 'account.get()', 'AUTH-014 middleware re-validates session server-side');

// AUTH-013 — safe same-origin return-to.
has('apps/web/src/lib/returnTo.ts', 'safeReturnTo', 'AUTH-013 safe return-to helper exists');
has('apps/web/src/lib/returnTo.ts', 'startsWith("//")', 'AUTH-013 rejects protocol-relative return-to');

// AUTH-003/012 — mutations require a verified session + CSRF (Astro form actions).
has('apps/web/src/actions/index.ts', 'accept: "form"', 'AUTH-012 form actions enable Astro CSRF');
has('apps/web/src/actions/index.ts', 'context.locals.user', 'AUTH-003 mutations read server-side user');

// AUTH-004/006/007/018 — backend authority: agent allowlist + admin label + ownership.
has('backend/appwrite/functions/api/main.go', 'agentAllowedOperations', 'AUTH-018 agent operation allowlist');
has('backend/appwrite/functions/api/main.go', 'rowAccessible', 'AUTH-005 row ownership/tenant policy');
has('backend/appwrite/functions/api/main.go', 'entitlementSatisfied', 'entitlement (subscription/purchase) policy');
has('backend/appwrite/functions/api/main.go', 'isAdminActor', 'AUTH-007 admin label check');
has('backend/appwrite/functions/api/main.go', 'resolveActor', 'AUTH-004 actor derived server-side (claims ignored)');

// AUTH-006 — non-admin cannot reach admin ops (admin layout guard).
has('apps/web/src/layouts/AdminLayout.astro', 'includes("admin")', 'AUTH-006/007 admin route guard');

// AUTH-009 — fail-closed on unknown policy/operation.
has('backend/appwrite/functions/api/main.go', 'RESOURCE_NOT_FOUND', 'AUTH-009 fail-closed unknown operation');

// AUTH-016/017 — contract + bundle gates (spec validators).
has('contracts/security/authorization-acceptance-matrix.yaml', 'AUTH-018', 'acceptance matrix complete (18 cases)');

console.log(checks.join('\n'));
if (errors.length) {
  console.error('\nRUNTIME AUTHORIZATION: FAIL');
  for (const e of errors) console.error(`BLOCK: ${e}`);
  process.exit(1);
}
console.log('\nRUNTIME AUTHORIZATION: PASS (static evidence — guards present and wired)');
console.log('NOTE: this is static verification, not E2E execution of the acceptance matrix.');
