// LOCAL TESTING ONLY: serves the build with Wrangler while allowing the Worker to
// reach a local Supabase stack on 127.0.0.1. It copies the adapter-generated
// dist/server/wrangler.json without "global_fetch_strictly_public" (kept in production).
// Usage: npm run build && node scripts/preview-local.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const src = 'dist/server/wrangler.json';
const dest = 'dist/server/wrangler.local.json';
const cfg = JSON.parse(readFileSync(src, 'utf8'));
cfg.compatibility_flags = (cfg.compatibility_flags ?? []).filter((f) => f !== 'global_fetch_strictly_public');
cfg.name = `${cfg.name}-local`;
writeFileSync(dest, JSON.stringify(cfg, null, 2));
const p = spawn('npx', ['wrangler', 'dev', '-c', dest, '--port', '8787', '--ip', '127.0.0.1'], { stdio: 'inherit', shell: true });
p.on('exit', (code) => process.exit(code ?? 0));
