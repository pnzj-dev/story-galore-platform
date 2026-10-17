#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'docs/AGENT_BUILD_FRAMEWORK.md', 'docs/TASK_CONTRACT.md', 'docs/OWNERSHIP_MAP.md',
  'docs/CONTRACT_REGISTRY.md', 'docs/DEFINITION_OF_DONE.md', 'docs/AGENT_HANDOFF.md',
  'docs/CHANGE_IMPACT.md', 'docs/MIGRATION_SAFETY.md', 'docs/ADR_PROCESS.md',
  'docs/adr/0005-agent-construction-framework.md', 'contracts/ui/component-contract.yaml',
  'contracts/domain/task-contract.schema.yaml', 'contracts/mcp/tool-risk-contract.yaml',
  'scripts/change-impact.mjs'
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
const agents = ['story-producer','story-guardian','art-director','production','community-guardian','discovery-curator','reader-companion','creator-business','media-operations','support','qa-release','infrastructure','ceo','data-analysis-reporting','coding-dev','orchestrator','keep2share-import']
for (const agent of agents) { const requiredFile = agent === 'keep2share-import' ? 'manifest.yaml' : 'README.md'; if (!fs.existsSync(path.join(root, 'agents', agent, requiredFile))) throw new Error(`Missing agent scope ${agent}`); }
const dod = fs.readFileSync(path.join(root, 'docs/DEFINITION_OF_DONE.md'), 'utf8');
for (const invariant of ['fake payment success','client-only authorization','silent conflict overwrite','secrets in logs/workflow history','dead UI action']) {
  if (!dod.includes(invariant)) throw new Error(`Missing DoD invariant: ${invariant}`);
}
console.log(`Agent construction framework PASS: ${required.length} contracts + ${agents.length} agent scopes`);
