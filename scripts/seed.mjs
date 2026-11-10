import pg from 'pg';
const data = [
// category,slug,name,brand,price,stock,specs,featured
['case','forge-axis-700','AXIS 700 — Panoramic Case','FORGE LAB',189900,12,{max_gpu_length_mm:380,supported_form_factors:['ATX','mATX','ITX'],max_cooler_height_mm:175},true],
['case','forge-prism-500','PRISM 500 — Glass Edition','FORGE LAB',149900,9,{max_gpu_length_mm:355,supported_form_factors:['ATX','mATX','ITX'],max_cooler_height_mm:165},false],
['cpu','intel-i7-14700k','Core i7-14700K','Intel',599000,7,{socket:'LGA1700',tdp_watts:125},true],
['cpu','amd-7800x3d','Ryzen 7 7800X3D','AMD',549000,8,{socket:'AM5',tdp_watts:120},true],
['motherboard','z790-ddr5-atx','Z790 AORUS Elite AX','GIGABYTE',379000,5,{socket:'LGA1700',memory_type:'DDR5',form_factor:'ATX'},false],
['motherboard','b650-ddr5-matx','B650M Pro RS','ASRock',289000,11,{socket:'AM5',memory_type:'DDR5',form_factor:'mATX'},false],
['gpu','rtx-4070-super','GeForce RTX 4070 SUPER','NVIDIA',1099000,6,{length_mm:267,recommended_psu_watts:650},true],
['gpu','rtx-4080-super','GeForce RTX 4080 SUPER','NVIDIA',1899000,3,{length_mm:310,recommended_psu_watts:750},true],
['ram','viper-32-ddr5','Viper Venom 32GB DDR5','Patriot',169000,16,{memory_type:'DDR5',capacity_gb:32},false],
['ram','viper-64-ddr5','Viper Venom 64GB DDR5','Patriot',309000,8,{memory_type:'DDR5',capacity_gb:64},false],
['storage','ssd-990-1tb','990 PRO NVMe 1TB','Samsung',189000,14,{capacity_gb:1000,interface:'NVMe'},false],
['storage','ssd-990-2tb','990 PRO NVMe 2TB','Samsung',299000,9,{capacity_gb:2000,interface:'NVMe'},false],
['psu','psu-rm850e','RM850e 850W','Corsair',209000,7,{wattage:850},false],
['psu','psu-rm1000x','RM1000x 1000W','Corsair',289000,5,{wattage:1000},false],
['cooler','aio-360-argb','Liquid Freezer III 360','Arctic',279000,5,{supported_sockets:['LGA1700','AM5'],radiator_mm:360},false],
['cooler','air-tower','Phantom Spirit 120','Thermalright',119000,8,{supported_sockets:['LGA1700','AM5'],height_mm:157},false],
['fans','triple-fan-argb','Halo ARGB — Triple Kit','FORGE LAB',89900,19,{fans:3,diameter_mm:120},false],
['peripherals','mechanical-keyboard','K87 Pro — Mechanical','FORGE LAB',129000,16,{switches:'mechanical'},false],
['peripherals','gaming-mouse','M1 Ultralight — Wireless','FORGE LAB',79900,18,{connectivity:'wireless'},false],
['peripherals','oled-display','OLED 27 — 240Hz','FORGE LAB',999000,4,{resolution:'2560x1440',refresh_hz:240},true],
];
if(!process.env.DATABASE_URL){console.error('Falta DATABASE_URL en .env.local');process.exit(1)}
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:12000});
let client;
try {
  client=await pool.connect();
  const existing=await client.query('SELECT COUNT(*)::int AS n FROM public.forge_products');
  if(existing.rows[0].n>0){console.log(`FORGE Neon: ${existing.rows[0].n} productos existentes. No se modifica el catálogo.`);process.exitCode=0;}
  else {
    await client.query('BEGIN');
    for(const [category,slug,name,brand,price,stock,specs,featured] of data){
      const c=await client.query('SELECT id FROM public.forge_categories WHERE slug=$1',[category]);
      if(!c.rowCount)throw new Error(`Categoría inexistente: ${category}. Ejecutá primero el SQL V2.`);
      const p=await client.query(`INSERT INTO public.forge_products(category_id,slug,name,brand,description,image_url,is_active,is_featured)
        VALUES($1,$2,$3,$4,$5,$6,TRUE,$7) RETURNING id`,
        [c.rows[0].id,'demo-'+slug,name,brand,'Producto de demostración. Especificaciones y precios de referencia, no una oferta comercial.','/hardware/'+category+'.svg',featured]);
      await client.query(`INSERT INTO public.forge_product_variants(product_id,sku,variant_name,price_ars,stock,specs,attributes)
        VALUES($1,$2,'Estándar',$3,$4,$5::jsonb,$6::jsonb)`,
        [p.rows[0].id,'DEMO-'+slug.toUpperCase(),price,stock,JSON.stringify(specs),JSON.stringify({demo:true})]);
    }
    await client.query('COMMIT');
    console.log(`FORGE Neon: ${data.length} productos DEMO insertados. Precios/stock de prueba, no reales.`);
  }
} catch(err){
  if(client)try{await client.query('ROLLBACK')}catch{}
  console.error('FORGE Neon: error de conexión o esquema.',err?.message||err);
  process.exitCode=1;
} finally {client?.release();await pool.end();}
