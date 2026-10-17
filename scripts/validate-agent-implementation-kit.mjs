import fs from "node:fs"; import path from "node:path";
const root=process.cwd(); const base=path.join(root,"contracts","agents"); const reg=fs.readFileSync(path.join(base,"registry.yaml"),"utf8");
const expected=["story-producer","story-guardian","art-director","production","community-guardian","discovery-curator","reader-companion","creator-business","media-operations","support","qa-release","infrastructure","ceo","data-analysis-reporting","coding-dev","orchestrator","keep2share-import"];
const missing=expected.filter(s=>!fs.existsSync(path.join(base,"manifests",`${s}.yaml`)));
if(missing.length) { console.error(`FAIL missing manifests: ${missing.join(", ")}`); process.exit(1); }
for(const s of expected){ for(const f of [`${s}-input.yaml`,`${s}-output.yaml`]) if(!fs.existsSync(path.join(base,"output-schemas",f))){console.error(`FAIL missing schema ${f}`);process.exit(1);} const t=path.join(base,"test-matrix",`${s}.yaml`); if(!fs.existsSync(t)){console.error(`FAIL missing test matrix ${s}`);process.exit(1);} }
for(const f of ["tools/registry.yaml","delegation/graph.yaml","approvals/matrix.yaml","state-machines/agent-task.yaml","error-catalog/catalog.yaml","context-policies/default.yaml"]){if(!fs.existsSync(path.join(base,f))){console.error(`FAIL missing ${f}`);process.exit(1);}}
if((reg.match(/slug:/g)||[]).length !== 17){console.error("FAIL registry does not contain exactly 17 V1 agents");process.exit(1);}
console.log("PASS agent implementation kit: 17 manifests, schemas, tools, delegation, approvals, state machine, context policy and test matrices");
