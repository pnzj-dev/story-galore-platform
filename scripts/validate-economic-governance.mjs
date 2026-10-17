import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{console.error(`ECONOMIC GOVERNANCE BLOCKED: ${m}`);process.exit(1)};
const required=[
 'contracts/business/governance/jurisdiction-policy.yaml',
 'contracts/tax/us-launch-policy.yaml',
 'contracts/accounting/economic-ledger-boundaries.yaml',
 'contracts/business/governance/reserve-and-chargeback-policy.yaml',
 'contracts/rights/revenue-participation-agreement.yaml',
 'contracts/pricing/pricing-policy-lifecycle.yaml',
 'contracts/pricing/promotion-policy.yaml',
 'contracts/business/governance/economic-simulator.yaml',
 'contracts/business/governance/economic-safety-thresholds.yaml',
 'contracts/business/governance/commercial-products.yaml',
 'contracts/admin/economic-governance.yaml',
 'contracts/verification/economic-governance-contract-to-test.yaml',
 'tests/contracts/business-governance/us-first.scenarios.yaml',
 'tests/contracts/business-governance/pricing-lifecycle.scenarios.yaml',
 'tests/contracts/business-governance/revenue-participation.scenarios.yaml',
 'tests/contracts/business-governance/economic-simulator.scenarios.yaml'
];
for(const p of required) if(!exists(p)) fail(`missing required contract/test: ${p}`);
const jurisdiction=read('contracts/business/governance/jurisdiction-policy.yaml');
for(const token of ['country: US','primaryCountry: US','settlementCurrency: USD','enabled: false','HUMAN_APPROVAL_REQUIRED','Unknown jurisdiction policy MUST BLOCK']) if(!jurisdiction.includes(token)) fail(`jurisdiction contract missing ${token}`);
for(const p of ['contracts/business/revenue-model.yaml','contracts/business/consumer-plans.yaml']){
 const s=read(p); if(!s.includes('currency: USD')) fail(`${p} is not USD launch configured`);
}
const tax=read('contracts/tax/us-launch-policy.yaml');
for(const token of ['REGISTERED_TAX_PROVIDER','Tax rates MUST NOT be hard-coded','Unknown nexus','International tax behavior']) if(!tax.includes(token)) fail(`US tax boundary missing ${token}`);
const accounting=read('contracts/accounting/economic-ledger-boundaries.yaml');
for(const token of ['cash_received','deferred_revenue','creator_payable','tax_payable','creator_reserve','chargeback_exposure']) if(!accounting.includes(token)) fail(`accounting boundary missing ${token}`);
const lifecycle=read('contracts/pricing/pricing-policy-lifecycle.yaml');
for(const token of ['DRAFT','SIMULATED','REVIEWED','APPROVED','SCHEDULED','ACTIVE','RETIRED','human approval']) if(!lifecycle.includes(token)) fail(`pricing lifecycle missing ${token}`);
console.log('ECONOMIC GOVERNANCE GATE: PASS');
console.log('US-first jurisdiction, tax/accounting boundaries, reserves, rights allocation, pricing lifecycle and simulation contracts: PRESENT');
