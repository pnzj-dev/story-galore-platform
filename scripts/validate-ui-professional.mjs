import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'DESIGN.md',
  'contracts/ui/design-system/visual-system.yaml',
  'contracts/ui/design-system/token-contract.yaml',
  'contracts/ui/design-system/density.yaml',
  'contracts/ui/components/component-registry.yaml',
  'contracts/ui/components/component-definition-of-done.yaml',
  'contracts/ui/patterns/pattern-registry.yaml',
  'contracts/ui/states/page-state-contract.yaml',
  'contracts/ui/pages/page-registry.yaml',
  'contracts/ui/artwork.yaml',
  'contracts/ui/visual-regression/contract.yaml',
  'contracts/ui/visual-regression/scenario-matrix.yaml',
  'contracts/ui/performance/budget.yaml',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`UI_BLOCKER missing:${file}`);
}
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const checks = [
  ['contracts/ui/design-system/visual-system.yaml', ['semantic_tokens_only','accessibility_by_default','rtl_by_contract']],
  ['contracts/ui/components/component-registry.yaml', ['SVELTE_5_BITS_UI_TAILWIND_LUCIDE','required_states','required_direction_states']],
  ['contracts/ui/states/page-state-contract.yaml', ['never_claim_saved_before_server_acceptance','polling_fallback_required']],
  ['contracts/ui/visual-regression/contract.yaml', ['PLAYWRIGHT','mobile','tablet','desktop','light','dark','rtl']],
  ['contracts/ui/performance/budget.yaml', ['ship_less_javascript','optimize_images','avoid_client_waterfalls']],
];
for (const [file, needles] of checks) {
  const text = read(file);
  for (const needle of needles) if (!text.includes(needle)) throw new Error(`UI_BLOCKER missing ${needle} in ${file}`);
}
console.log('PASS professional UI contract: design system, components, states, artwork, visual regression and performance');
