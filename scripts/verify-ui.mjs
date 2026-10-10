import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
if (/recoveryNotice|欠けていた日の記事を再収集しました/.test(html)) {
  throw new Error('One-time recovery reports must stay out of the product UI');
}
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('No UI scripts found');
for (const [i,match] of scripts.entries()) new vm.Script(match[1],{filename:`index.html script ${i+1}`});
console.log(`Daily Check UI: ${scripts.length} script(s) parse successfully`);

for (const folder of ['days','weeks']) {
  const root = new URL('../data/'+folder+'/',import.meta.url);
  for (const file of await readdir(root)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(await readFile(new URL(file,root),'utf8'));
    const publicStatus = [data.headline || '', ...(data.checks || []).map(c => c.summary || '')];
    if (publicStatus.some(value => /再収集|復旧完了|確認完了|欠落.{0,15}(復旧|収集|監査)|遅延発見/.test(value))) {
      throw new Error(file+': One-time maintenance reports must stay out of public summaries');
    }
  }
}
