import fs from "node:fs";
import path from "node:path";
const root = path.resolve("contracts/deterministic");
const required = ["failure-semantics.yaml", "source-of-truth.yaml"];
for (const f of required) if (!fs.existsSync(path.join(root,f))) throw new Error(`Missing ${f}`);
const areas = fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
if (areas.length < 12) throw new Error(`Expected at least 12 deterministic domains, got ${areas.length}`);
for (const area of areas) {
  const dir=path.join(root,area);
  for (const f of ["persistence.yaml","api.yaml"]) if (!fs.existsSync(path.join(dir,f))) throw new Error(`Missing ${area}/${f}`);
  const sm=path.join(dir,"state-machine.yaml");
  if (!fs.existsSync(sm)) {
    const text=fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isFile()).map(x=>fs.readFileSync(path.join(dir,x.name),'utf8')).join('\n');
    if (/\b(state[_-]?machine|transition|initialState|initial_state|allowedStates|allowed_states)\b/i.test(text)) {
      throw new Error(`Missing ${area}/state-machine.yaml for a domain declaring state transitions`);
    }
  }
}
console.log(`deterministic contracts: PASS (${areas.length} domains; state machines conditional)`) ;
