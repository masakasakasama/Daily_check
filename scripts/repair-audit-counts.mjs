import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const terminal = new Set(['adopted-important', 'adopted-reference', 'excluded', 'duplicate', 'late-audit-only']);
export function repairDuplicateCounts(original, at = new Date().toISOString()) {
  const fail = message => { throw new Error(`Audit count repair: ${message}`); };
  if (!Array.isArray(original.rawCandidates) || !Array.isArray(original.funnels)
    || original.funnels.length !== 6 || new Set(original.funnels.map(f => f.name)).size !== 6) fail('complete saved candidate/funnel lists required');
  const names = new Set(original.funnels.map(f => f.name));
  const ids = original.rawCandidates.map(c => c.eventKey);
  if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) fail('ambiguous candidate identity');
  if (original.rawCandidates.some(c => !names.has(c.funnel) || !terminal.has(c.decision))) fail('unresolved or unassigned candidate');
  if (original.countCorrections !== undefined && !Array.isArray(original.countCorrections)) fail('invalid prior correction history');
  const audit = structuredClone(original);
  const changes = [];
  for (const funnel of audit.funnels) {
    const saved = audit.rawCandidates.filter(c => c.funnel === funnel.name);
    const counts = {
      candidateCount: saved.length,
      adoptedCount: saved.filter(c => c.decision.startsWith('adopted-')).length,
      excludedCount: saved.filter(c => c.decision === 'excluded').length,
    };
    // Do not repair counters when the saved candidate set is incomplete/ambiguous.
    for (const [key, count] of Object.entries(counts)) if (funnel[key] !== count) fail(`${funnel.name}: ${key} differs from saved evidence`);
    const duplicateCount = saved.filter(c => c.decision === 'duplicate').length;
    if (funnel.duplicateCount !== duplicateCount) {
      changes.push({funnel:funnel.name,field:'duplicateCount',previousFieldPresent:Object.hasOwn(funnel,'duplicateCount'),previousValue:funnel.duplicateCount ?? null,correctedValue:duplicateCount});
      funnel.duplicateCount = duplicateCount;
    }
  }
  if (changes.length) {
    audit.countCorrections = [...(audit.countCorrections || []), {at,scope:'saved rawCandidates only; not collection certification',rawCandidatesSha256:createHash('sha256').update(JSON.stringify(original.rawCandidates)).digest('hex'),changes}];
  }
  return {audit,changes};
}
async function main() {
  const write = process.argv.includes('--write');
  const root = new URL('../data/audits/',import.meta.url);
  const plans = [];
  for (const date of ['2026-09-25','2026-09-26','2026-09-27']) {
    const path = new URL(`${date}-sdv.json`,root);
    const plan = repairDuplicateCounts(JSON.parse(await readFile(path,'utf8')));
    plans.push({path,date,...plan});
  }
  // All evidence is checked before writing any of these explicitly selected audits.
  for (const plan of plans) {
    if (write && plan.changes.length) await writeFile(plan.path,JSON.stringify(plan.audit,null,2)+'\n');
    console.log(`${plan.date}: ${plan.changes.length} saved-candidate counters ${write?'repaired':'planned'}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
