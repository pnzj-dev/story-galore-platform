import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/ARCHITECTURE_SIMPLIFICATION.md',
  'contracts/runtime/profiles.yaml',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}
const doc = fs.readFileSync(path.join(root, 'docs/ARCHITECTURE_SIMPLIFICATION.md'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'contracts/runtime/profiles.yaml'), 'utf8');
for (const token of ['CORE', 'WORKFLOW', 'EXTENSION', 'Complexity budget', 'Cloudflare Workflows is never the source of truth']) {
  if (!doc.includes(token)) throw new Error(`Missing simplification invariant: ${token}`);
}
for (const token of ['new_service', 'new_database', 'new_state_machine', 'new_workflow', 'new_agent']) {
  if (!contract.includes(token)) throw new Error(`Missing complexity rule: ${token}`);
}
console.log('Runtime profiles validation PASS');
