import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const exists=(f)=>fs.existsSync(path.join(root,f));
test('V2.5 tiene catálogo real, ficha por producto y SEO',()=>{
 for(const route of ['src/app/hardware/page.tsx','src/app/hardware/[slug]/page.tsx','src/app/quote/page.tsx','src/components/ProductCard.tsx','src/components/CatalogBrowser.tsx','src/components/ProductDetail.tsx','src/components/BuildQuote.tsx'])assert.ok(exists(route),route);
 assert.match(read('src/app/hardware/[slug]/page.tsx'),/getCatalog\(/);
 assert.match(read('src/components/ProductDetail.tsx'),/variant_id/);
 assert.match(read('src/components/CatalogBrowser.tsx'),/Compará componentes de la misma categoría/);
 assert.ok(exists('public/og-forge.jpg'));assert.ok(exists('src/app/icon.svg'));
 assert.match(read('src/app/layout.tsx'),/openGraph/);
});
test('se preserva el montaje modular V3, cámara, puerta y refrigeración por etapas',()=>{
 const scene=read('src/components/PCScene.tsx');
 for(const t of ['glass_panel.glb','base_static.glb','gpu.glb','ram.glb','radiator.glb','aio_pump.glb','aio_hoses.glb','CameraDirector','CERRAR PUERTA','ABRIR PUERTA','DESPIECE'])assert.ok(scene.includes(t),t);
});
test('configuraciones compartibles, guardadas localmente y presupuesto descargable por impresión',()=>{
 const b=read('src/components/Builder.tsx');
 for(const t of ['forge_saved_build_v1','COMPARTIR ENLACE','PRESUPUESTO PDF','forge_quote_build','forge_pending_build'])assert.ok(b.includes(t),t);
 const q=read('src/components/BuildQuote.tsx');assert.ok(q.includes('window.print()'));assert.ok(q.includes('forge_quote_build'));
});
test('carrito y backend conservan stock/precios y proceso WhatsApp explícito',()=>{
 const provider=read('src/components/StoreProvider.tsx');
 assert.ok(provider.includes('p.stock<=0'));assert.ok(provider.includes('Math.min(20'));
 const orders=read('src/app/api/orders/route.ts');
 assert.ok(orders.includes('validateLines(client,data.items)'));assert.ok(orders.includes("status)"));
 const cart=read('src/components/CartDrawer.tsx');assert.ok(cart.includes('VACIAR CARRITO'));assert.ok(cart.includes('whatsappUrl'));
});
test('Panel administrativo permite inspeccionar y exportar pedidos',()=>{
 assert.match(read('src/app/api/admin/route.ts'),/forge_order_items/);
 assert.match(read('src/components/AdminPanel.tsx'),/FORGE_pedidos.csv/);
 assert.match(read('src/components/AdminPanel.tsx'),/order-expanded/);
});
test('ZIP final excluye secretos, Blender y artefactos anteriores',()=>{
 assert.ok(!exists('.env.local'));
 assert.ok(!exists('node_modules/.bin/next'));
 for(const f of ['src/data/forge_assembly_sequence.json','src/data/forge_component_manifest.json','src/data/forge_attribution.txt'])assert.ok(!exists(f),f);
 assert.match(read('.gitignore'),/\.env\.\*/);
 assert.ok(exists('MODEL_LICENSE.md'));
});
