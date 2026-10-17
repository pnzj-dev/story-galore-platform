import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const required = [
  'docs/ADULT_CONTENT_DISPLAY_CONTRACT.md',
  'docs/V1_MASTER_CONTRACT.md',
  'docs/V1_FREEZE_GATE.md',
];
for (const rel of required) {
  if (!existsSync(new URL(rel, root))) throw new Error(`Missing ${rel}`);
}
const c = readFileSync(new URL('docs/ADULT_CONTENT_DISPLAY_CONTRACT.md', root), 'utf8');
for (const token of ['DISABLED', 'paid entitlement', 'fail closed', 'MCP', 'search', 'recommendation', 'notification', 'deep-link']) {
  if (!c.toLowerCase().includes(token.toLowerCase())) throw new Error(`Missing adult opt-in contract requirement: ${token}`);
}
console.log('Adult content display contract: PASS');
