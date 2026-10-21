import { execFileSync } from 'node:child_process';
execFileSync('python3', ['scripts/validate-media-upload.py'], { stdio: 'inherit' });
