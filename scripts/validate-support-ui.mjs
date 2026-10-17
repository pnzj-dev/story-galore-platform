import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'docs/support/SUPPORT_UI_ADMIN.md',
  'contracts/support/support-ui.json',
  'tests/support-ui-scenarios.json',
  'docs/ADMIN_V1_SURFACE_MATRIX.md'
];
for (const p of required) if (!fs.existsSync(path.join(root,p))) throw new Error(`Missing ${p}`);
const contract = JSON.parse(fs.readFileSync(path.join(root,'contracts/support/support-ui.json'),'utf8'));
for (const k of ['user_routes','admin_routes','required_admin_workspace_actions','required_user_actions','required_states']) {
  if (!Array.isArray(contract[k]) || contract[k].length === 0) throw new Error(`Empty support contract: ${k}`);
}
console.log(`Support UI validation PASS: ${contract.user_routes.length} user routes, ${contract.admin_routes.length} admin routes`);
