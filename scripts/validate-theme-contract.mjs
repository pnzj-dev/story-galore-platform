import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'contracts/ui/theme/appearance.yaml',
  'contracts/ui/theme/design-tokens.yaml',
  'contracts/ui/theme/component-theme-map.yaml',
  'contracts/ui/theme/implementation-map.yaml',
  'contracts/ui/theme/agent-rules.yaml',
  'contracts/tests/theme.scenarios.yaml'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`THEME_BLOCKER missing:${file}`);
}
const appearance = fs.readFileSync(path.join(root, required[0]), 'utf8');
const tokens = fs.readFileSync(path.join(root, required[1]), 'utf8');
const scenarios = fs.readFileSync(path.join(root, required[5]), 'utf8');
for (const value of ['LIGHT','DARK','SYSTEM','resolved_theme_available_before_first_paint','hydration_mismatch_forbidden','flash_of_wrong_theme_forbidden','no_hardcoded_theme_colors']) {
  if (!appearance.includes(value)) throw new Error(`THEME_BLOCKER missing appearance rule:${value}`);
}
for (const value of ['LIGHT: packages/ui/src/tokens/light.css','DARK: packages/ui/src/tokens/dark.css','semantic_token_reference_required: true']) {
  if (!tokens.includes(value)) throw new Error(`THEME_BLOCKER missing token rule:${value}`);
}
for (const id of ['THEME-008','THEME-009','THEME-010','THEME-011','THEME-012','THEME-013']) {
  if (!scenarios.includes(id)) throw new Error(`THEME_BLOCKER missing scenario:${id}`);
}
console.log('THEME CONTRACT PASS');
