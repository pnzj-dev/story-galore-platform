import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const errors = [];
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const requirePath = (p) => { if (!exists(p)) errors.push(`Missing canonical path: ${p}`); };

for (const p of [
  'apps/web/package.json', 'backend/appwrite/functions/function-catalog.json',
  'backend/appwrite/tables/desired-schema.json', 'backend/cloudflare/README.md',
  'packages/domain/package.json', 'packages/analytics/README.md',
  'contracts/implementation/implementation-registry.yaml',
  'contracts/implementation/source-ownership.yaml', 'contracts/agents/registry.yaml',
  'contracts/agents/tools/registry.yaml', 'pnpm-workspace.yaml', 'V19.5.22_CHANGE_MANIFEST.yaml', 'V19.5.23_CHANGE_MANIFEST.yaml', 'V19.5.24_CHANGE_MANIFEST.yaml', 'docs/history/repository-audits/REPOSITORY_AUDIT_V19.5.22.md'
]) requirePath(p);


for (const stale of ['V19.5.16_CHANGE_MANIFEST.yaml','V19.5.17_CHANGE_MANIFEST.yaml','V19.5.18_CHANGE_MANIFEST.yaml']) {
  if (exists(stale)) errors.push(`Historical manifest must be archived, not kept at repository root: ${stale}`);
}
const docsIndex = read('docs/README.md');
if (/must be converted from examples to a complete registry/i.test(docsIndex)) errors.push('Documentation index contains superseded Admin RBAC blocker wording');
for (const p of ['docs/MCP.md','docs/README.md','README.md']) {
  if (exists(p) && /citeturn\d+search/.test(read(p))) errors.push(`Raw web citation marker remains in repository documentation: ${p}`);
}

// Cloudflare MCP is not a StoryGalore application runtime or deployment component.
for (const p of ['contracts/architecture/backend-runtime-policy.yaml','contracts/runtime/universal-execution-contract.yaml','contracts/implementation/implementation-registry.yaml','contracts/implementation/infrastructure-resource-map.yaml','contracts/implementation/source-ownership.yaml','contracts/implementation/test-map.yaml','contracts/deployment/release-contract.yaml']) {
  if (exists(p) && /cloudflare[-_ ]mcp|mcp-cloudflare|backend\/cloudflare\/mcp/i.test(read(p))) errors.push(`Cloudflare MCP remains registered in application/runtime contracts: ${p}`);
}
const workspace = read('pnpm-workspace.yaml');
if (!workspace.includes('"apps/*"') || !workspace.includes('"packages/*"')) errors.push('pnpm workspace must include apps/* and packages/*');
if (workspace.includes('"sites/*"')) errors.push('Obsolete sites/* workspace glob remains');
if (exists('services')) errors.push('services/ remains; service placeholders must be consolidated into canonical package/Cloudflare boundaries');
if (exists('examples')) errors.push('examples/ is intentionally not part of the canonical repository; remove illustrative examples and keep authoritative behavior in contracts/docs');
for (const p of ['backend/functions','backend/tables','backend/documentsdb','backend/storage','backend/teams','backend/topics','backend/vectorsdb','backend/firewall']) {
  if (exists(p)) errors.push(`Legacy Appwrite resource path remains: ${p}; use backend/appwrite/`);
}
if (exists('services/mcp-cloudflare') || exists('services/posthog')) errors.push('Legacy services path remains');
const pkg = JSON.parse(read('package.json'));
if (pkg.scripts?.['appwrite:push']?.includes('--force')) errors.push('Forceful Appwrite push script is forbidden');
if (pkg.scripts?.['appwrite:push']) errors.push('Direct Appwrite push script must remain absent until an explicit deployment approval gate is implemented');

const registry = read('contracts/agents/registry.yaml');
const activeDirs = fs.readdirSync(path.join(root,'agents'), {withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
const expected = ['art-director','ceo','coding-dev','community-guardian','creator-business','data-analysis-reporting','discovery-curator','infrastructure','keep2share-import','media-operations','orchestrator','production','qa-release','reader-companion','story-guardian','story-producer','support'].sort();
if (JSON.stringify(activeDirs) !== JSON.stringify(expected)) errors.push(`Active agent directory set differs from canonical 17-agent registry: ${activeDirs.join(', ')}`);
for (const retired of ['cost-guardian','creator-growth','character-agent','world-agent']) {
  if (registry.includes(`slug: ${retired}`) || registry.includes(`id: sg.agent.${retired}`)) errors.push(`Retired autonomous agent remains registered: ${retired}`);
}
const tools = read('contracts/agents/tools/registry.yaml');
for (const retired of ['cost-guardian.','creator-growth.','character.project.','character.story-bible.','world.project.','world.story-bible.']) {
  if (tools.includes(`id: ${retired}`)) errors.push(`Retired executable tool namespace remains: ${retired}`);
}
// All paths named by Appwrite Function definitions must point at the canonical Appwrite target.
const functionCatalog = JSON.parse(read('backend/appwrite/functions/function-catalog.json'));
if (!Array.isArray(functionCatalog.functions) || functionCatalog.functions.length !== 29) errors.push('Expected exactly 29 registered Appwrite Function contracts');
if (!functionCatalog.functions?.some(f => f.id === 'central-agent-gateway')) errors.push('Central Agent Gateway is missing from the Appwrite Function catalog');
for (const f of functionCatalog.functions ?? []) {
  if (!f.id) errors.push('Appwrite Function catalog entry missing id');
}
// Check all relative Markdown links in local docs; external URLs are ignored.
let links = 0;
for (const dir of ['docs','agents']) {
  if (!exists(dir)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(path.join(root,d),{withFileTypes:true})) {
      const rel = path.posix.join(d,ent.name);
      if (ent.isDirectory()) walk(rel);
      else if (/\.md$/i.test(ent.name)) {
        const content = read(rel);
        for (const m of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
          const url = m[1].split('#')[0];
          if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('#')) continue;
          links++;
          if (!fs.existsSync(path.resolve(root,path.dirname(rel),url))) errors.push(`Broken local Markdown link in ${rel}: ${url}`);
        }
      }
    }
  };
  walk(dir);
}
// Exact duplicate retired-agent schemas should not be retained in the canonical schema folder.
for (const f of ['character-input.yaml','character-output.yaml','world-input.yaml','world-output.yaml','cost-guardian-input.yaml','cost-guardian-output.yaml','creator-growth-input.yaml','creator-growth-output.yaml']) {
  if (exists(`contracts/agents/output-schemas/${f}`)) errors.push(`Duplicate retired-agent output schema remains: ${f}`);
}
if (errors.length) {
  console.error(`Repository coherence FAILED (${errors.length} issue(s))`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`Repository coherence PASS: canonical paths, 17 active agents, Appwrite Function catalog, workspace roots, no force-push shortcut, ${links} local Markdown links.`);
console.log('Note: latest-stable technology resolution, exact package-manager pin, pnpm lockfile, generated platform scaffolds, and runtime implementation remain separate bootstrap gates.');
