import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/POSTHOG.md',
  'docs/ANALYTICS_EVENT_TAXONOMY.md',
  'docs/ANALYTICS_PRIVACY_BOUNDARY.md',
  'contracts/analytics-events/posthog-v1.json',
  'packages/analytics/README.md',
  'packages/analytics/providers/posthog/README.md'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}
const c = JSON.parse(fs.readFileSync(path.join(root, 'contracts/analytics-events/posthog-v1.json'), 'utf8'));
if (c.provider !== 'posthog' || c.authoritativeSource !== 'storygalore_domain_and_analytics') throw new Error('Invalid PostHog contract');
if (!c.forbiddenProperties.includes('providerApiKey') || !c.forbiddenProperties.includes('rawPrompt')) throw new Error('Privacy boundary incomplete');
console.log(`PostHog contract OK: ${c.events.length} events`);
