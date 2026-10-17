import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const required = [
  'contracts/integrations/appwrite-mcp-connection.yaml',
  'contracts/integrations/agent-appwrite-tool-allowlists.yaml',
  'contracts/integrations/appwrite-mcp-tool-registry.yaml',
  'docs/history/releases/V19.5.17_APPWRITE_MCP_AGENT_ACCESS.md',
  'docs/V19.5.20_CENTRAL_AGENT_GATEWAY_DECISION.md',
  'contracts/functions/definitions/central-agent-gateway.yaml',
  'contracts/functions/schemas/central-agent-gateway-input.yaml',
  'contracts/functions/schemas/central-agent-gateway-output.yaml',
  'contracts/functions/resource-maps/central-agent-gateway.yaml',
  'contracts/functions/test-matrix/central-agent-gateway.yaml',
];
const errors = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`missing required file: ${file}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const connection = read(required[0]);
const allowlists = read(required[1]);
const registry = read(required[2]);
const agents = [...allowlists.matchAll(/^  - agent_id: (sg\.agent\.[a-z0-9-]+)$/gm)].map(m => m[1]);
const expected = ['story-producer','story-guardian','art-director','production','community-guardian','discovery-curator','reader-companion','creator-business','media-operations','support','qa-release','infrastructure','ceo','data-analysis-reporting','coding-dev','orchestrator','keep2share-import'].map(x => `sg.agent.${x}`);
if (agents.length !== 17 || new Set(agents).size !== 17) errors.push(`expected 17 unique agent allowlists; found ${agents.length}`);
for (const id of expected) if (!agents.includes(id)) errors.push(`missing allowlist for ${id}`);
if (!allowlists.includes('default_decision: DENY') || !allowlists.includes('default_decision: DENY')) errors.push('deny-by-default policy missing');
for (const token of ['BLOCKED_VERIFICATION_REQUIRED','shared_unrestricted_human_oauth_session_allowed: false','backend_authorization_required: true','appwrite_permissions_required: true','DENY_AND_AUDIT']) if (!connection.includes(token)) errors.push(`connection contract missing ${token}`);
if (!registry.includes('status: BLOCKED_PENDING_OFFICIAL_CATALOG_CAPTURE') || !registry.includes('mappings: []')) errors.push('native tool registry must remain explicitly blocked until verified');
if (!read('docs/MCP.md').includes('Appwrite MCP connection')) errors.push('docs/MCP.md not aligned with canonical connection');
if (!read('docs/V1_MASTER_CONTRACT.md').includes('registered Appwrite MCP connection')) errors.push('master contract not aligned');
const functionCatalog = JSON.parse(read('backend/appwrite/functions/function-catalog.json'));
const gatewayEntries = functionCatalog.functions.filter(f => f.id === 'central-agent-gateway');
if (gatewayEntries.length !== 1) errors.push('function catalog must contain exactly one central-agent-gateway');
const gateway = read('contracts/functions/definitions/central-agent-gateway.yaml');
for (const token of ['language: GO_LATEST_STABLE_EXACT_PIN_REQUIRED','authorization: IN_PROCESS_POLICY_ENGINE','OFFICIAL_APPWRITE_CLI_ONLY','BLOCKED_PENDING_AUTH_TOOL_CATALOG_RESOURCE_MAP_AND_RUNTIME_PIN']) if (!gateway.includes(token)) errors.push(`gateway function contract missing ${token}`);
const connectionPolicy = read(required[0]);
for (const token of ['gateway_platform: APPWRITE_FUNCTIONS','gateway_function_id: central-agent-gateway','policy_engine_form: IN_PROCESS_MODULE','separate_policy_engine_deployment: PROHIBITED_UNLESS_APPROVED_ADR']) if (!connectionPolicy.includes(token)) errors.push(`connection contract missing gateway decision ${token}`);
const gatewayTests = read('contracts/functions/test-matrix/central-agent-gateway.yaml');
for (const id of Array.from({length:19},(_,i)=>`GATEWAY-${String(i+1).padStart(3,'0')}`)) if (!gatewayTests.includes(`id: ${id}`)) errors.push(`gateway security test missing ${id}`);
const gatewayResourceMap = read('contracts/functions/resource-maps/central-agent-gateway.yaml');
if (!gatewayResourceMap.includes('BLOCKED_PENDING_CANONICAL_RESOURCE_ID_REGISTRATION')) errors.push('gateway resource map must remain blocked until exact resource IDs are registered');
if (errors.length) { console.error('Appwrite MCP agent access validation FAILED:\n' + errors.map(x=>'- '+x).join('\n')); process.exit(1); }
console.log('Appwrite MCP agent access validation PASS: 17 allowlists, deny-by-default, single Appwrite Function gateway, in-process policy engine, 19 gateway security cases, authentication/catalog/resource blockers explicit.');
