import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldInspectHttpResponse } from '../scripts/detector/node/probe-policy.mjs';
test('only successful HTTP responses are fingerprinted', () => {
  for (const code of [200, 201, 204, 206, 299]) assert.equal(shouldInspectHttpResponse(code), true);
  for (const code of [0, 101, 301, 302, 307, 308, 400, 404, 500, NaN]) assert.equal(shouldInspectHttpResponse(code), false);
});
