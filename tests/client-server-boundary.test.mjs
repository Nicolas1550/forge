import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(name)=>readFileSync(path.join(root,name),'utf8');
function imports(source){return [...source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)].map(m=>m[1]);}
test('el formato ARS se mantiene separado de la consulta SQL',()=>{
  assert.match(read('src/lib/format.ts'),/export const pesos/);
  assert.doesNotMatch(read('src/lib/format.ts'),/\b(?:pg|db|fs)\b/);
  assert.doesNotMatch(read('src/lib/catalog.ts'),/export const pesos/);
});
test('ningún componente cliente importa catalog/db/checkout/auth de backend',()=>{
 for(const file of readdirSync(path.join(root,'src/components')).filter(f=>f.endsWith('.tsx'))){
    const content=read('src/components/'+file);
    if(!/^['"]use client['"]/.test(content.trim())) continue;
    for(const spec of imports(content)){
      assert.ok(!/^@\/lib\/(catalog|db|checkout|auth)$/.test(spec),`${file} importa ${spec} del servidor`);
    }
 }
});
test('las rutas API siguen importando catalog y db en servidor',()=>{
 assert.match(read('src/app/api/catalog/route.ts'),/getCatalog/);
 assert.match(read('src/lib/catalog.ts'),/from '\.\/db'/);
});
