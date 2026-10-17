import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'contracts/astro/architecture.yaml',
  'contracts/astro/features.yaml',
  'contracts/astro/content-contract.yaml',
  'contracts/astro/routes.yaml',
  'contracts/astro/route-protection.yaml',
  'contracts/security/authorization-completeness.yaml',
  'contracts/astro/hydration.yaml',
  'contracts/astro/middleware.yaml',
  'contracts/astro/actions.yaml',
  'contracts/astro/view-transitions.yaml',
  'contracts/astro/assets.yaml',
  'contracts/astro/performance.yaml',
  'contracts/astro/dependency-policy.yaml',
  'contracts/appwrite/sites/deployment.yaml',
  'contracts/appwrite/sites/runtime.yaml',
  'contracts/appwrite/sites/environment.yaml',
  'contracts/appwrite/sites/git-deployment.yaml',
  'contracts/appwrite/sites/configuration-registry.yaml',
  'contracts/appwrite/sites/agent-deployment-dod.yaml',
  'appwrite.config.json.example',
  'contracts/implementation/ui-astro-implementation-registry.yaml',
  'contracts/implementation/route-task-contract.yaml',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`ASTRO_APPWRITE_BLOCKER missing:${file}`);
}
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const assertContains = (file, values) => {
  const text = read(file);
  for (const value of values) if (!text.includes(value)) throw new Error(`ASTRO_APPWRITE_BLOCKER ${file} missing:${value}`);
};
assertContains('contracts/astro/architecture.yaml', ['ASTRO','APPWRITE_SITES','ASTRO_NATIVE_FIRST','prefer_file_based_routing','prefer_content_collections','prefer_markdown_for_posts','prefer_astro_assets','prefer_view_transitions','prefer_astro_actions_for_web_mutations','minimize_hydration','route_protection_is_independent_per_route_group','backend_authorization_recheck_is_mandatory']);
assertContains('contracts/astro/routes.yaml', ['every_route_requires_protection_mapping: true','unregistered_route: BLOCK','/creator/**','/studio/**','/admin/**']);
assertContains('contracts/astro/route-protection.yaml', ['middleware_is_early_gate_not_authority: true','backend_authorization_is_mandatory: true','client_only_authorization_forbidden: true','Missing route mapping','is BLOCK']);
assertContains('contracts/security/authorization-completeness.yaml', ['astro_middleware_is_not_authority: true','backend_rechecks_authorization: true','unknown_or_missing_route_policy: BLOCK']);
assertContains('contracts/astro/features.yaml', ['file_based_routing:','content_collections:','markdown:','optimized_images:','view_transitions:','actions:','middleware:']);
assertContains('contracts/appwrite/sites/deployment.yaml', ['platform: APPWRITE_SITES','framework: astro','rendering: SSR','output_directory: ./dist','build_runtime: node-22','other_hosting_platform_without_adr: BLOCK']);
assertContains('contracts/appwrite/sites/environment.yaml', ['APPWRITE_SITE_API_KEY','no_service_api_key_in_browser_bundle: true','least_scope_required: true']);
assertContains('contracts/appwrite/sites/git-deployment.yaml', ['production_branch: main','non_main_push_creates_preview_deployment: true']);
assertContains('appwrite.config.json.example', ['"framework": "astro"','"adapter": "ssr"','"buildRuntime": "node-22"','"path": "apps/web"']);
{
  const config = read('apps/web/astro.config.mjs');
  if (!config.includes('output: "server"')) throw new Error('ASTRO_APPWRITE_BLOCKER web must use server output');
  if (!config.includes('@astrojs/node')) throw new Error('ASTRO_APPWRITE_BLOCKER web missing Node adapter');
  if (!config.includes('mode: "standalone"')) throw new Error('ASTRO_APPWRITE_BLOCKER web missing standalone adapter mode');
  const pkg = JSON.parse(read('apps/web/package.json'));
  if (!pkg.dependencies['@astrojs/node']) throw new Error('ASTRO_APPWRITE_BLOCKER web missing @astrojs/node dependency');
  if (Object.values(pkg.dependencies).includes('latest')) throw new Error('ASTRO_APPWRITE_BLOCKER web contains latest dependency tag');
}
const allPackageFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.git','.astro','dist'].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name === 'package.json') allPackageFiles.push(p);
  }
}
walk(root);
for (const p of allPackageFiles) {
  const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
  for (const sec of ['dependencies','devDependencies','optionalDependencies']) {
    for (const [name, version] of Object.entries(pkg[sec] ?? {})) {
      if (version === 'latest') throw new Error(`ASTRO_APPWRITE_BLOCKER unpinned dependency ${name} in ${path.relative(root,p)}`);
    }
  }
}
console.log('PASS Astro + Appwrite Sites contract: native features, SSR/static rules, deployment, environment security and pinned dependencies');
