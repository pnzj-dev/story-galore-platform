from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
required=[
 'contracts/deterministic/media/distribution-api.yaml',
 'contracts/media/distribution-config.schema.yaml',
 'contracts/media/distribution-status.schema.yaml',
 'contracts/media/distribution-events.yaml',
 'contracts/state-machines/media-distribution.yaml',
 'docs/history/releases/V18.0_SECONDARY_MEDIA_DISTRIBUTION.md',
 'docs/adr/0014-secondary-media-distribution.md',
 'docs/AGENT_SLICE_52_SECONDARY_MEDIA_DISTRIBUTION.md',
 'contracts/tests/media-distribution.scenarios.yaml',
]
for f in required:
    if not (ROOT/f).exists(): raise SystemExit(f'Missing {f}')

def read(f): return (ROOT/f).read_text()
api=read('contracts/deterministic/media/distribution-api.yaml')
config=read('contracts/media/distribution-config.schema.yaml')
distapi=read('contracts/deterministic/media/distribution-api.yaml')
sm=read('contracts/state-machines/media-distribution.yaml')
graph=read('contracts/compatibility/contract-graph.yaml')
mcp=read('contracts/compatibility/mcp-command-map.yaml')
ui=read('contracts/compatibility/ui-command-map.yaml')
rbac=read('contracts/permissions/admin-rbac.json')
manifest=read('contracts/compatibility/compatibility-manifest.yaml')
checks={
 'primary_cloudflare': 'provider: cloudflare' in distapi and 'const: cloudflare' in config,
 'secondary_bunny': 'provider: bunny' in distapi and 'const: bunny' in config,
 'secondary_toggle': 'secondaryEnabled' in config,
 'automatic_failover_mode': 'AUTOMATIC_FAILOVER' in config,
 'primary_only_mode': 'PRIMARY_ONLY' in config,
 'secondary_only_mode': 'SECONDARY_ONLY' in config,
 'config_command': 'media_distribution_config_update' in api,
 'required_capability': 'operations.media_distribution.configure' in api,
 'state_machine': 'name: media-distribution' in sm,
 'disabled_invariant': 'secondaryEnabled=false MUST force effective failoverMode=PRIMARY_ONLY' in config,
 'no_origin_fallback': 'Appwrite public URLs are never a delivery fallback.' in sm,
 'graph_command': 'media_distribution_config_update' in graph,
 'mcp_mapping': 'mcp_media_distribution_config_update' in mcp,
 'ui_mapping': 'admin_media_distribution_config_update' in ui,
 'rbac_capability': 'operations.media_distribution.configure' in rbac,
 'v18_manifest': "contractVersion: '18.1'" in manifest,
 'scenario_count': 'id: md-012' in read('contracts/tests/media-distribution.scenarios.yaml'),
 'agent_slice': 'Agent Slice 52' in read('docs/AGENT_SLICE_52_SECONDARY_MEDIA_DISTRIBUTION.md'),
}
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('Media distribution validation failed: '+', '.join(failed))
print(f'Media distribution validation passed: {len(checks)} deterministic invariants.')
