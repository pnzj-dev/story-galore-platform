import { execFileSync } from 'node:child_process';
execFileSync('python',['scripts/validate-cross-domain.py'],{stdio:'inherit'});
