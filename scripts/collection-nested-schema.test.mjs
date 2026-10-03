import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCollectionAudit } from './collection-validation.mjs';

const load = path => JSON.parse(readFileSync(new URL(`../data/${path}`, import.meta.url), 'utf8'));
const day = load('days/2026-10-04.json');
const previous = load('days/2026-10-03.json');
const audit = () => load('audits/2026-10-04-sdv.json');

test('saved nested Deep Scan observations pass the same strict validation as flat schema', () => {
  const nested = audit();
  assert.ok(nested.deepScan.queries.length >= 12);
  const before = structuredClone(nested);
  const result = validateCollectionAudit(nested, day, previous);
  assert.deepEqual(nested, before);
  const flat = structuredClone(nested);
  flat.deepScanQueries = flat.deepScan.queries;
  delete flat.deepScan;
  assert.deepEqual(validateCollectionAudit(flat, day, previous), result);
});

test('nested schema cannot bypass missing hits, failed retrieval, duplicate queries or conflicting schemas', () => {
  for (const mutate of [
    a => delete a.deepScan.queries[0].rawHitCount,
    a => a.deepScan.queries[0].retrievalStatus = 'unknown',
    a => a.deepScan.queries[1] = structuredClone(a.deepScan.queries[0]),
    a => a.deepScan.queries.splice(0, a.deepScan.queries.length - 11),
    a => a.deepScanQueries = [],
    a => a.deepScanQueries = 'invalid',
  ]) {
    const a = audit();
    mutate(a);
    assert.throws(() => validateCollectionAudit(a, day, previous));
  }
});
