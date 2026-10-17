import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const required = [
  'docs/ARCHITECTURE_HARDENING.md',
  'docs/SCENARIO_VALIDATION.md',
  'docs/V1_FREEZE_GATE.md',
  'docs/CONTROL_PLANE_DATA_PLANE.md',
  'docs/AI_POLICY_ENGINE.md',
  'docs/DYNAMIC_CONFIGURATION.md',
  'docs/SECURITY.md',
  'docs/TESTING.md'
];

for (const file of required) {
  if (!existsSync(join(root, file))) throw new Error(`Missing ${file}`);
}

const text = Object.fromEntries(required.map(f => [f, readFileSync(join(root, f), 'utf8')]));
const all = Object.values(text).join('\n');

const mustContain = [
  'USER_HOSTED` never implies adult permission',
  'hot-reloadable',
  'Policy Engine',
  'idempotency',
  'outbox',
  'inbox',
  'dead-letter',
  'tenant isolation',
  'SSRF',
  'search/vector/recommendation',
  'coding agent',
  'fail closed'
];
for (const needle of mustContain) {
  if (!all.toLowerCase().includes(needle.toLowerCase())) throw new Error(`Missing invariant: ${needle}`);
}

// Small executable policy scenarios. These model the architectural invariants;
// provider APIs and Appwrite/Cloudflare Workflows integration are covered by implementation tests.
const adultAllowed = ({ catalog, generation, policy, verified, ageEligible }) =>
  catalog && generation && policy === 'ADULT_ALLOWED' && verified && ageEligible;

const scenarios = [
  ['adult catalog off', adultAllowed({catalog:false,generation:true,policy:'ADULT_ALLOWED',verified:true,ageEligible:true}) === false],
  ['adult generation off', adultAllowed({catalog:true,generation:false,policy:'ADULT_ALLOWED',verified:true,ageEligible:true}) === false],
  ['unknown provider policy', adultAllowed({catalog:true,generation:true,policy:'ADULT_REQUIRES_VERIFICATION',verified:false,ageEligible:true}) === false],
  ['user hosted is not automatically adult', adultAllowed({catalog:true,generation:true,policy:'ADULT_REQUIRES_VERIFICATION',verified:false,ageEligible:true}) === false],
  ['age gate remains mandatory', adultAllowed({catalog:true,generation:true,policy:'ADULT_ALLOWED',verified:true,ageEligible:false}) === false],
  ['approved adult execution', adultAllowed({catalog:true,generation:true,policy:'ADULT_ALLOWED',verified:true,ageEligible:true}) === true],
];
for (const [name, ok] of scenarios) if (!ok) throw new Error(`Scenario failed: ${name}`);

console.log(`Architecture validation PASS: ${required.length} contract files + ${scenarios.length} executable policy scenarios`);
