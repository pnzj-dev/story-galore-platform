import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const doc = fs.readFileSync(path.join(root,'docs/ADMIN_RBAC_SURFACE.md'),'utf8');
const matrix = JSON.parse(fs.readFileSync(path.join(root,'contracts/permissions/admin-rbac.json'),'utf8'));
const required = ['capability-driven','server-authoritative','Hiding a menu item is UX only','raw secrets','BYOK','Impersonation','V1 requirement'];
for (const s of required) if (!doc.includes(s)) throw new Error(`Missing RBAC invariant: ${s}`);
if (matrix.route_registry_complete !== true || matrix.status !== 'canonical_v1_planned_route_registry') throw new Error('ADMIN_RBAC_BLOCKER registry not canonical/complete');
if (!Array.isArray(matrix.routes) || matrix.routes.length === 0) throw new Error('ADMIN_RBAC_BLOCKER empty routes');
const routeSet = new Set();
for (const r of matrix.routes) {
  for (const k of matrix.required_fields) if (!(k in r)) throw new Error(`ADMIN_RBAC_BLOCKER ${r.route} missing ${k}`);
  if (!r.route.startsWith('/admin')) throw new Error(`ADMIN_RBAC_BLOCKER non-admin route ${r.route}`);
  if (routeSet.has(r.route)) throw new Error(`ADMIN_RBAC_BLOCKER duplicate route ${r.route}`);
  routeSet.add(r.route);
  if (!matrix.roles[r.roles[0]] && !r.roles.every(role => Object.hasOwn(matrix.roles, role))) throw new Error(`ADMIN_RBAC_BLOCKER unknown role ${r.route}`);
  if (!r.capability || !r.scope || !r.projection) throw new Error(`ADMIN_RBAC_BLOCKER incomplete policy ${r.route}`);
  if (r.approval === 'REQUIRED' && r.risk === 'LOW') throw new Error(`ADMIN_RBAC_BLOCKER suspicious approval/risk combination ${r.route}`);
}
for (const [role, grants] of Object.entries(matrix.roles)) {
  if (!Array.isArray(grants)) throw new Error(`ADMIN_RBAC_BLOCKER invalid role grant list ${role}`);
  const expected = [...new Set(matrix.routes.filter(r => r.roles.includes(role)).map(r => r.capability))].sort();
  if (role === 'PLATFORM_ADMIN') {
    const allCaps = [...new Set(matrix.routes.map(r => r.capability))].sort();
    if (JSON.stringify([...grants].sort()) !== JSON.stringify(allCaps)) throw new Error('ADMIN_RBAC_BLOCKER PLATFORM_ADMIN grant registry does not enumerate every registered capability');
  } else if (JSON.stringify([...grants].sort()) !== JSON.stringify(expected)) {
    throw new Error(`ADMIN_RBAC_BLOCKER role/capability mapping mismatch for ${role}`);
  }
}
const invText = fs.readFileSync(path.join(root,'contracts/astro/route-inventory.yaml'),'utf8');
if (!invText.includes('path: /admin')) throw new Error('ADMIN_RBAC_BLOCKER admin route inventory missing');
console.log(`ADMIN RBAC PASS: ${matrix.routes.length} exact planned routes; ${Object.keys(matrix.roles).length} roles; fail-closed rules present.`);
console.log('RUNTIME STATUS: NOT IMPLEMENTED BY CONTRACT VALIDATION; acceptance matrix must pass before production readiness.');
