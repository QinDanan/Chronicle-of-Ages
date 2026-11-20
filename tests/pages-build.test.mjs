import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Pages release versions every local module and stylesheet without changing source behavior', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chronicle-pages-'));
  const version = 'abcdef0123456789abcdef0123456789abcdef01';
  try {
    const build = spawnSync(process.execPath, ['scripts/prepare-pages.mjs', dir, version], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr);
    assert.deepEqual((await readdir(dir)).sort(), ['.nojekyll', 'assets', 'index.html', 'src', 'studio']);
    const html = await readFile(join(dir, 'index.html'), 'utf8');
    assert.ok(html.includes(`src="./studio/app.js?v=${version}"`));
    assert.ok(html.includes(`href="./studio/studio.css?v=${version}"`));
    for (const folder of ['src', 'studio']) {
      for (const name of await readdir(folder)) {
        if (!/\.m?js$/.test(name)) continue;
        const original = await readFile(join(folder, name), 'utf8');
        const built = await readFile(join(dir, folder, name), 'utf8');
        const refs = [...built.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)(['"])(\.\.?\/[^'"\n]+?\.m?js)(?:\?([^'"\n]*))?\1/g)];
        for (const [, , path, query] of refs) assert.equal(query, `v=${version}`, `${name}: ${path}`);
        const unversion = text => text.replace(/(\b(?:from\s*|import\s*(?:\(\s*)?))(['"])(\.\.?\/[^'"\n]+?\.m?js)(?:\?[^'"\n]*)?\2/g, '$1$2$3$2');
        assert.equal(unversion(built), unversion(original), `${name} changed beyond import versions`);
      }
    }
    assert.deepEqual(await readFile(join(dir, 'studio/studio.css')), await readFile('studio/studio.css'));
    assert.deepEqual(await readFile(join(dir, '.nojekyll')), await readFile('.nojekyll'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Pages build rejects an invalid version and a nonempty destination', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chronicle-pages-'));
  try {
    const invalid = spawnSync(process.execPath, ['scripts/prepare-pages.mjs', dir, 'latest'], { encoding: 'utf8' });
    assert.notEqual(invalid.status, 0);
    const version = 'abcdef0123456789abcdef0123456789abcdef01';
    assert.equal(spawnSync(process.execPath, ['scripts/prepare-pages.mjs', dir, version]).status, 0);
    assert.notEqual(spawnSync(process.execPath, ['scripts/prepare-pages.mjs', dir, version]).status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
