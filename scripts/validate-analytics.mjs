import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const coverage = read('contracts/analytics/domain-coverage.json');
const admin = read('contracts/analytics/admin-surface.json');
const agents = read('contracts/analytics/agent-tools.json');
const dictionary = fs.readFileSync(path.join(root,'docs/analytics/ANALYTICS_DATA_DICTIONARY.md'),'utf8');

const requiredDocs = [
  'docs/analytics/ANALYTICS_V1.md',
  'docs/analytics/ANALYTICS_DATA_DICTIONARY.md',
  'contracts/analytics/admin-surface.json',
  'contracts/analytics/agent-tools.json',
  'contracts/analytics/domain-coverage.json'
];
for (const f of requiredDocs) if (!fs.existsSync(path.join(root,f))) throw new Error(`Missing ${f}`);
if (coverage.domains.length < 33) throw new Error('Expected at least 33 V1 analytics domains');
if (admin.routes.length < 15) throw new Error('Admin analytics surface is incomplete');
if (agents.tools.length < 10) throw new Error('Agent analytics tool surface is incomplete');
for (const k of ['MRR','ARR','CAC','LTV','Churn','Activation rate','CTR','First response time']) if (!dictionary.includes(`| ${k} |`)) throw new Error(`Missing KPI definition: ${k}`);
for (const r of admin.routes) if (!r.route || !r.capability || !r.roles?.length || !r.projection) throw new Error(`Invalid admin analytics route: ${JSON.stringify(r)}`);
for (const t of agents.tools) if (!t.tool || !t.capability || !t.roles?.length) throw new Error(`Invalid agent analytics tool: ${JSON.stringify(t)}`);
console.log(`Analytics validation PASS: ${coverage.domains.length} domains, ${admin.routes.length} admin routes, ${agents.tools.length} agent tools.`);
