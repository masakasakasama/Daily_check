import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDailyPublication, validateWeeklyUnion } from './publication-validation.mjs';
const article = (id, extra={}) => ({id, eventKey:id, ...extra});
const day = (date, alerts=[], references=[]) => ({date,alerts,references});
const days = Array.from({length:7},(_,i)=>day(`2026-10-0${i+1}`,i===0?[article('first')]:[],i===6?[article('last')]:[]));
const week = {start:'2026-10-01',end:'2026-10-07',highlights:[article('first')],references:[article('last')],counts:{important:1,reference:1}};
test('daily feed excludes late discoveries and earlier eventKeys even when IDs differ',()=>{
  assert.doesNotThrow(()=>validateDailyPublication(days[6],days.slice(0,6)));
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[article('late',{discoveredLate:true})])),/discoveredLate/);
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[article('new-id',{eventKey:'first'})]),days),/previously published/);
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[article('a'),article('b',{eventKey:'a'})])),/duplicate eventKey/);
});
test('weekly data must equal both daily buckets and their unique counts',()=>{
  assert.doesNotThrow(()=>validateWeeklyUnion(week,days));
  assert.throws(()=>validateWeeklyUnion({...week,highlights:[]},days),/differs/);
  assert.throws(()=>validateWeeklyUnion({...week,references:[article('last'),article('extra')]},days),/differs/);
  assert.throws(()=>validateWeeklyUnion({...week,references:[article('last'),article('last')]},days),/duplicate/);
  assert.throws(()=>validateWeeklyUnion({...week,counts:{important:2,reference:1}},days),/count differs/);
  assert.throws(()=>validateWeeklyUnion(week,days.slice(1)),/exactly one day/);
  assert.throws(()=>validateWeeklyUnion({...week,start:'2026-09-30'},days),/D-6/);
});
test('article sources prevent recycled reports even when IDs, slugs and tracking parameters differ',()=>{
  const source=url=>({url});
  const old=article('old',{source:source('https://help.openai.com/en/articles/20001507-original-title')});
  const repeated=article('different-key',{source:source('https://help.openai.com/en/articles/20001507-new-title?utm_source=feed')});
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[repeated]),[day('2026-10-01',[old])]),/previously published article source/);
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[old,repeated])),/duplicate article source/);
  const changed={...repeated,sourceUpdate:{previousEventKey:'old',changeSummary:'利用可能な対象プランの範囲について具体的な新変更を確認した',evidenceUrl:'https://example.com/evidence',verifiedAt:'2026-10-07T00:00:00Z'}};
  assert.doesNotThrow(()=>validateDailyPublication(day('2026-10-07',[changed]),[day('2026-10-01',[old])]));
  assert.throws(()=>validateDailyPublication(day('2026-10-07',[{...changed,sourceUpdate:{...changed.sourceUpdate,changeSummary:'更新'}}]),[day('2026-10-01',[old])]),/previously published article source/);
  const changelog=article('release-1',{source:source('https://code.claude.com/docs/en/changelog')});
  const next=article('release-2',{source:source('https://code.claude.com/docs/en/changelog')});
  assert.doesNotThrow(()=>validateDailyPublication(day('2026-10-07',[next]),[day('2026-10-01',[changelog])]));
});
