import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDailyPublication} from './publication-validation.mjs';
test('recovered history requires date/source evidence and preserves discovery time', () => {
  const article = {id:'event',eventKey:'event',publishedAt:'2026/10/08',firstSeenAt:'2026-10-10T03:00:00Z',discoveredLate:true,source:{url:'https://example.org/announcement'}};
  const day = {date:'2026-10-08',alerts:[article],references:[],recovery:{mode:'verified-historical-recovery',completed:true,completedAt:'2026-10-10T04:00:00Z',articles:[{eventKey:'event',verified:true,sourceUrl:article.source.url}]}};
  assert.doesNotThrow(() => validateDailyPublication(day));
  for (const bad of [
    {...day,recovery:undefined},
    {...day,date:'2026-10-10'},
    {...day,recovery:{...day.recovery,completed:false}},
    {...day,recovery:{...day.recovery,articles:[{eventKey:'event',verified:true,sourceUrl:'https://example.org/other'}]}},
    {...day,alerts:[{...article,firstSeenAt:'invalid'}]},
  ]) assert.throws(() => validateDailyPublication(bad), /discoveredLate/);
  assert.throws(() => validateDailyPublication(day,[{date:'2026-10-07',alerts:[article]}]), /previously published/);
});
