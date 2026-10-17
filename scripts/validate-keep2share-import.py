#!/usr/bin/env python3
from pathlib import Path
import sys, yaml
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def load(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return {}
    return yaml.safe_load(p.read_text()) or {}
reg=load('contracts/agents/registry.yaml')
ids=[a['id'] for a in reg.get('agents',[])]
if 'sg.agent.keep2share-import' not in ids: errors.append('agent not registered')
manifest=load('agents/keep2share-import/manifest.yaml')
if manifest.get('release')!='V1': errors.append('agent must be V1')
required=['contracts/import/keep2share-import.yaml','contracts/import/keep2share/authentication.yaml','contracts/import/source-authorization.yaml','contracts/import/import-result.yaml','contracts/media-metadata/normalization.yaml','contracts/archive/normalization.yaml','contracts/archive/member-manifest.yaml']
for x in required: load(x)
auth=load('contracts/import/keep2share/authentication.yaml')
if set(auth.get('authentication_modes',{})) != {'USER_ACCOUNT','PARTNER_ACCOUNT'}: errors.append('authentication modes must be exactly USER_ACCOUNT and PARTNER_ACCOUNT')
if auth.get('request_rules',{}).get('secrets_never_in_llm_context') is not True: errors.append('secrets must never enter LLM context')
if auth.get('human_interaction',{}).get('captcha_required',{}).get('action') != 'PAUSE_AND_REQUEST_HUMAN': errors.append('CAPTCHA must pause for human')
if auth.get('human_interaction',{}).get('mfa_required',{}).get('action') != 'PAUSE_AND_REQUEST_HUMAN': errors.append('MFA must pause for human')
for forbidden in ['captcha_bypass','mfa_bypass','access_control_bypass','paywall_bypass']:
    if forbidden not in manifest.get('forbidden',[]): errors.append(f'missing forbidden control: {forbidden}')
pipe=load('contracts/import/keep2share-import.yaml').get('pipeline',[])
for step in ['SOURCE_AUTHORIZATION','EXTRACT_KEEP2SHARE_LINKS','DOWNLOAD','HASH_AND_VERIFY','NORMALIZE_METADATA','INSPECT_ARCHIVE_IF_APPLICABLE','NORMALIZE_ARCHIVE_IF_APPLICABLE','SECURITY_SCAN','UPLOAD','VERIFY_STORAGE_OBJECT']:
    if step not in pipe: errors.append(f'pipeline missing {step}')
if load('contracts/archive/normalization.yaml').get('security',{}).get('reject_parent_traversal') is not True: errors.append('archive traversal rejection missing')
if load('contracts/archive/normalization.yaml').get('security',{}).get('reject_symlinks') is not True: errors.append('archive symlink rejection missing')
if load('contracts/media-metadata/normalization.yaml').get('normalization',{}).get('filename',{}).get('unicode')!='NFC': errors.append('filename NFC normalization missing')
if errors:
    print('\n'.join('ERROR: '+e for e in errors)); sys.exit(1)
print('Keep2Share import contract: PASS')
