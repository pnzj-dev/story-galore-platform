import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const required = [
  'docs/README.md',
  'docs/ARCHITECTURE.md',
  'docs/history/releases/V19.5.12_DOCUMENTATION_CLARITY_AND_CONSISTENCY.md',
  'docs/V19.5.13_AUTHORIZATION_BLOCKER_RESOLUTION.md',
  'docs/AUTHORIZATION_IMPLEMENTATION_HANDOFF.md',
  'contracts/astro/route-inventory.yaml',
  'contracts/security/authentication-session-runtime.yaml',
  'contracts/security/authorization-acceptance-matrix.yaml',
  'contracts/astro/routes.yaml',
  'contracts/astro/route-protection.yaml',
  'contracts/astro/middleware.yaml',
  'contracts/permissions/route-access.yaml',
  'contracts/permissions/admin-rbac.json',
  'contracts/appwrite/sites/deployment.yaml',
  'contracts/architecture/backend-runtime-policy.yaml',
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required canonical documentation/contract: ${file}`);

const currentFiles = [
  'README.md', 'AGENTS.md', 'docs/README.md', 'docs/ARCHITECTURE.md',
  'docs/STYLING.md', 'docs/UI_COMPONENT_LIBRARY.md', 'docs/IMPLEMENTATION_PLAN.md', 'DESIGN.md',
  'docs/history/releases/V19.3_PROFESSIONAL_UI_ASTRO_APPWRITE_SITES.md',
  'docs/V19.5.10_APPWRITE_ASTRO_SSR_SIMPLIFICATION.md',
  'docs/V19.5.11_INDEPENDENT_ROUTE_AUTHORIZATION.md',
  'docs/MCP.md',
  'contracts/implementation/implementation-registry.yaml',
  'contracts/implementation/source-ownership.yaml',
  'docs/history/releases/V19.5.12_DOCUMENTATION_CLARITY_AND_CONSISTENCY.md',
  'docs/V19.5.13_AUTHORIZATION_BLOCKER_RESOLUTION.md',
  'docs/AUTHORIZATION_IMPLEMENTATION_HANDOFF.md',
  'contracts/astro/route-inventory.yaml',
  'contracts/security/authentication-session-runtime.yaml',
  'contracts/security/authorization-acceptance-matrix.yaml',
  'contracts/implementation/source-ownership.yaml',
  'contracts/implementation/test-map.yaml',
  'contracts/ui/theme/implementation-map.yaml',
];
const stalePatterns = [
  [/apps\/web.{0,40}apps\/web/, 'duplicate app path suggests obsolete two-app model'],
  [/public and admin web apps/i, 'claims multiple web apps'],
  [/both `apps\/web` and `apps\/web`/i, 'claims multiple Astro apps'],
  [/Node\.js\/TypeScript Appwrite Functions/i, 'conflicts with Go-only Appwrite Function policy'],
  [/services\/mcp-cloudflare/, 'uses retired Cloudflare MCP service path; Cloudflare MCP is not an application runtime component'],
  [/scaffold for (the )?(public|admin) site/i, 'requests a separate web app scaffold instead of the single Astro app'],
  [/add Svelte integration to both/i, 'requests integrations for multiple Astro apps'],
];
for (const file of currentFiles) {
  if (!fs.existsSync(path.join(root, file))) { errors.push(`Missing file in current-doc check: ${file}`); continue; }
  const content = read(file);
  for (const [pattern, message] of stalePatterns) if (pattern.test(content)) errors.push(`${file}: ${message}`);
}

const agents = read('AGENTS.md');
if (!agents.includes('exactly one Astro web application at `apps/web`')) errors.push('AGENTS.md must state the single canonical Astro app');
if (!agents.includes('Go for Appwrite Functions')) errors.push('AGENTS.md must preserve Go backend policy');
const routes = read('contracts/astro/routes.yaml');
for (const text of ['patterns_are_policy_templates_not_route_inventory: true', 'exactly_one_effective_policy_per_concrete_route: true', 'contracts/permissions/admin-rbac.json']) {
  if (!routes.includes(text)) errors.push(`contracts/astro/routes.yaml missing: ${text}`);
}
const admin = JSON.parse(read('contracts/permissions/admin-rbac.json'));
if (admin.route_registry_complete !== true || admin.status !== 'canonical_v1_planned_route_registry' || admin.routes.length === 0) {
  errors.push('Admin RBAC must be a canonical exact-route registry for the documented V1 scope');
}
const routeInventory = read('contracts/astro/route-inventory.yaml');
if (!routeInventory.includes('planned_inventory_must_equal_scaffolded_inventory_before_route_implementation: true')) errors.push('Route inventory must require parity with generated Astro routes');
const sessionRuntime = read('contracts/security/authentication-session-runtime.yaml');
for (const invariant of ['http_only: true', 'secure_in_production: true', 'csrf_token_required_for_state_changing_browser_requests: true', 'external_origins_forbidden: true']) if (!sessionRuntime.includes(invariant)) errors.push(`Session contract missing ${invariant}`);
const mcp = read('docs/MCP.md');
if (/independent secondary path/i.test(mcp) || /preferred executor for eligible DURABLE_JOB/i.test(mcp)) errors.push('docs/MCP.md contains superseded durable-execution language');
const workflow = read('docs/history/releases/V18.1_EXECUTION_RESILIENCE.md');
if (!workflow.startsWith('> **HISTORICAL / SUPERSEDED:**')) errors.push('V18.1 execution document must be marked historical/superseded');

if (errors.length) {
  console.error(`Documentation consistency validation FAILED (${errors.length} issue(s))`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Documentation consistency validation PASSED (${currentFiles.length} current documents/contracts checked; ${required.length} canonical artifacts present).`);
console.log('Note: this is a consistency gate, not a runtime-security or production-readiness test.');
