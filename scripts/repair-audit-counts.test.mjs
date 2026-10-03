import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairDuplicateCounts} from './repair-audit-counts.mjs';
const load = date => JSON.parse(readFileSync(new URL(`../data/audits/${date}-sdv.json`,import.meta.url),'utf8'));

test('repairs only proven duplicate counters and keeps original evidence, completeness and idempotency',()=>{
  for (const date of ['2026-09-25','2026-09-26','2026-09-27']) {
    const original=load(date);
    // Exercise the original omitted fields even after persisted repair.
    delete original.countCorrections;for(const f of original.funnels)delete f.duplicateCount;
    const before=structuredClone(original);const {audit,changes}=repairDuplicateCounts(original,'2026-10-03T00:00:00Z');
    assert.equal(changes.length,6);assert.deepEqual(original,before);
    assert.deepEqual(audit.rawCandidates,original.rawCandidates);assert.equal(audit.collectionComplete,original.collectionComplete);assert.equal(audit.anomaly,original.anomaly);
    assert.equal(audit.completedAt,original.completedAt);assert.equal(audit.deepScanPerformed,original.deepScanPerformed);
    const stripped=structuredClone(audit);delete stripped.countCorrections;for(const f of stripped.funnels)delete f.duplicateCount;assert.deepEqual(stripped,original);
    assert.ok(audit.countCorrections[0].changes.every(c=>c.previousFieldPresent===false&&c.correctedValue===0));
    assert.deepEqual(repairDuplicateCounts(audit).audit,audit);assert.equal(repairDuplicateCounts(audit).changes.length,0);
  }
});
test('ambiguous or incomplete raw evidence refuses counter repair',()=>{
 for(const mutate of [a=>a.rawCandidates[0].decision='pending',a=>a.rawCandidates[0].funnel='unknown',a=>a.rawCandidates.push(a.rawCandidates[0]),a=>a.funnels[0].candidateCount++,a=>a.funnels[0].adoptedCount++,a=>a.countCorrections={}]) {
  const audit=load('2026-09-25');mutate(audit);assert.throws(()=>repairDuplicateCounts(audit));
 }
});
