from pathlib import Path
import yaml
root=Path('.')
def load(p): return yaml.safe_load(Path(p).read_text())
g=load('contracts/compatibility/contract-graph.yaml')
actual={p.name for p in Path('contracts/deterministic').iterdir() if p.is_dir()}
if set(g['domains'])!=actual: raise AssertionError('domain graph mismatch')
seen=[]; commands={}; queries={}
for area,d in g['domains'].items():
    sm=load(d['stateMachine']); states=set(sm['states']); transitions=sm.get('transitions',[])
    if not transitions: raise AssertionError(f'{area}: missing explicit transitions')
    for t in transitions:
        fs=t['from'] if isinstance(t['from'], list) else [t['from']]
        if any(x not in states for x in fs) or t['to'] not in states: raise AssertionError(f'{area}: invalid transition')
    for machine_name, machine in sm.get('submachines', {}).items():
        sub_states=set(machine.get('states', [])); sub_transitions=machine.get('transitions', [])
        if not sub_transitions: raise AssertionError(f'{area}.{machine_name}: missing explicit transitions')
        for t in sub_transitions:
            fs=t['from'] if isinstance(t['from'], list) else [t['from']]
            if any(x not in sub_states for x in fs) or t['to'] not in sub_states: raise AssertionError(f'{area}.{machine_name}: invalid transition')
    api=load(f'contracts/deterministic/{area}/api.yaml'); pers=load(f'contracts/deterministic/{area}/persistence.yaml')
    for c in api.get('commands',[]): commands[c['name']]=area
    for q in api.get('queries',[]):
        qname=q['name'] if isinstance(q, dict) else q
        queries[qname]=area
    for c in api.get('commands',[]):
        if c.get('sourceOfTruthWrite') and c.get('emitsVersionedEvent') is not True: raise AssertionError(f'{area}:{c["name"]} missing event declaration')
    for r in pers.get('persistence',[]): seen.append((r['resource'],area))
if len(seen)!=len(set(x[0] for x in seen)): raise AssertionError('duplicate persistence resources across domains')
# subscription canonical view
src=load('contracts/state-machines/subscription.yaml'); det=load('contracts/deterministic/subscriptions/state-machine.yaml')
if det['states']!=src['states'] or det['transitions']!=src['transitions']: raise AssertionError('subscription compatibility view drift')
# Specialized bounded contexts (Studio/Media)
for ctx, spec in g.get('specializedContexts', {}).items():
    for smp in spec.get('stateMachines', []):
        sm=load(smp)
        machines=sm.get('machines')
        if machines:
            for machine in machines:
                states=set(machine.get('states', [])); ts=machine.get('transitions', [])
                if not ts: raise AssertionError(f'{ctx}: {machine["machine"]} missing explicit transitions')
                for t in ts:
                    fs=t['from'] if isinstance(t['from'], list) else [t['from']]
                    if any(x not in states for x in fs) or t['to'] not in states: raise AssertionError(f'{ctx}: invalid transition')
        else:
            states=set(sm.get('states', [])); ts=sm.get('transitions', [])
            if not ts: raise AssertionError(f'{ctx}: missing explicit transitions')
            for t in ts:
                fs=t['from'] if isinstance(t['from'], list) else [t['from']]
                if any(x not in states for x in fs) or t['to'] not in states: raise AssertionError(f'{ctx}: invalid transition')
# event registry
ereg=load('contracts/events/registry.yaml'); event_names={e['name'] for e in ereg['events']}
for area,d in g['domains'].items():
    for c in d['commands']:
        if c['sourceOfTruthWrite'] and c['event'] not in event_names: raise AssertionError(f'missing event registry entry: {c["event"]}')
# persistence registry and Appwrite mapping
preg=load('contracts/compatibility/persistence-registry.yaml'); preg_names=[r['resource'] for r in preg['resources']]
if len(preg_names)!=len(set(preg_names)) or set(preg_names)!={x[0] for x in seen}: raise AssertionError('persistence registry drift')
areg=load('contracts/compatibility/appwrite-resource-registry.yaml'); an=[r['logicalResource'] for r in areg['resources']]
if len(an)!=len(set(an)) or set(an)!=set(preg_names): raise AssertionError('Appwrite registry drift')
# MCP mapping
m=load('contracts/compatibility/mcp-command-map.yaml')
for op in m['operations']:
    target=op['command']
    if target not in commands and target not in queries: raise AssertionError(f'MCP operation unmapped: {op["operation"]} -> {target}')
print(f'cross-domain graph: PASS ({len(actual)} domains, {len(seen)} persistence resources, {len(event_names)} events)')
