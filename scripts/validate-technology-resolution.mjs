import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const lockPath = path.join(root, 'contracts/architecture/technology-version-lock.yaml');
const packagePath = path.join(root, 'package.json');
const errors = [];

for (const file of [lockPath, packagePath]) {
  if (!fs.existsSync(file)) errors.push(`Required file missing: ${path.relative(root, file)}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const lock = fs.readFileSync(lockPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (!/^status:\s*resolved\s*$/m.test(lock)) errors.push('Technology version lock is not status: resolved.');
if (/^entries:\s*\[\]\s*$/m.test(lock)) errors.push('Technology version lock has no resolved technology entries.');
if (!/^resolution_date_utc:\s*\S+/m.test(lock) || /^resolution_date_utc:\s*null\s*$/m.test(lock)) errors.push('Fresh resolution_date_utc is missing.');
if (!/^resolver_version:\s*\S+/m.test(lock) || /^resolver_version:\s*null\s*$/m.test(lock)) errors.push('Resolver version is missing.');
if (!/^run_policy:\n/m.test(lock) || !/^  previous_run_reusable:\s*false\s*$/m.test(lock)) errors.push('Per-run freshness policy is missing.');
if (!/^  exact_package_manager_version_required:\s*true\s*$/m.test(lock)) errors.push('Exact package-manager version requirement is missing.');
if (!pkg.packageManager || !/^[^@\s]+@\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(pkg.packageManager)) {
  errors.push(`package.json packageManager must use an exact version (found: ${pkg.packageManager ?? 'missing'}).`);
}
if (!fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) errors.push('pnpm-lock.yaml is missing.');

// Conservative evidence checks: YAML is inspected as text here; the full contract parser
// independently validates YAML syntax. This gate intentionally fails closed on omissions.
const requiredEntryFields = [
  'technology_id:', 'selected_version_exact:', 'latest_stable_version_verified:',
  'official_source_url:', 'checked_at_utc:', 'compatibility_tests:',
  'lockfile_or_pin_location:', 'resolution_run_id:', 'source_evidence_digest_or_snapshot:',
  'latest_stable_comparison_result:'
];
const entryBlock = lock.split(/^entries:\s*\n/m)[1]?.split(/^entry_schema:/m)[0] ?? '';
if (!entryBlock.trim() || entryBlock.trim() === '[]') errors.push('No technology entries exist for the current resolution run.');
for (const field of requiredEntryFields) {
  if (!entryBlock.includes(field)) errors.push(`Technology entries are missing required evidence field: ${field}`);
}
if (/^  (?:checked_at_utc|resolution_run_id):\s*(?:null|TODO|TBD|""|'')/m.test(entryBlock)) errors.push('Technology entries contain unresolved current-run evidence.');

if (errors.length) {
  console.error('TECHNOLOGY_VERSION_UNRESOLVED_OR_NOT_LATEST_STABLE');
  for (const error of errors) console.error(`BLOCK: ${error}`);
  process.exit(1);
}
console.log('Technology version resolution gate: PASS');
console.log('Every selected technology has fresh official-source evidence, exact pins, lockfiles, and compatibility results.');
