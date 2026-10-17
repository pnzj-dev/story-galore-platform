import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const readJson = f => JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const readText = f => fs.readFileSync(path.join(root,f),'utf8');
const invText = readText('contracts/astro/route-inventory.yaml');
const rbac = readJson('contracts/permissions/admin-rbac.json');
const authText = readText('contracts/security/authentication-session-runtime.yaml');
const matrixText = readText('contracts/security/authorization-acceptance-matrix.yaml');
const routePattern = /^\s*- path: (.+)$/gm;
const inventoryPaths = [...invText.matchAll(routePattern)].map(m => m[1].replace(/^['"]|['"]$/g,''));
if (inventoryPaths.length !== 99) throw new Error(`AUTHZ_BLOCKER planned route count changed without manifest update: expected 99, found ${inventoryPaths.length}`);
if (new Set(inventoryPaths).size !== inventoryPaths.length) throw new Error('AUTHZ_BLOCKER duplicate planned route');
const adminInventory = inventoryPaths.filter(p => p === '/admin' || p.startsWith('/admin/')).sort();
const adminRegistry = rbac.routes.map(r=>r.route).sort();
if (JSON.stringify(adminInventory) !== JSON.stringify(adminRegistry)) {
 const missing=adminInventory.filter(p=>!adminRegistry.includes(p));
 const extra=adminRegistry.filter(p=>!adminInventory.includes(p));
 throw new Error(`AUTHZ_BLOCKER inventory/RBAC mismatch missing=${missing.join(',')} extra=${extra.join(',')}`);
}
for (const token of ['APPWRITE_AUTH','POLICY_ENGINE','http_only: true','secure_in_production: true','csrf_token_required_for_state_changing_browser_requests: true','external_origins_forbidden: true','policy_engine_unavailable']) {
 if (!authText.includes(token)) throw new Error(`AUTHZ_BLOCKER session contract missing ${token}`);
}
for (const token of ['AUTH-001','AUTH-018','AUTH-004','AUTH-006','AUTH-012']) {
 if (!matrixText.includes(token)) throw new Error(`AUTHZ_BLOCKER acceptance matrix missing ${token}`);
}
for (const f of ['docs/AUTHORIZATION_IMPLEMENTATION_HANDOFF.md','contracts/astro/route-protection.yaml','contracts/security/authorization-completeness.yaml']) {
 if (!fs.existsSync(path.join(root,f))) throw new Error(`AUTHZ_BLOCKER missing ${f}`);
}
console.log(`AUTHORIZATION CONTRACTS PASS: ${inventoryPaths.length} planned routes; ${adminRegistry.length} exact Admin mappings; 18 acceptance cases.`);
console.log('IMPORTANT: this validates specification completeness only, not runtime security or route-file parity.');
