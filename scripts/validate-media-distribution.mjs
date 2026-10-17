import { execFileSync } from 'node:child_process';
execFileSync('python',['scripts/validate-media-distribution.py'],{stdio:'inherit'});
