import {db} from './db';
import type {CatalogData,Product} from './types';
export async function getCatalog():Promise<CatalogData>{
  const [categories, products, settings] = await Promise.all([
    db().query("SELECT id,slug,name,description,sort_order FROM public.forge_categories WHERE is_active=TRUE ORDER BY sort_order,name"),
    db().query(`SELECT p.id,p.slug,p.name,p.brand,p.description,p.image_url,p.category_id,
      p.is_featured,p.is_active,c.slug AS category_slug,c.name AS category_name,
      v.id AS variant_id,v.sku,v.variant_name,v.price_ars::float8 AS price_ars,v.stock,
      v.attributes,v.specs,v.image_url AS variant_image_url,v.model_glb_url
      FROM public.forge_products p JOIN public.forge_categories c ON c.id=p.category_id
      JOIN public.forge_product_variants v ON v.product_id=p.id
      WHERE p.is_active=TRUE AND c.is_active=TRUE AND v.is_active=TRUE
      ORDER BY p.is_featured DESC,c.sort_order,p.name,v.price_ars`),
    db().query('SELECT whatsapp_e164 FROM public.forge_store_settings WHERE id=1')
  ]);
  const list = products.rows.map(r=>({...r,price_ars:Number(r.price_ars),stock:Number(r.stock),is_demo:String(r.sku).startsWith('DEMO-')})) as Product[];
  return {categories:categories.rows,products:list,whatsappConfigured:!!settings.rows[0]?.whatsapp_e164,demo:list.some(p=>p.is_demo)};
}
