import {readFile, readdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateDailyPublication, validateWeeklyUnion} from './publication-validation.mjs';
export function repairDay(day, audit, correctedAt) {
  const removed=[...day.alerts,...day.references].filter(article=>article.discoveredLate===true);
  if(!removed.length)return {day,audit,removed};
  for(const article of removed){
    const evidence=audit.rawCandidates?.filter(candidate=>candidate.eventKey===article.eventKey);
    if(evidence?.length!==1||!evidence[0].discoveredLate||evidence[0].verified!==true||!evidence[0].decision?.startsWith('adopted-'))throw new Error(`${day.date}: missing unambiguous late evidence for ${article.eventKey}`);
  }
  const next={...day,alerts:day.alerts.filter(a=>!a.discoveredLate),references:day.references.filter(a=>!a.discoveredLate)};
  next.checks=day.checks.map(check=>check.id!=='sdv-nissan'?check:{...check,status: [...next.alerts,...next.references].some(a=>a.category==='SDV') ? 'update' : 'clear',alertCount:next.alerts.filter(a=>a.category==='SDV').length,referenceCount:next.references.filter(a=>a.category==='SDV').length,summary:`遅延発見${removed.length}件を掲載対象から除外。元の収集・採用証跡は当日auditのpublicationCorrectionsに保持。`});
  // Original collection decisions/counts are historical evidence, not rerun
  // results. Preserve them and record the publication correction separately.
  const nextAudit={...audit,publicationCorrections:[...(audit.publicationCorrections||[]),{correctedAt,reason:'discoveredLate is audit-only under the saved publication policy',originalChecks:day.checks,removedArticles:removed}]};
  return {day:next,audit:nextAudit,removed};
}
async function main(){
 const root=new URL('../data/',import.meta.url);const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));const changes=new Map();
 const days=await Promise.all((await readdir(new URL('days/',root))).filter(n=>/^\d{4}-\d{2}-\d{2}\.json$/.test(n)).map(n=>read(`days/${n}`)));
 const repaired=[];const changedDates=new Set();const stamp=new Date().toISOString();let removed=0;
 for(const day of days){
  if(![...day.alerts,...day.references].some(a=>a.discoveredLate)){repaired.push(day);continue}
  const result=repairDay(day,await read(`audits/${day.date}-sdv.json`),stamp);repaired.push(result.day);removed+=result.removed.length;changedDates.add(day.date);changes.set(`days/${day.date}.json`,result.day);changes.set(`audits/${day.date}-sdv.json`,result.audit);
 }
 for(const day of repaired)validateDailyPublication(day,repaired);
 for(const name of (await readdir(new URL('weeks/',root))).filter(n=>/^\d{4}-\d{2}-\d{2}\.json$/.test(n))){
  const week=await read(`weeks/${name}`);if(![...changedDates].some(d=>week.start<=d&&d<=week.end))continue;
  const window=repaired.filter(d=>week.start<=d.date&&d.date<=week.end).sort((a,b)=>a.date.localeCompare(b.date));
  const unique=field=>[...new Map(window.flatMap(d=>d[field]).map(a=>[a.eventKey||a.id,a])).values()];const highlights=unique('alerts'),references=unique('references');
  const categories=[...new Set([...highlights,...references].map(a=>a.category))].sort().map(name=>({name,summary:`重要${highlights.filter(a=>a.category===name).length}件・参考${references.filter(a=>a.category===name).length}件`}));
  const next={...week,generatedAt:stamp,counts:{important:highlights.length,reference:references.length},categories,highlights,references};validateWeeklyUnion(next,repaired);changes.set(`weeks/${name}`,next);
 }
 console.log(`Validated ${removed} late articles across ${changedDates.size} days; ${changes.size} files. Original raw evidence preserved.`);
 if(process.argv.includes('--write'))for(const [path,value] of changes)await writeFile(new URL(path,root),JSON.stringify(value,null,2)+'\n');
 else console.log('Dry run; pass --write to save validated corrections.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
