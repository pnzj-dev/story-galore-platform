import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const required = [
  'docs/PRODUCTION_READINESS.md',
  'docs/AGE_JURISDICTION_CONTRACT.md',
  'docs/FINANCIAL_INVARIANTS.md',
  'docs/AI_PROVENANCE.md',
  'docs/SEARCH_AUTHORIZATION_CONTRACT.md',
  'docs/MIGRATION_ROLLBACK.md',
  'docs/DISASTER_RECOVERY.md',
  'docs/CROSS_AGENT_CONTRACT_COMPATIBILITY.md',
  'contracts/compatibility/change-manifest.schema.json',
  'contracts/compatibility/compatibility-policy.json',
  'contracts/production/production-readiness-v1.json'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing: ${rel}`);
}
console.log(`PASS: V17.1 additive contract files (${required.length})`);
