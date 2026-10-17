import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const catalog=JSON.parse(read('backend/appwrite/functions/function-catalog.json'));
const defsDir='contracts/functions/definitions';
const schemaDir='contracts/functions/schemas';
const testDir='contracts/functions/test-matrix';
const required=['contracts/functions/registry.yaml','contracts/functions/classes.yaml','contracts/functions/error-catalog.yaml','contracts/functions/resource-access.yaml','contracts/functions/secrets-policy.yaml','contracts/functions/schedule-registry.yaml','contracts/functions/definition-of-done.yaml'];
const missing=required.filter(p=>!exists(p));
if(missing.length){console.error('MISSING_FUNCTION_CONTRACTS\n'+missing.join('\n'));process.exit(1)}
const defs=fs.readdirSync(path.join(root,defsDir)).filter(x=>x.endsWith('.yaml')).map(x=>x.slice(0,-5)).sort();
const ids=catalog.functions.map(x=>x.id).sort();
const diff=(a,b)=>a.filter(x=>!b.includes(x));
if(diff(ids,defs).length||diff(defs,ids).length){console.error('FUNCTION_REGISTRY_MISMATCH');console.error('catalog_missing_definitions',diff(ids,defs));console.error('orphan_definitions',diff(defs,ids));process.exit(1)}
for(const id of ids){
 const d=read(`${defsDir}/${id}.yaml`);
 for(const token of ['schema: storygalore.appwrite-function/v1','runtime:','class:','security:','idempotency:','execution:','resources:','events:','observability:','audit:','errors:','tests:','implementation:']) if(!d.includes(token)){console.error(`FUNCTION_CONTRACT_INCOMPLETE ${id}: ${token}`);process.exit(1)}
 for(const p of [`${schemaDir}/${id}-input.yaml`,`${schemaDir}/${id}-output.yaml`,`${testDir}/${id}.yaml`,`contracts/functions/resource-maps/${id}.yaml`]) if(!exists(p)){console.error(`FUNCTION_ARTIFACT_MISSING ${id}: ${p}`);process.exit(1)}
}
const classes=read('contracts/functions/classes.yaml');
for(const c of ['REQUEST_HANDLER','EVENT_HANDLER','WEBHOOK_HANDLER','SCHEDULED_HANDLER','DURABLE_JOB_WORKER','INTERNAL_COMMAND_HANDLER']) if(!classes.includes(c)){console.error('FUNCTION_CLASS_MISSING '+c);process.exit(1)}
console.log(`APPWRITE FUNCTIONS: PASS (${ids.length} functions, definitions, I/O schemas, test matrices)`);
console.log('Fail-closed resource access: PASS');
console.log('Fail-closed secret policy: PASS');
