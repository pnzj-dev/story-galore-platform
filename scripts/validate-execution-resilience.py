from pathlib import Path
root=Path(__file__).resolve().parents[1]
req=[
('contracts/execution/execution-dispatch.yaml','cloudflare_workflows'),
('contracts/execution/execution-dispatch.yaml','secondary: none'),
('contracts/execution/operation-persistence.yaml','Appwrite TablesDB'),
('contracts/tests/execution-resilience.scenarios.yaml','execution-003'),
('docs/AGENT_SLICE_53_EXECUTION_RESILIENCE.md','sole V1 durable executor'),
]
for f,s in req:
 p=root/f; assert p.exists(), f'MISSING {f}'; t=p.read_text(); assert s in t, f'MISSING {s} in {f}'
text=(root/'contracts/execution/execution-dispatch.yaml').read_text()
assert 'DURABLE_WORKFLOW:' in text and 'primary: cloudflare_workflows' in text
assert 'IMMEDIATE:' in text and 'primary: application' in text
assert 'secondary: appwrite_job_store' not in text
print('execution-resilience: PASS (8 invariants)')
