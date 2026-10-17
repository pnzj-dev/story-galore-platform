import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'docs/V1_MASTER_CONTRACT.md',
  'docs/DOMAIN_CONTRACT_REGISTRY.md',
  'docs/API_CONTRACT_REGISTRY.md',
  'docs/EVENT_CONTRACT_REGISTRY.md',
  'docs/FINANCIAL_INVARIANTS.md',
  'docs/PRIVACY_GDPR_V1.md',
  'docs/DATA_RETENTION.md',
  'docs/DATA_DELETION_CONTRACT.md',
  'docs/INCIDENT_RESPONSE.md',
  'docs/DISASTER_RECOVERY.md',
  'docs/PRODUCTION_OPERATIONS.md',
  'docs/IDENTITY_CONTRACT.md',
  'docs/APPWRITE_SCHEMA_CONTRACT.md',
  'docs/STATE_MACHINE_CONTRACT.md',
  'docs/Master_DEFINITION_OF_DONE.md',
  'docs/V1_FREEZE_GATE.md',
];
const missing = required.filter((p) => !existsSync(resolve(root, p)));
if (missing.length) {
  console.error('V1 contract validation failed. Missing:');
  for (const p of missing) console.error(`- ${p}`);
  process.exit(1);
}
const gate = readFileSync(resolve(root, 'docs/V1_FREEZE_GATE.md'), 'utf8');
if (!gate.includes('No item may be marked PASS based only on documentation')) {
  console.error('V1 contract validation failed: executable evidence rule missing.');
  process.exit(1);
}
console.log(`V1 contract validation passed: ${required.length} required artifacts present.`);
