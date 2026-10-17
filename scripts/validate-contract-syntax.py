from pathlib import Path
import yaml
bad=[]
count=0
for p in Path('contracts').rglob('*.yaml'):
    count += 1
    try:
        yaml.safe_load(p.read_text())
    except Exception as exc:
        bad.append((str(p), str(exc)))
if bad:
    print('CONTRACT SYNTAX BLOCKED')
    for p,e in bad: print(f'{p}: {e}')
    raise SystemExit(1)
print(f'CONTRACT YAML SYNTAX: PASS ({count} files)')
