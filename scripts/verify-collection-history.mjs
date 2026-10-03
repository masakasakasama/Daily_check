import { readFile, readdir } from 'node:fs/promises';
import { validateCollectionAudit } from './collection-validation.mjs';
const root = new URL('../data/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
let checked = 0;
let failures = 0;
for (const name of (await readdir(new URL('audits/', root))).filter(name => /^\d{4}-\d{2}-\d{2}-sdv\.json$/.test(name)).sort()) {
  const audit = await read(`audits/${name}`);
  // Legacy summaries did not persist the modern candidate/query evidence contract.
  if (!Object.hasOwn(audit, 'deepScanPerformed')) continue;
  checked++;
  try {
    const previousDate = new Date(new Date(`${audit.date}T00:00:00Z`).valueOf() - 86400000).toISOString().slice(0, 10);
    validateCollectionAudit(audit, await read(`days/${audit.date}.json`), await read(`days/${previousDate}.json`));
  } catch (error) {
    failures++;
    console.error(`${audit.date}: ${error.message}`);
  }
}
console.log(`Collection history: ${checked} modern audits checked, ${failures} evidence failures; legacy summaries skipped, not certified`);
process.exitCode = failures ? 1 : 0;
