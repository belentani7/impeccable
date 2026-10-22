import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { walkDir, isPortListening } from '../scripts/detector/node/file-system.mjs';

test('local scanner does not include symlinks to files outside requested target', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-safe-walk-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const target = path.join(root, 'target');
  const external = path.join(root, 'outside.tsx');
  fs.mkdirSync(target);
  fs.writeFileSync(external, 'const privateValue = "not part of the target";');
  fs.writeFileSync(path.join(target, 'index.tsx'), 'export const valid = true');
  fs.symlinkSync(external, path.join(target, 'linked.tsx'), 'file');
  const scanned = walkDir(target);
  assert.deepEqual(scanned, [path.join(target, 'index.tsx')]);
});

test('framework probe does not follow HTTP redirects out of the requested entrypoint', async () => {
  let redirectedRequests = 0;
  const server = createServer((req, res) => {
    if (req.url === '/hidden') {
      redirectedRequests++;
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('expected framework marker');
      return;
    }
    res.writeHead(302, { location: '/hidden' });
    res.end();
  });
  await new Promise(resolve => server.listen(0, resolve));
  try {
    const port = server.address().port;
    const status = await isPortListening(port, { body: /expected framework marker/ });
    assert.equal(status.listening, true);
    assert.equal(status.matched, false);
    assert.equal(redirectedRequests, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
