import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/ADMIN_AGENT_CONTROL_MATRIX.md',
  'contracts/mcp/admin-control.yaml',
  'docs/V1_FREEZE_GATE.md'
];
for (const f of required) {
  if (!fs.existsSync(path.join(root, f))) throw new Error(`Missing ${f}`);
}
const matrix = fs.readFileSync(path.join(root, 'docs/ADMIN_AGENT_CONTROL_MATRIX.md'), 'utf8');
const requiredDomains = [
  'Auth / sessions / MFA','Users / creators','Content / publications','Comments / replies / reactions',
  'Messaging / DM','Moderation','Adult policy','Provider/model policy','AI providers / BYOK',
  'AI generations','AI credits / cost','User-hosted AI','Drafts / publication lifecycle',
  'Media / uploads / processing','Downloads / offline / exports','Payments','Subscriptions / entitlements',
  'Reconciliation','Advertising','Notifications','Analytics','Audit','Dynamic configuration',
  'Feature flags','Operations / workflows','MCP operations','Security / abuse','Storage / deletion',
  'Backups / DR','Agent management','Agent tasks / delegation','Search','Recommendations'
];
for (const d of requiredDomains) if (!matrix.includes(`| ${d} |`)) throw new Error(`Admin matrix missing domain: ${d}`);
const contract = fs.readFileSync(path.join(root, 'contracts/mcp/admin-control.yaml'), 'utf8');
for (const s of ['every_mutation_requires_capability_authorization','high_risk_operations_require_approval_when_policy_requires','no_unrestricted_super_admin_agent','private_content_access_is_explicit_capability_only']) {
  if (!contract.includes(s)) throw new Error(`Admin MCP contract missing invariant: ${s}`);
}
console.log(`Admin control validation passed: ${requiredDomains.length} V1 domains mapped.`);
