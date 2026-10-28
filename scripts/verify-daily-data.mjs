import { validateCollectionAudit } from "./collection-validation.mjs";
import { validateFunnel } from "./audit-validation.mjs";
import { validateDailyPublication, validateWeeklyUnion } from "./publication-validation.mjs";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const expectedDate = process.env.DAILY_CHECK_DATE || new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const manifest = await readJson("data/index.json");
const day = await readJson(`data/days/${expectedDate}.json`);
const audit = await readJson(`data/audits/${expectedDate}-sdv.json`);
const week = await readJson(`data/weeks/${expectedDate}.json`);
const state = await readJson("data/sdv-collection-state.json");
const persistedDays = await Promise.all((await readdir(new URL("data/days/", root))).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(name => readJson(`data/days/${name}`)));
const previousDate = new Date(new Date(`${expectedDate}T00:00:00Z`).valueOf() - 86400000).toISOString().slice(0, 10);
validateCollectionAudit(audit, day, persistedDays.find(item => item.date === previousDate));
validateDailyPublication(day, persistedDays);
validateWeeklyUnion(week, persistedDays);

assert(manifest.currentDate === expectedDate, `manifest currentDate is ${manifest.currentDate}; expected ${expectedDate}`);
assert(manifest.days?.[0] === expectedDate, `manifest does not list ${expectedDate} first`);
assert(day.date === expectedDate, `day file contains ${day.date}; expected ${expectedDate}`);
assert(Array.isArray(day.alerts) && Array.isArray(day.references) && Array.isArray(day.checks), "day file is incomplete");

const articles = [...day.alerts, ...day.references];
const ids = articles.map((article) => article.id);
const urls = articles.map((article) => article.source?.url).filter(Boolean);
assert(new Set(ids).size === ids.length, "duplicate article id in day file");
assert(new Set(urls).size === urls.length, "duplicate source URL in day file");

for (const aliases of [["ai"], ["codex", "codex-reset"], ["sdv-nissan"], ["residency", "permanent-residency"]]) {
  const check = day.checks.find((item) => aliases.includes(item.id));
  assert(check, `missing required check: ${aliases.join("/")}`);
  assert(["clear", "update"].includes(check.status), `${check.id} is ${check.status}`);
  assert(Number.isFinite(Date.parse(check.checkedAt)), `${check.id} checkedAt is missing/invalid`);
}

// Nissan is an independent monitor beginning with the day it was requested.
if (expectedDate >= '2026-10-29') {
  const check = day.checks.find(item => item.id === 'nissan');
  assert(check && ['clear', 'update'].includes(check.status), 'Nissan monitor missing or incomplete');
  assert(Number.isFinite(Date.parse(check.checkedAt)), 'Nissan checkedAt is missing/invalid');
  const nissanAudit = await readJson(`data/audits/${expectedDate}-nissan.json`);
  assert(nissanAudit.date === expectedDate && nissanAudit.collectionComplete === true, 'Nissan collection is not complete');
  assert(Array.isArray(nissanAudit.sourcesChecked) && nissanAudit.sourcesChecked.length > 0, 'Nissan sources evidence missing');
  assert(Array.isArray(nissanAudit.searches) && nissanAudit.searches.length > 0, 'Nissan search evidence missing');
  assert(check.alertCount === day.alerts.filter(item => item.category === 'Nissan').length, 'Nissan important count mismatch');
  assert(check.referenceCount === day.references.filter(item => item.category === 'Nissan').length, 'Nissan reference count mismatch');
}

const timestamps = [manifest.updatedAt, audit.completedAt, ...day.checks.map(c => c.checkedAt), ...articles.flatMap(a => [a.firstSeenAt, a.verifiedAt])].filter(Boolean);
assert(timestamps.every(value => Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now() + 60_000), 'publication contains an invalid or future observation time');

assert(audit.date === expectedDate, `audit contains ${audit.date}; expected ${expectedDate}`);
assert(audit.collectionComplete === true, "SDV collection is not complete");
assert(Array.isArray(audit.funnels) && audit.funnels.length === 6, `SDV audit has ${audit.funnels?.length ?? 0}/6 funnels`);
assert(new Set(audit.funnels.map(funnel => funnel.name)).size === 6, "SDV funnel names are duplicated");
for (const funnel of audit.funnels) {
  assert(["success", "alternative-success", "complete"].includes(funnel.retrievalStatus), `${funnel.name} retrieval is ${funnel.retrievalStatus}`);
  validateFunnel(funnel, audit.rawCandidates);
}

assert(week.end === expectedDate, `week file ends at ${week.end}; expected ${expectedDate}`);
assert(state.pendingBatch === null, "pendingBatch is not clear");
assert(String(state.lastSuccessfulAt || "").startsWith(expectedDate), `lastSuccessfulAt is ${state.lastSuccessfulAt}`);

const uncertain = day.checks.filter(check => check.timestampUnverified);
console.log(`Daily Check ${expectedDate}: structure OK (${day.alerts.length} important, ${day.references.length} reference, 6/6 SDV funnels)`);
if (uncertain.length) {
  console.error(`Incomplete: ${uncertain.length} monitor timestamp(s) are unverified; structure validation cannot certify their collection`);
  process.exitCode = 1;
}
