import {readFile, readdir} from 'node:fs/promises';
import {validateWeeklyUnion} from './publication-validation.mjs';
const root = new URL('../data/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path,root),'utf8'));
const days = await Promise.all((await readdir(new URL('days/',root))).filter(n=>/^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map(n=>read('days/'+n)));
let checked=0, failures=0, partial=0;
for (const name of (await readdir(new URL('weeks/',root))).filter(n=>/^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort()) {
  const week=await read('weeks/'+name);
  // Earliest archived windows predate the retained daily history.
  // They cannot be certified or filled with invented daily records.
  if(days.filter(d=>week.start<=d.date&&d.date<=week.end).length<7){partial++;continue;}
  checked++;
  try {validateWeeklyUnion(week,days);} catch(error){failures++;console.error(`${name}: ${error.message}`);}
}
console.log(`Weekly history: ${checked} full windows checked, ${failures} failures; ${partial} earliest partial windows not certified`);
process.exitCode=failures?1:0;
