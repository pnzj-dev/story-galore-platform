import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'contracts/i18n/api.yaml',
  'contracts/i18n/language-catalog.yaml',
  'contracts/i18n/preferences.yaml',
  'contracts/i18n/content-language.yaml',
  'contracts/i18n/locale-resolution.yaml',
  'contracts/i18n/persistence.yaml',
  'contracts/i18n/state-machine.yaml',
  'contracts/i18n/events.yaml',
  'contracts/domain/publication-language.schema.yaml',
  'contracts/domain/user-language-preferences.schema.yaml',
  'contracts/tests/i18n.scenarios.yaml',
  'docs/history/releases/V18.6_INTERNATIONALIZATION.md'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing i18n contract: ${file}`);
}
const api = fs.readFileSync(path.join(root, 'contracts/i18n/api.yaml'), 'utf8');
const prefs = fs.readFileSync(path.join(root, 'contracts/i18n/preferences.yaml'), 'utf8');
const content = fs.readFileSync(path.join(root, 'contracts/i18n/content-language.yaml'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/history/releases/V18.6_INTERNATIONALIZATION.md'), 'utf8');
for (const needle of ['ONLY_SELECTED', 'server-authoritative', 'BCP 47', 'adultPolicyRule', 'entitlementRule']) {
  if (!api.includes(needle)) throw new Error(`Missing API invariant: ${needle}`);
}
for (const needle of ['uiLocale', 'contentLanguages', 'contentLanguageMode', 'ONLY_SELECTED_requires_non_empty_selection']) {
  if (!prefs.includes(needle)) throw new Error(`Missing preference invariant: ${needle}`);
}
for (const needle of ['primaryLanguage', 'contentLanguages', 'APPROVED', 'AI_TRANSLATION']) {
  if (!content.includes(needle)) throw new Error(`Missing content-language invariant: ${needle}`);
}
for (const needle of ['RTL', 'logical CSS', 'before pagination', 'BCP 47']) {
  if (!docs.includes(needle)) throw new Error(`Missing implementation rule: ${needle}`);
}
console.log('Internationalization contract validation: PASS');
