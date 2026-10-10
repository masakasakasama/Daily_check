import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/    async function fetchSplit\(signal\)\{[\s\S]*?\n    \}/)?.[0];
test('UI reads manifest, days and weeks from one immutable GitHub revision', async()=>{
  assert.ok(source);
  const sha='a'.repeat(40),urls=[];
  const context={Date,Error,fetch:async(url)=>{
    urls.push(url);
    const value=url.includes('/commits/main')?{sha}:url.endsWith('data/index.json')?{schema:'split-daily-v1',currentDate:'2026-10-10',days:['2026-10-10'],weeks:[{end:'2026-10-10',path:'data/weeks/2026-10-10.json'}]}:{date:'2026-10-10'};
    return {ok:true,json:async()=>value};
  }};
  vm.createContext(context);vm.runInContext(source+';globalThis.run=fetchSplit',context);
  const result=await context.run(undefined);
  assert.equal(result.days.length,1);assert.equal(result.weeks.length,1);
  assert.equal(urls.length,4);
  assert.ok(urls.slice(1).every(url=>url.includes('/'+sha+'/')));
  context.fetch=async()=>({ok:true,json:async()=>({sha:'main'})});
  await assert.rejects(context.run(undefined),/revision形式/);
});
