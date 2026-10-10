import { validateFunnel } from './audit-validation.mjs';

const complete = new Set(['success', 'alternative-success', 'complete']);
const terminal = new Set(['adopted-important', 'adopted-reference', 'excluded', 'duplicate', 'late-audit-only']);
const fail = message => { throw new Error(`SDV collection: ${message}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const count = value => Number.isInteger(value) && value >= 0;
const normalized = value => value.trim().replace(/\s+/g, ' ').toLowerCase();
const url = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
function validateQuery(query) {
  if (!query || !text(query.query) || !url(query.sourceUrl) || !text(query.sourceFamily)
    || !count(query.rawHitCount) || !complete.has(query.retrievalStatus)) {
    fail('query evidence requires concrete query/source URL/family, observed rawHitCount and successful retrieval');
  }
}
function publicationCount(day) {
  if (!day || !Array.isArray(day.alerts) || !Array.isArray(day.references)) fail('daily publication evidence missing');
  return [...day.alerts, ...day.references].filter(item => item.category === 'SDV').length;
}

// This checks persisted evidence, not the truth of the original web retrieval.
export function validateCollectionAudit(audit, day, previousDay) {
  if (!audit || audit.date !== day?.date) fail('audit and publication dates differ');
  if (audit.collectionComplete !== true) fail('collectionComplete is not true');
  if (audit.anomaly !== false) fail('anomaly must be explicitly false for a complete collection');
  if (typeof audit.deepScanPerformed !== 'boolean') fail('Deep Scan status is unknown');
  const yesterday = new Date(`${day.date}T00:00:00Z`);
  if (Number.isNaN(yesterday.valueOf())) fail('invalid collection date');
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (previousDay?.date !== yesterday.toISOString().slice(0, 10)) fail('previous calendar day publication evidence missing');
  const todayCount = publicationCount(day);
  const previousCount = publicationCount(previousDay);
  if (!Array.isArray(audit.rawCandidates)) fail('raw candidate evidence missing');
  if (!Array.isArray(audit.funnels) || audit.funnels.length !== 6
    || new Set(audit.funnels.map(f => f.name)).size !== 6) fail('six distinct funnels required');
  const names = new Set(audit.funnels.map(f => f.name));
  if (audit.rawCandidates.some(c => !names.has(c.funnel) || !terminal.has(c.decision)
    || !text(c.eventKey) || !url(c.primaryUrl ?? c.source?.url) || !text(c.reason)
    || (c.primaryUrl !== undefined && c.source?.url !== undefined && c.primaryUrl !== c.source.url)
    || (c.verified !== undefined && c.bodyVerified !== undefined && c.verified !== c.bodyVerified)
    || (c.decision === 'duplicate' && !text(c.duplicateOf))
    || (c.decision === 'late-audit-only' && (c.discoveredLate !== true || (c.verified ?? c.bodyVerified) !== true)))) {
    fail('candidate terminal decision/reason/source/identity evidence incomplete');
  }
  const normalQueries = [];
  let zeroFunnels = 0;
  for (const funnel of audit.funnels) {
    if (!text(funnel.name) || !complete.has(funnel.retrievalStatus)) fail('funnel retrieval incomplete');
    // Explicit pendingCount=0 must not bypass evidence reconciliation.
    validateFunnel({ ...funnel, pendingCount: undefined }, audit.rawCandidates);
    if (funnel.pendingCount !== undefined && funnel.pendingCount !== 0) fail('pending candidates');
    if (!Array.isArray(funnel.queries) || funnel.queries.length === 0 || !count(funnel.rawHitCount)) fail('funnel query/hit evidence missing');
    for (const query of funnel.queries) validateQuery(query);
    normalQueries.push(...funnel.queries.map(q => normalized(q.query)));
    if (funnel.candidateCount === 0) {
      zeroFunnels++;
      if (new Set(funnel.queries.map(q => normalized(q.sourceFamily))).size < 2) fail('zero funnel requires at least two query families');
    }
  }
  const reasons = [];
  if (audit.rawCandidates.length < 8) reasons.push('raw candidates < 8');
  if (zeroFunnels >= 4) reasons.push('at least four zero funnels');
  if (todayCount === 0 && previousCount === 0) reasons.push('two consecutive zero-publication days');
  if (reasons.length && !audit.deepScanPerformed) fail(`Deep Scan required: ${reasons.join(', ')}`);
  if (audit.deepScanPerformed) {
    // Collectors persist either the original flat field or deepScan.queries.
    // Accept saved observations in either schema; never synthesize missing hits.
    const flat = audit.deepScanQueries;
    const nested = audit.deepScan?.queries;
    if ((flat !== undefined && !Array.isArray(flat))
      || (nested !== undefined && !Array.isArray(nested))) fail('Deep Scan query evidence invalid');
    if (flat !== undefined && nested !== undefined
      && JSON.stringify(flat) !== JSON.stringify(nested)) fail('conflicting Deep Scan query evidence');
    const queries = flat ?? nested;
    if (!Array.isArray(queries)) fail('Deep Scan query evidence missing');
    const extra = new Set();
    for (const query of queries) {
      validateQuery(query);
      const identity = normalized(query.query);
      if (normalQueries.includes(identity)) fail('Deep Scan query repeats the first pass');
      if (extra.has(identity)) fail('Deep Scan query duplicated');
      extra.add(identity);
    }
    if (extra.size < 12) fail('Deep Scan requires at least 12 additional distinct queries');
  }
  return { deepScanRequired: reasons.length > 0, reasons, zeroFunnels };
}
