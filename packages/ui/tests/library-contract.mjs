import { readFileSync, existsSync } from 'node:fs';
const root = (file) => new URL('../' + file, import.meta.url);
const required = [
  'src/index.ts', 'src/primitives/Button.svelte', 'src/primitives/StatusBadge.svelte',
  'src/primitives/EmptyState.svelte', 'src/composites/AsyncButton.svelte',
  'src/domain/DraftStatus.svelte', 'src/domain/ContentRatingBadge.svelte', 'README.md'
];
for (const file of required) if (!existsSync(root(file))) throw new Error(`Missing UI library file: ${file}`);
const read = f => readFileSync(root(f), 'utf8');
const pkg = JSON.parse(read('package.json'));
for (const dep of ['bits-ui', '@lucide/svelte']) if (!pkg.dependencies?.[dep]) throw new Error(`Missing UI dependency: ${dep}`);
if (!read('src/primitives/Button.svelte').includes('aria-busy')) throw new Error('Button must expose async state');
if (!read('src/domain/DraftStatus.svelte').includes('conflict')) throw new Error('DraftStatus must cover conflict');
console.log('UI component library contract PASS');
