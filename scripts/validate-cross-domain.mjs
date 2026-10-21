import { execFileSync } from 'node:child_process';
execFileSync('python3',['scripts/validate-cross-domain.py'],{stdio:'inherit'});
