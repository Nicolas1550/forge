import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
test('la vista 3D ocupa todo el contenedor en home, configurador y promo',()=>{
 const css=read('src/app/globals.css');
 for(const selector of ['.hero-model > .forge-realistic-viewer','.builder-scene > .forge-realistic-viewer','.callout-visual > .forge-realistic-viewer']) {
   assert.ok(css.includes(selector),selector);
 }
 assert.match(css,/position:\s*absolute;[\s\S]*?inset:\s*0;/);
 assert.match(css,/height:\s*100%/);
});
test('el visor abre con cámara adecuada y tamaño proporcional',()=>{
 const s=read('src/components/PCScene.tsx');
 assert.ok(s.includes('camera={{position:[-5.4,2.25,5.9],fov:34'));
 assert.ok(s.includes('const factor=3.65/Math.max(size.x,size.y,size.z);'));
});
test('la orientación inicial es estable; el usuario decide activar el giro',()=>{
 assert.ok(read('src/components/Storefront.tsx').includes('interactive={true} autoRotate={false}'));
 assert.ok(read('src/components/Builder.tsx').includes('[spin,setSpin]=useState(false)'));
});
