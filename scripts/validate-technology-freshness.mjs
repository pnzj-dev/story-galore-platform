import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policyPath = path.join(root, 'contracts/architecture/technology-freshness-policy.yaml');
const lockPath = path.join(root, 'contracts/architecture/technology-version-lock.yaml');
const docPath = path.join(root, 'docs/architecture/TECHNOLOGY_FRESHNESS_AND_VERSION_LOCK.md');
const errors = [];
for (const p of [policyPath, lockPath, docPath]) {
  if (!fs.existsSync(p)) errors.push(`Missing required technology freshness artifact: ${path.relative(root, p)}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
const policy = fs.readFileSync(policyPath, 'utf8');
const lock = fs.readFileSync(lockPath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');
for (const required of ['stable_only: true', 'exact_versions_required_for_implementation: true', 'silent_downgrade_allowed: false', 'TECHNOLOGY_VERSION_UNRESOLVED_OR_NOT_LATEST_STABLE']) {
  if (!policy.includes(required)) errors.push(`Policy missing required invariant: ${required}`);
}
for (const required of ['status:', 'entry_schema:', 'run_policy:', 'Every selected technology must have a fresh, dated entry']) {
  if (!lock.includes(required)) errors.push(`Version lock missing required bootstrap gate: ${required}`);
}
for (const required of ['latest stable release', 'Block if a version has no official source evidence', 'historical pins', 'prior resolution is historical evidence only', 'every release candidate']) {
  if (!doc.includes(required)) errors.push(`Documentation missing required statement: ${required}`);
}
// This validator deliberately does not assert that historical pins are latest; that requires a fresh official-source resolution.
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Technology freshness contract structure: PASS');
console.log('Latest-stable resolution: BLOCKED until the current run has fresh official-source evidence, exact pins, lockfiles, and passing compatibility tests.');
