import { readFile } from "node:fs/promises";

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

assert(manifest.currentDate === expectedDate, `manifest currentDate is ${manifest.currentDate}; expected ${expectedDate}`);
assert(manifest.days?.[0] === expectedDate, `manifest does not list ${expectedDate} first`);
assert(day.date === expectedDate, `day file contains ${day.date}; expected ${expectedDate}`);
assert(Array.isArray(day.alerts) && Array.isArray(day.references) && Array.isArray(day.checks), "day file is incomplete");

const articles = [...day.alerts, ...day.references];
const ids = articles.map((article) => article.id);
const urls = articles.map((article) => article.source?.url).filter(Boolean);
assert(new Set(ids).size === ids.length, "duplicate article id in day file");
assert(new Set(urls).size === urls.length, "duplicate source URL in day file");

for (const checkId of ["ai", "sdv-nissan"]) {
  const check = day.checks.find((item) => item.id === checkId);
  assert(check, `missing required check: ${checkId}`);
  assert(!["error", "pending"].includes(check.status), `${checkId} is ${check.status}`);
}

assert(audit.date === expectedDate, `audit contains ${audit.date}; expected ${expectedDate}`);
assert(audit.collectionComplete === true, "SDV collection is not complete");
assert(Array.isArray(audit.funnels) && audit.funnels.length === 6, `SDV audit has ${audit.funnels?.length ?? 0}/6 funnels`);
for (const funnel of audit.funnels) {
  assert(["success", "alternative-success", "complete"].includes(funnel.retrievalStatus), `${funnel.name} retrieval is ${funnel.retrievalStatus}`);
  assert(funnel.pendingCount === 0, `${funnel.name} has pending candidates`);
}

assert(week.end === expectedDate, `week file ends at ${week.end}; expected ${expectedDate}`);
assert(state.pendingBatch === null, "pendingBatch is not clear");
assert(String(state.lastSuccessfulAt || "").startsWith(expectedDate), `lastSuccessfulAt is ${state.lastSuccessfulAt}`);

console.log(`Daily Check ${expectedDate}: OK (${day.alerts.length} important, ${day.references.length} reference, 6/6 SDV funnels)`);
