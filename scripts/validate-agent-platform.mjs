import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'contracts/agents/registry.yaml',
  'contracts/agents/capability-registry.yaml',
  'contracts/agents/trust-policy.yaml',
  'contracts/agents/session.yaml',
  'contracts/agents/task.yaml',
  'contracts/agents/task-result.yaml',
  'contracts/agents/delegation.yaml',
  'contracts/agents/interoperability.yaml',
  'contracts/coding/pipeline.yaml',
  'contracts/github/engineering-control-plane.yaml',
  'docs/history/releases/V18.5_MULTI_AGENT_INTEROPERABILITY.md',
  'docs/AGENT_FAMILY_V1.md',
  'docs/GITHUB_CODING_AGENT_WORKFLOW.md'
];
const errors=[];
for (const p of required) if (!fs.existsSync(path.join(root,p))) errors.push(`missing ${p}`);
const agentSlugs = ["story-producer", "story-guardian", "art-director", "production", "community-guardian", "discovery-curator", "reader-companion", "creator-business", "media-operations", "support", "qa-release", "infrastructure", "ceo", "data-analysis-reporting", "coding-dev", "orchestrator", "keep2share-import"];
for (const slug of agentSlugs) {
  for (const p of [`agents/${slug}/manifest.yaml`]) if (!fs.existsSync(path.join(root,p))) errors.push(`missing ${p}`); if (slug !== 'keep2share-import' && !fs.existsSync(path.join(root, `agents/${slug}/README.md`))) errors.push(`missing agents/${slug}/README.md`);
}
const registry=fs.readFileSync(path.join(root,'contracts/agents/registry.yaml'),'utf8');
for (const slug of agentSlugs) if (!registry.includes(`slug: ${slug}`)) errors.push(`registry missing ${slug}`);
if (!fs.readFileSync(path.join(root,'docs/V1.md'),'utf8').includes('V1 Agent Platform')) errors.push('V1.md missing agent platform gate');
if (!fs.readFileSync(path.join(root,'AGENTS.md'),'utf8').includes('GitHub is the V1 engineering system of record')) errors.push('AGENTS.md missing GitHub rule');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Agent platform validation passed: ${agentSlugs.length} V1 agents.`);
