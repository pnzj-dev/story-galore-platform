import { execFileSync } from 'node:child_process';
execFileSync('python',['scripts/validate-execution-resilience.py'],{stdio:'inherit'});
