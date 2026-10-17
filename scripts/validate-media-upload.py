from pathlib import Path
import yaml, json
r=Path('.')
def load(p): return yaml.safe_load((r/p).read_text())
sm=load('contracts/state-machines/media-upload.yaml')
states=set(sm['states'])
assert sm.get('canonical') is True
assert sm.get('transitions')
for t in sm['transitions']:
    fs=t['from'] if isinstance(t['from'],list) else [t['from']]
    assert all(x in states for x in fs) and t['to'] in states
api=load('contracts/deterministic/media/api.yaml')
assert {x['name'] for x in api['commands']} >= {'media_upload_create','media_upload_complete','media_upload_recover'}
pers=load('contracts/deterministic/media/persistence.yaml')['persistence']
assert {'media_upload_sessions','media_assets'} <= {x['resource'] for x in pers}
for f in ['upload-session.schema.yaml','upload-chunk.schema.yaml','upload-progress.schema.yaml','upload-completion.schema.yaml','upload-recovery.schema.yaml']:
    assert (r/'contracts/media'/f).exists()
sc=json.loads((r/'tests/contracts/deterministic-domain-scenarios.json').read_text())
scenarios=sc['scenarios']
assert sum(1 for x in scenarios if x.get('area')=='media') >= 8
print('media resumable upload: PASS')
