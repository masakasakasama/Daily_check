import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../data/',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const manifest=await read('index.json');
const value={version:5,currentDate:manifest.currentDate,updatedAt:manifest.updatedAt,
  // This is a last-resort browser fallback, not the canonical history store.
  // Keep only the current seven-day window so it remains small enough to load
  // when GitHub's unauthenticated API or large-response proxies are constrained.
  days:await Promise.all(manifest.days.slice(0,7).map(date=>read('days/'+date+'.json'))),
  weeks:await Promise.all((manifest.weeks||[]).slice(0,1).map(week=>read(week.path.replace(/^data\//,''))))};
if(process.argv.includes('--check')){
  assert.deepEqual(await read('daily-checks.json'),value,'Fallback data differs from canonical split data; run node scripts/sync-fallback-data.mjs');
  console.log('Fallback data matches canonical daily and weekly records');
}else{
  await writeFile(new URL('daily-checks.json',root),JSON.stringify(value,null,2)+'\n');
  console.log('Fallback data synchronized from canonical split records');
}
