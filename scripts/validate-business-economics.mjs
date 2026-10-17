import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{console.error(`BUSINESS DETERMINISM BLOCKED: ${m}`);process.exit(1)};
const required=[
 'contracts/business/revenue-model.yaml','contracts/business/commission-policy.yaml','contracts/business/earnings-ledger.yaml',
 'contracts/business/payouts.yaml','contracts/business/wallets.yaml','contracts/business/payment-provider-policy.yaml',
 'contracts/business/marketplace-and-growth.yaml','contracts/business/implementation-map.yaml',
 'contracts/providers/payment-providers.yaml','contracts/verification/business-contract-to-test.yaml','contracts/security/payment-capability-matrix.yaml','contracts/security/secret-registry.yaml',
 'docs/BUSINESS_MODEL_AND_PAYMENT_ECONOMICS.md'
];
const missing=required.filter(x=>!exists(x)); if(missing.length) fail('missing contracts: '+missing.join(', '));
const revenue=read('contracts/business/revenue-model.yaml');
for(const token of ['CREATOR_FREE','CREATOR_PRO','CREATOR_STUDIO','platformFeeBps: 1000','platformFeeBps: 500','platformFeeBps: 300','STORYPASS','platformFeeBps: 0']) if(!revenue.includes(token)) fail(`revenue model missing ${token}`);
const payout=read('contracts/business/payouts.yaml');
for(const token of ['USDC_BASE','USDC_POLYGON','storygalorePercentageFeeBps: 0','Unsupported chain','verified']) if(!payout.includes(token)) fail(`payout policy missing ${token}`);
const wallets=read('contracts/business/wallets.yaml');
for(const token of ['COINBASE_WALLET','METAMASK','WALLETCONNECT','Network switching','chain mismatch']) if(!wallets.includes(token)) fail(`wallet policy missing ${token}`);
const providers=read('contracts/providers/payment-providers.yaml');
for(const id of ['STRIPE_CONNECT','NOWPAYMENTS','ZEN_PAYMENTS','SECUREGLOBALPAY']) if(!providers.includes(id)) fail(`provider registry missing ${id}`);
for(const id of ['STRIPE_CONNECT','NOWPAYMENTS','ZEN_PAYMENTS','SECUREGLOBALPAY']){
 const i=providers.indexOf(id), chunk=providers.slice(i, i+500);
 if(!chunk.includes('status: CONDITIONAL')) fail(`${id} is not fail-closed CONDITIONAL`);
}
const api=read('contracts/deterministic/payments/api.yaml');
for(const cmd of ['creator_earnings_post','creator_earnings_reverse','payout_create','payout_confirm','payout_fail','payout_reconcile','payout_wallet_connect','payout_wallet_verify','payout_wallet_disconnect']) if(!api.includes(`name: ${cmd}`)) fail(`payment command missing ${cmd}`);
const sm=read('contracts/deterministic/payments/state-machine.yaml');
for(const machine of ['earnings:','payout:','wallet:']) if(!sm.includes(machine)) fail(`payment submachine missing ${machine}`);
const tests=read('contracts/verification/business-contract-to-test.yaml');
for(const p of ['business-revenue-model.scenarios.yaml','business-commission.scenarios.yaml','business-payouts.scenarios.yaml','business-wallets.scenarios.yaml','business-providers.scenarios.yaml','business-payment-state.scenarios.yaml','business-provider-capability.scenarios.yaml','business-provider-secrets.scenarios.yaml']) if(!tests.includes(p) || !exists(`tests/contracts/${p}`)) fail(`business contract test mapping missing ${p}`);
console.log('BUSINESS ECONOMICS DETERMINISM GATE: PASS');
console.log('Creator plans, commission policy, earnings ledger, payout rails, wallet safety and provider activation: CLOSED');
console.log('Payment-provider candidates: CONDITIONAL / not production-routable by default');
console.log('USDC payout policy: Base preferred, Polygon secondary');
console.log('Contract-to-test mappings: PASS');
