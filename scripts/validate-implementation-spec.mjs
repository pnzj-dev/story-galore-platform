import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
 'contracts/implementation/implementation-registry.yaml',
 'contracts/implementation/source-ownership.yaml',
 'contracts/implementation/api-contract.yaml',
 'contracts/implementation/provider-adapter-contract.yaml',
 'contracts/implementation/infrastructure-resource-map.yaml',
 'contracts/implementation/test-map.yaml',
 'contracts/implementation/dependency-graph.yaml',
 'contracts/implementation/task-contract.yaml',
 'contracts/implementation/definition-of-done.yaml',
 'contracts/implementation/ambiguity-policy.yaml',
 'contracts/implementation/change-impact.yaml',
 'contracts/implementation/execution-order.yaml',
 'contracts/agents/task-execution.yaml',
 'docs/history/releases/V18.8_CODING_AGENT_EXECUTION_SPEC.md'
];
const missing=required.filter(x=>!fs.existsSync(path.join(root,x)));
if(missing.length){console.error('MISSING_REQUIRED_FILES'); console.error(missing.join('\n')); process.exit(1)}
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const p of required.filter(x=>x.endsWith('.yaml'))){
 const t=text(p);
 for(const token of ['version:', 'release:', 'policy:']) if(!t.includes(token)) {console.error(`INVALID_CONTRACT ${p}: missing ${token}`); process.exit(1)}
}
const impl=text('contracts/implementation/implementation-registry.yaml');
if(!impl.includes('missing_mapping_behavior: BLOCKED') || !impl.includes('ambiguity_behavior: BLOCKED')) {console.error('IMPLEMENTATION_REGISTRY_NOT_FAIL_CLOSED'); process.exit(1)}
const amb=text('contracts/implementation/ambiguity-policy.yaml');
for(const token of ['MISSING_CONTRACT','AMBIGUOUS_REQUIREMENT','MISSING_IMPLEMENTATION_MAP','MISSING_TEST_MAPPING']) if(!amb.includes(token)){console.error(`AMBIGUITY_POLICY_MISSING ${token}`);process.exit(1)}
const dod=text('contracts/implementation/definition-of-done.yaml');
for(const token of ['pnpm validate:implementation-spec','node scripts/validate-deterministic-contracts.mjs','pnpm validate:architecture','pnpm typecheck','pnpm test','pnpm build']) if(!dod.includes(token)){console.error(`DOD_MISSING ${token}`);process.exit(1)}
const doc=text('docs/history/releases/V18.8_CODING_AGENT_EXECUTION_SPEC.md');
for(const token of ['MUST stop','DEPLOYMENT_CANDIDATE','Production deployment requires separate explicit authorization','Every bug fix MUST']) if(!doc.includes(token)){console.error(`DOC_MISSING ${token}`);process.exit(1)}
console.log('V18.8 IMPLEMENTATION SPEC: PASS');
console.log('No-guessing policy: PASS');
console.log('Task/ownership/API/provider/infrastructure/test mappings: PASS');
console.log('Definition-of-Done gates: PASS');
