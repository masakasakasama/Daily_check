import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCollectionAudit } from './collection-validation.mjs';

const query = (name, family = 'date-specific') => ({ query: name, sourceUrl: 'https://example.com/search', sourceFamily: family, rawHitCount: 0, retrievalStatus: 'complete' });
function fixture(counts = [2, 2, 1, 1, 1, 1]) {
  const rawCandidates = counts.flatMap((n, i) => Array.from({length:n}, (_, j) => ({funnel:`F${i}`,eventKey:`F${i}-${j}`,primaryUrl:'https://example.com/news',decision:'excluded',reason:'Synthetic unrelated topic'})));
  const audit = {date:'2026-10-03',collectionComplete:true,anomaly:false,deepScanPerformed:false,rawCandidates,
    funnels:counts.map((n, i) => ({name:`F${i}`,candidateCount:n,adoptedCount:0,excludedCount:n,duplicateCount:0,pendingCount:0,rawHitCount:n,retrievalStatus:'complete',queries:[query(`Primary F${i}`,'official'),query(`Alternate F${i}`,'technology-specific')]}))};
  return {audit,day:{date:audit.date,alerts:[],references:[]},previousDay:{date:'2026-10-02',alerts:[],references:[{category:'SDV'}]}};
}
const check = f => validateCollectionAudit(f.audit,f.day,f.previousDay);
function addDeep(f) {f.audit.deepScanPerformed=true;f.audit.deepScanQueries=Array.from({length:12},(_,i)=>query(`Extra date/company search ${i}`));return f;}

test('complete collection requires explicit anomaly and reconciled evidence even with pendingCount=0', () => {
  assert.equal(check(fixture()).deepScanRequired,false);
  for (const mutate of [f=>f.audit.collectionComplete=false,f=>f.audit.anomaly=true,f=>delete f.audit.anomaly,f=>delete f.audit.rawCandidates,f=>f.audit.rawCandidates[0].reason='',f=>f.audit.funnels[0].excludedCount=999,f=>f.audit.rawCandidates[0].decision='pending',f=>f.audit.funnels[0].pendingCount=1]) {
    const f=fixture();mutate(f);assert.throws(()=>check(f));
  }
});
test('Deep Scan required at low candidate and zero funnel thresholds, including all six zero', () => {
  for (const counts of [[1,1,1,1,1,1],[4,4,0,0,0,0],[0,0,0,0,0,0]]) {
    const f=fixture(counts);assert.throws(()=>check(f),/Deep Scan required/);assert.equal(check(addDeep(f)).deepScanRequired,true);
  }
});
test('two zero-publication calendar days trigger scan and missing predecessor cannot become clear', () => {
  const f=fixture();f.previousDay.references=[];
  assert.throws(()=>check(f),/two consecutive/);assert.equal(check(addDeep(f)).deepScanRequired,true);
  f.previousDay.date='2026-10-01';assert.throws(()=>check(f),/previous calendar day/);
});
test('performed scans require twelve new distinct observed queries, not strings or copied queries', () => {
  for (const mutate of [f=>delete f.audit.deepScanQueries,f=>f.audit.deepScanQueries.pop(),f=>f.audit.deepScanQueries[1]=f.audit.deepScanQueries[0],f=>f.audit.deepScanQueries[0]=f.audit.funnels[0].queries[0],f=>delete f.audit.deepScanQueries[0].rawHitCount,f=>f.audit.deepScanQueries[0].rawHitCount=-1,f=>f.audit.deepScanQueries[0].retrievalStatus='pending',f=>f.audit.deepScanQueries[0]='only a query string',f=>f.audit.deepScanQueries[0].sourceUrl='file:///tmp/fake']) {
    const f=addDeep(fixture());mutate(f);assert.throws(()=>check(f));
  }
});
test('zero funnels need alternate source families and normal query evidence cannot be omitted', () => {
  const f=addDeep(fixture([4,4,0,0,0,0]));f.audit.funnels[2].queries[1].sourceFamily='official';assert.throws(()=>check(f),/two query families/);
  const g=fixture();delete g.audit.funnels[0].queries[0].rawHitCount;assert.throws(()=>check(g),/query evidence/);
});
test('October 3 persisted late-audit-only candidates are terminal and do not count as publication', () => {
  const load = path => JSON.parse(readFileSync(new URL(`../data/${path}`,import.meta.url),'utf8'));
  const f={audit:load('audits/2026-10-03-sdv.json'),day:load('days/2026-10-03.json'),previousDay:load('days/2026-10-02.json')};
  assert.equal(check(f).deepScanRequired,false);
  const late=f.audit.rawCandidates.find(c=>c.decision==='late-audit-only');late.discoveredLate=false;assert.throws(()=>check(f),/candidate terminal/);
});

test('persisted nested source/body verification is compatible while conflicting evidence is rejected', () => {
  const f=fixture();
  const c=f.audit.rawCandidates[0];
  c.source={family:'official',url:c.primaryUrl};delete c.primaryUrl;
  c.decision='late-audit-only';c.bodyVerified=true;c.discoveredLate=true;
  f.audit.funnels[0].excludedCount--;f.audit.funnels[0].lateAuditOnlyCount=1;
  assert.equal(check(f).deepScanRequired,false);
  c.primaryUrl='https://example.com/other';assert.throws(()=>check(f),/candidate terminal/);
  c.primaryUrl=c.source.url;c.verified=false;assert.throws(()=>check(f),/candidate terminal/);
  delete c.verified;delete c.bodyVerified;assert.throws(()=>check(f),/candidate terminal/);
});
