import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';

const html = fs.readFileSync('dist/index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.scope, '/FitByM/');
assert.equal(manifest.start_url, '/FitByM/');
assert.equal(manifest.display, 'standalone');
assert.match(html, /viewport-fit=cover/);
assert.match(html, /apple-touch-icon/);
const assets = [...html.matchAll(/(?:src|href)="(\/FitByM\/[^"#]+)"/g)].map((m) => m[1]);
assert(assets.length >= 4);
for (const asset of assets) assert(fs.existsSync(`dist/${asset.slice('/FitByM/'.length)}`), asset);
for (const icon of [...manifest.icons, { src: 'icons/apple-touch-icon.png', sizes: '180x180' }]) {
  const png = fs.readFileSync(`dist/${icon.src}`);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
}
const sw = fs.readFileSync('dist/sw.js', 'utf8');
assert.match(sw, /index\.html/);
assert.match(sw, /SKIP_WAITING/);
assert.match(sw, /\.clientsClaim\(\)/);
assert(!sw.includes('synthetic update QA'), 'Temporary update-test marker must be restored');
const entries = [...sw.matchAll(/url:\s*["']([^"']+)["']/g)].map((m) => m[1]);
assert(entries.some((p) => p.startsWith('assets/')));
for (const entry of entries) {
  assert(!entry.startsWith('/') && !entry.includes('..'), entry);
  assert(fs.existsSync(`dist/${entry}`), entry);
}
const workflow = parse(fs.readFileSync('.github/workflows/deploy.yml', 'utf8'));
assert(workflow.on.push.branches.includes('main'));
assert('workflow_dispatch' in workflow.on);
assert.deepEqual(workflow.permissions, { contents: 'read' });
assert.equal(workflow.jobs.deploy.permissions.pages, 'write');
assert.equal(workflow.jobs.deploy.permissions['id-token'], 'write');
assert.equal(workflow.jobs.deploy.needs, 'build');
const steps = workflow.jobs.build.steps;
for (const command of [
  'npm ci',
  'npm run typecheck',
  'npm run lint',
  'npm test',
  'npm run build',
  'npm run verify:production',
  'npm run test:e2e',
])
  assert(
    steps.some((s) => s.run === command),
    command,
  );
assert(
  steps.some((s) => s.uses?.startsWith('actions/upload-pages-artifact@') && s.with.path === 'dist'),
);
globalThis.console.log(
  `Production assets, PNG dimensions, PWA paths (${entries.length} cache entries), workflow YAML/contracts: OK`,
);
