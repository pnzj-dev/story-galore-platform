#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = process.argv.slice(2);
if (!targets.length) {
  console.log('Usage: node scripts/change-impact.mjs <path> [path...]');
  process.exit(0);
}
const rules = [
  ['packages/domain', ['contracts/domain', 'docs/DOMAIN_MODEL.md', 'tests']],
  ['packages/ui', ['contracts/ui', 'docs/UI_COMPONENT_LIBRARY.md', 'docs/UI_SCENARIO_MATRIX.md', 'tests']],
  ['services/mcp', ['contracts/mcp', 'docs/MCP.md', 'tests']],
  ['services', ['docs/ARCHITECTURE.md', 'docs/SECURITY.md', 'tests']],
  ['apps/web', ['contracts/ui', 'docs/UI_E2E_CONTRACT.md', 'tests']],
  ['apps/web', ['contracts/ui', 'docs/UI_E2E_CONTRACT.md', 'tests']],
  ['migrations', ['docs/MIGRATION_SAFETY.md', 'tests']],
];
const affected = new Set();
for (const target of targets) {
  for (const [prefix, deps] of rules) if (target.startsWith(prefix)) deps.forEach(d => affected.add(d));
}
console.log(JSON.stringify({ targets, affected: [...affected].sort() }, null, 2));
