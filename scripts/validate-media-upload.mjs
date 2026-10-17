import { execFileSync } from 'node:child_process';
execFileSync('python', ['scripts/validate-media-upload.py'], { stdio: 'inherit' });
