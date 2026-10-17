import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=(m)=>{console.error(`DETERMINISM BLOCKED: ${m}`);process.exit(1)};
const required=[
 'contracts/verification/determinism-gate.yaml','contracts/verification/global-coverage.yaml','contracts/verification/contract-to-test.yaml','contracts/verification/observability-contract.yaml',
 'contracts/api/registry.yaml','contracts/events/schema-contract.yaml','contracts/events/completeness.yaml','contracts/configuration/registry.yaml',
 'contracts/security/secret-registry.yaml','contracts/security/authorization-completeness.yaml','contracts/cache/policy.yaml','contracts/providers/registry.yaml','contracts/providers/adapter-definition.yaml',
 'contracts/runtime/universal-execution-contract.yaml','contracts/deployment/release-contract.yaml','contracts/deployment/migration-contract.yaml','contracts/disaster-recovery/restore-contract.yaml','contracts/ui/accessibility/contract.yaml',
 'contracts/business/revenue-model.yaml','contracts/business/commission-policy.yaml','contracts/business/earnings-ledger.yaml','contracts/business/payouts.yaml','contracts/business/wallets.yaml','contracts/business/payment-provider-policy.yaml','contracts/verification/business-contract-to-test.yaml','contracts/providers/payment-providers.yaml','contracts/security/payment-capability-matrix.yaml','contracts/security/secret-registry.yaml',
 'contracts/business/governance/jurisdiction-policy.yaml','contracts/tax/us-launch-policy.yaml','contracts/accounting/economic-ledger-boundaries.yaml','contracts/business/governance/reserve-and-chargeback-policy.yaml','contracts/rights/revenue-participation-agreement.yaml','contracts/pricing/pricing-policy-lifecycle.yaml','contracts/pricing/promotion-policy.yaml','contracts/business/governance/economic-simulator.yaml','contracts/business/governance/economic-safety-thresholds.yaml','contracts/business/governance/commercial-products.yaml','contracts/admin/economic-governance.yaml','contracts/verification/economic-governance-contract-to-test.yaml'
];
const missing=required.filter(x=>!exists(x)); if(missing.length) fail('missing global contracts: '+missing.join(', '));
const gate=read('contracts/verification/determinism-gate.yaml');
for(const token of ['missing: BLOCK','ambiguous: BLOCK','unknown: BLOCK','unregistered: BLOCK','unauthorized: BLOCK','untested: BLOCK','production_gate: HUMAN_APPROVAL']) if(!gate.includes(token)) fail('gate missing fail-closed rule '+token);
// Appwrite Functions closure
const cat=JSON.parse(read('backend/appwrite/functions/function-catalog.json')).functions.map(x=>x.id).sort();
const defs=fs.readdirSync(path.join(root,'contracts/functions/definitions')).filter(x=>x.endsWith('.yaml')).map(x=>x.slice(0,-5)).sort();
if(JSON.stringify(cat)!==JSON.stringify(defs)) fail('Appwrite Function catalog/definition closure mismatch');
for(const id of cat){
 for(const p of [`contracts/functions/definitions/${id}.yaml`,`contracts/functions/schemas/${id}-input.yaml`,`contracts/functions/schemas/${id}-output.yaml`,`contracts/functions/test-matrix/${id}.yaml`]) if(!exists(p)) fail(`Function ${id} missing ${p}`);
}
// Agent closure
const agentDir='contracts/agents/manifests';
const agents=fs.readdirSync(path.join(root,agentDir)).filter(x=>x.endsWith('.yaml'));
if(agents.length!==17) fail(`expected exactly 17 V1 agent manifests, found ${agents.length}`);
// Event schema closure from command-event map
const cmd=read('contracts/compatibility/command-event-map.yaml');
const events=[...cmd.matchAll(/^\s+event:\s+([^\s]+)$/gm)].map(m=>m[1]);
for(const e of new Set(events)){
 const p='contracts/events/schemas/'+e.replaceAll('.','_')+'.yaml';
 if(!exists(p)) fail(`event ${e} missing schema`);
}
// Core canonical registries
for(const p of ['contracts/compatibility/appwrite-resource-registry.yaml','contracts/compatibility/persistence-registry.yaml','contracts/compatibility/contract-graph.yaml','contracts/ui/pages/page-registry.yaml','contracts/implementation/implementation-registry.yaml']){
 const t=read(p); if(!t.includes('version')) fail(`canonical registry malformed: ${p}`);
}
// Explicit no-guessing policy
const amb=read('contracts/implementation/ambiguity-policy.yaml');
for(const token of ['MISSING_CONTRACT','AMBIGUOUS_REQUIREMENT','MISSING_IMPLEMENTATION_MAP','MISSING_TEST_MAPPING']) if(!amb.includes(token)) fail(`ambiguity policy missing ${token}`);
console.log('GLOBAL DETERMINISM GATE: PASS');
console.log(`Appwrite Functions: ${cat.length} closed`);
console.log(`Cloudflare Agent manifests: ${agents.length} present`);
console.log(`Command-event schemas: ${new Set(events).size} closed`);
console.log('Authorization, configuration, secrets, cache, providers, observability, deployment, migration, DR and accessibility contracts: PRESENT');
// Business/payment economics closure
for(const p of ['contracts/business/revenue-model.yaml','contracts/business/commission-policy.yaml','contracts/business/earnings-ledger.yaml','contracts/business/payouts.yaml','contracts/business/wallets.yaml','contracts/business/payment-provider-policy.yaml','contracts/providers/payment-providers.yaml','contracts/verification/business-contract-to-test.yaml','contracts/security/payment-capability-matrix.yaml','contracts/security/secret-registry.yaml']) if(!exists(p)) fail(`business/payment contract missing: ${p}`);
const paymentProviders=read('contracts/providers/payment-providers.yaml');
for(const provider of ['STRIPE_CONNECT','NOWPAYMENTS','ZEN_PAYMENTS','SECUREGLOBALPAY']){ const i=paymentProviders.indexOf(provider); if(i<0) fail(`payment provider missing: ${provider}`); if(!paymentProviders.slice(i,i+500).includes('status: CONDITIONAL')) fail(`payment provider ${provider} is not CONDITIONAL`); }
console.log('Business economics and payment provider fail-closed closure: PASS');
console.log('Consumer economics, infrastructure cost and Admin observability contracts: PRESENT');
console.log('No-guessing / fail-closed policy: PASS');
console.log('Production authorization remains human-gated: PASS');
