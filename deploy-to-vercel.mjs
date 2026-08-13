/* eslint-disable no-console */
// One-shot Vercel deploy for Beauty Center — no manual config.
// Reads secrets from backend/.env, deploys the backend (serverless), captures
// its URL, then deploys the frontend wired to that URL, and smoke-tests both.
//
// Prereq (one time, by you): `vercel login`.
// Then just run: node deploy-to-vercel.mjs
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(ROOT, 'backend');
const FRONTEND = join(ROOT, 'frontend');

// ── helpers ───────────────────────────────────────────────
const isWin = process.platform === 'win32';
const VERCEL = isWin ? 'vercel.cmd' : 'vercel';

function run(cmd, args, cwd) {
  console.log(`\n$ ${cmd} ${args.join(' ')}  (in ${cwd})`);
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], shell: isWin });
}

function parseEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function get(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      })
      .on('error', (e) => resolve({ status: 0, body: String(e) }));
  });
}

// ── 0. sanity: logged in? ─────────────────────────────────
try {
  const who = execFileSync(VERCEL, ['whoami'], { encoding: 'utf8', shell: isWin }).trim();
  console.log(`✅ Logged in to Vercel as: ${who}`);
} catch {
  console.error('\n❌ Not logged in. Run `vercel login` first, then re-run this script.');
  process.exit(1);
}

const env = parseEnv(join(BACKEND, '.env'));
const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('db.xxxx')) {
  console.error('❌ No real DATABASE_URL in backend/.env');
  process.exit(1);
}

// Env vars the backend needs at runtime.
const backendEnv = {
  NODE_ENV: 'production',
  DATABASE_URL,
  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_RESET_SECRET: env.JWT_RESET_SECRET,
  COOKIE_SECRET: env.COOKIE_SECRET,
  COOKIE_SECURE: 'true',
  CORS_ORIGINS: '*', // accept the frontend from any Vercel URL — zero wiring
  AUTO_MIGRATE: 'false', // DB already migrated + seeded
  AUTO_SEED: 'false',
};

function envFlags(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== '')
    .flatMap(([k, v]) => ['-e', `${k}=${v}`]);
}
function buildEnvFlags(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== '')
    .flatMap(([k, v]) => ['-b', `${k}=${v}`]);
}

// ── 1. deploy backend ─────────────────────────────────────
console.log('\n════════ Deploying BACKEND (serverless API) ════════');
const beOut = run(
  VERCEL,
  ['deploy', '--prod', '--yes', '--name', 'beauty-center-api', ...envFlags(backendEnv), ...buildEnvFlags({ DATABASE_URL })],
  BACKEND,
);
const beUrl = (beOut.match(/https:\/\/[^\s]+\.vercel\.app/g) || []).pop();
if (!beUrl) {
  console.error('❌ Could not detect backend URL from output.');
  process.exit(1);
}
console.log(`\n✅ Backend deployed: ${beUrl}`);
const apiBase = `${beUrl}/api`;

// ── 2. deploy frontend wired to backend ───────────────────
console.log('\n════════ Deploying FRONTEND ════════');
const feEnv = { NEXT_PUBLIC_API_URL: apiBase };
const feOut = run(
  VERCEL,
  [
    'deploy',
    '--prod',
    '--yes',
    '--name',
    'beauty-center',
    ...envFlags(feEnv),
    ...buildEnvFlags(feEnv),
  ],
  FRONTEND,
);
const feUrl = (feOut.match(/https:\/\/[^\s]+\.vercel\.app/g) || []).pop();
console.log(`\n✅ Frontend deployed: ${feUrl}`);

// Point NEXT_PUBLIC_SITE_URL at itself and set the frontend URL for CORS clarity.
// (CORS is '*' so no backend redeploy is needed.)

// ── 3. smoke test ─────────────────────────────────────────
console.log('\n════════ Smoke test ════════');
const health = await get(`${apiBase}/health`);
console.log(`API /health   → ${health.status}`);
const products = await get(`${apiBase}/products?limit=1`);
let n = 0;
try {
  n = (JSON.parse(products.body).data.items || []).length;
} catch {}
console.log(`API /products → ${products.status} (items: ${n})`);
const home = await get(feUrl);
console.log(`Frontend /    → ${home.status}`);

console.log('\n════════════════════════════════════════');
console.log(`🎉 DONE`);
console.log(`   Store:   ${feUrl}`);
console.log(`   API:     ${apiBase}`);
console.log(`   Admin:   ${feUrl}/admin   (admin@beautycenter.com / Admin@12345)`);
console.log('════════════════════════════════════════');
