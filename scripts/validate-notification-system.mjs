import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const fail = message => { console.error(`NOTIFICATION_SYSTEM_BLOCKED: ${message}`); process.exit(1); };
const schema = JSON.parse(read('backend/appwrite/tables/desired-schema.json'));
const tables = new Map(schema.tables.map(t => [t.id, t]));
for (const id of ['notifications', 'notification_preferences', 'notification_delivery_attempts']) {
  if (!tables.has(id)) fail(`missing desired TablesDB resource ${id}`);
}
const topics = JSON.parse(read('backend/appwrite/topics/topics.json'));
for (const topic of topics.topics) {
  if (!topic.id || !topic.purpose) fail('topic requires id and purpose');
}
const policy = read('contracts/deterministic/notifications/delivery-policy.yaml');
const requiredPolicy = [
  'APPWRITE_TABLESDB', 'APPWRITE_REALTIME', 'APPWRITE_MESSAGING_THROUGH_REGISTERED_ADAPTERS',
  'CLOUDFLARE_WORKFLOWS', 'direct_agent_delivery: FORBIDDEN', 'direct_client_delivery: FORBIDDEN',
  'IN_APP', 'EMAIL', 'WEB_PUSH', 'FAILED_RETRYABLE', 'FAILED_PERMANENT', 'SUPPRESSED',
  'provider_specific_template_ids', 'official API', 'idempotency'
];
for (const token of requiredPolicy) if (!policy.includes(token)) fail(`delivery policy missing ${token}`);
const state = read('contracts/deterministic/notifications/state-machine.yaml');
for (const token of ['model: INBOX_LIFECYCLE', 'readAt=null', 'resource: notification_delivery_attempts', 'VERIFIED_DELIVERY_RECEIPT']) {
  if (!state.includes(token)) fail(`state contract missing ${token}`);
}
const fn = read('contracts/functions/definitions/notifications.yaml');
if (!fn.includes('class: REQUEST_HANDLER')) fail('notifications Appwrite Function must be a request handler, not a durable job runner');
if (!fn.includes('durable_delivery: CLOUDFLARE_WORKFLOWS_ONLY')) fail('durable delivery must use Cloudflare Workflows');
if (!fn.includes('direct_provider_access: REGISTERED_ADAPTERS_ONLY')) fail('direct provider access must be adapter-gated');
const tests = read('tests/contracts/notification-system-scenarios.yaml');
for (const id of ['NS-001','NS-002','NS-003','NS-004','NS-005','NS-006','NS-007','NS-008','NS-009','NS-010','NS-011','NS-012','NS-013','NS-014']) {
  if (!tests.includes(`id: ${id}`)) fail(`missing scenario ${id}`);
}
for (const p of [
  'docs/NOTIFICATION_SYSTEM.md',
  'contracts/deterministic/notifications/api.yaml',
  'contracts/deterministic/notifications/persistence.yaml',
  'contracts/deterministic/notifications/state-machine.yaml',
  'contracts/deterministic/notifications/delivery-policy.yaml',
  'contracts/functions/test-matrix/notifications.yaml',
  'contracts/clients/notifications.json'
]) if (!exists(p)) fail(`missing contract artifact ${p}`);
const client = JSON.parse(read('contracts/clients/notifications.json'));
if (!client.requirements.includes('channel-specific delivery status separate from notification read state')) fail('client contract must separate read and delivery state');
console.log('NOTIFICATION SYSTEM CONTRACTS: PASS');
console.log('Resources: 3 desired TablesDB resources; durable delivery: Cloudflare Workflows; Realtime: UI updates only');
console.log('Scenarios: 14 contract scenarios present; production/provider verification remains a declared blocker');
