import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/UI_COMPONENT_LIBRARY.md',
  'packages/ui/src/index.ts',
  'packages/ui/README.md',
  'docs/UI_SCENARIO_MATRIX.md',
  'docs/UI_E2E_CONTRACT.md',
  'docs/UI_ROUTE_STATE_CONTRACT.md',
  'tests/contracts/ui-scenarios.json'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing UI contract file: ${file}`);
}
const matrix = fs.readFileSync(path.join(root, 'docs/UI_SCENARIO_MATRIX.md'), 'utf8');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'tests/contracts/ui-scenarios.json'), 'utf8'));
if (contract.journeys.length < 30) throw new Error(`Expected 30 UI journeys, got ${contract.journeys.length}`);
for (const id of contract.journeys.map(x => x.id)) {
  if (!matrix.includes(`| ${id} |`)) throw new Error(`Journey ${id} missing from UI matrix`);
}
for (const state of contract.requiredStates) {
  if (!matrix.includes(`\`${state}\``)) throw new Error(`Required UI state missing from matrix: ${state}`);
}
for (const invariant of [
  'Payment UI treats provider webhook/reconciliation state as authoritative.',
  'Search, vector and recommendation results are filtered by authorization',
  'Adult policy changes take effect without an application restart',
  'UI never reports Saved before server acceptance',
  'No fake completion'
]) {
  const source = matrix + fs.readFileSync(path.join(root, 'docs/UI_E2E_CONTRACT.md'), 'utf8') + fs.readFileSync(path.join(root, 'docs/UI_ROUTE_STATE_CONTRACT.md'), 'utf8');
  if (!source.includes(invariant)) throw new Error(`UI invariant missing: ${invariant}`);
}
console.log(`PASS: UI contract validated (${contract.journeys.length} journeys, ${contract.requiredStates.length} shared states)`);
