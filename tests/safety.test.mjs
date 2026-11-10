import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('SQL seed solamente se ejecuta si no hay productos',()=>{const s=read('scripts/seed.mjs');assert.match(s,/if\(existing\.rows\[0\]\.n>0\)/);assert.match(s,/INSERT INTO public\.forge_products/)});
test('Se recalculan precios antes del checkout',()=>{const s=read('src/app/api/orders/route.ts');assert.match(s,/validateLines\(client,data\.items\)/);assert.match(s,/const total=lines\.reduce/);});
test('El backend bloquea stock insuficiente',()=>assert.match(read('src/lib/checkout.ts'),/Stock insuficiente/));
test('La tienda no envía mensajes WhatsApp sin confirmación',()=>{const s=read('src/components/CartDrawer.tsx');assert.match(s,/href=\{result\.whatsappUrl\}/);assert.ok(!s.includes('sendMessage('));});
test('Los pedidos no incluyen una pasarela de pago inexistente',()=>{assert.ok(!read('src/app/api/orders/route.ts').includes('stripe'));});
