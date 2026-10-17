import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contract = path.join(root, 'docs', 'CONSENT_PRIVACY_CONTRACT.md');
const required = [
  'Adult content display',
  'Behavioral/product analytics',
  'Session replay',
  'Personalized advertising',
  'Marketing email/push',
  'AI/model improvement use',
  'No pre-checked controls',
  'server-authoritative',
  'Withdrawal',
  'Jurisdiction'
];
if (!fs.existsSync(contract)) throw new Error('Missing docs/CONSENT_PRIVACY_CONTRACT.md');
const text = fs.readFileSync(contract, 'utf8');
for (const marker of required) if (!text.includes(marker)) throw new Error(`Missing consent contract requirement: ${marker}`);
console.log('Consent/privacy contract validation: PASS');
