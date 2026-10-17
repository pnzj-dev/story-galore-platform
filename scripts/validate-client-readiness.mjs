import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
 'docs/CLIENT_ARCHITECTURE.md','docs/MOBILE_READINESS.md','docs/DESKTOP_READINESS.md','docs/MOBILE_DESKTOP_FREEZE_GATE.md',
 ...['client-platform','auth','reader','offline','downloads','notifications','messaging','analytics','deep-links','device-sessions','desktop'].map(x=>`contracts/clients/${x}.json`)
];
const missing = required.filter(p=>!fs.existsSync(path.join(root,p)));
if(missing.length){ console.error('FAIL missing client readiness artifacts:', missing); process.exit(1); }
const text = fs.readFileSync(path.join(root,'docs/CLIENT_ARCHITECTURE.md'),'utf8');
for(const s of ['WEB','ANDROID','IOS','DESKTOP','client-neutral','authorization']) if(!text.includes(s)) { console.error('FAIL invariant:',s); process.exit(1); }
console.log(`PASS client readiness: ${required.length} artifacts; WEB/ANDROID/IOS/DESKTOP covered`);
