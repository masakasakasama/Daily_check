import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/    function isUsableArticleImage\(img\)\{[\s\S]*?\n    \}/)?.[0];
test('large article cards reject tiny icons and undersized preview images',()=>{
  assert.ok(source);
  const context={};vm.createContext(context);vm.runInContext(source+';globalThis.check=isUsableArticleImage',context);
  for(const [naturalWidth,naturalHeight] of [[16,16],[128,128],[320,180],[1200,100]]) assert.equal(context.check({naturalWidth,naturalHeight}),false);
  assert.equal(context.check({naturalWidth:1600,naturalHeight:1066}),true);
  assert.equal(context.check({naturalWidth:640,naturalHeight:360}),true);
});
