import { execFileSync } from 'node:child_process';
execFileSync('python3',['scripts/validate-execution-resilience.py'],{stdio:'inherit'});
