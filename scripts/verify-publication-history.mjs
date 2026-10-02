import { readFile, readdir } from 'node:fs/promises';
import { validateDailyPublication } from './publication-validation.mjs';
const root = new URL('../data/days/', import.meta.url);
const days = await Promise.all((await readdir(root)).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(async name => JSON.parse(await readFile(new URL(name, root), 'utf8'))));
let failures = 0;
for (const day of days.sort((a,b) => a.date.localeCompare(b.date))) {
  try { validateDailyPublication(day, days); }
  catch (error) { failures++; console.error(error.message); }
}
console.log(`Publication history: ${days.length} saved days, ${failures} days requiring evidence review`);
if (failures) process.exitCode = 1;
