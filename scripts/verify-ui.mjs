import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('No UI scripts found');
for (const [i,match] of scripts.entries()) new vm.Script(match[1],{filename:`index.html script ${i+1}`});
console.log(`Daily Check UI: ${scripts.length} script(s) parse successfully`);
