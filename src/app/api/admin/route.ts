import {NextRequest,NextResponse} from 'next/server';
import {authorized,adminDenied,apiError} from '@/lib/auth';
import {db} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  if(!authorized(req))return adminDenied();
  try{
    const [categories,products,variants,settings,orders] = await Promise.all([
      db().query('SELECT id,slug,name FROM public.forge_categories ORDER BY sort_order'),
      db().query('SELECT id,name,slug,brand,description,image_url,category_id,is_featured,is_active FROM public.forge_products ORDER BY created_at DESC'),
      db().query('SELECT id,product_id,sku,variant_name,price_ars::float8 AS price_ars,stock,specs,attributes,model_glb_url,image_url,is_active FROM public.forge_product_variants ORDER BY created_at DESC'),
      db().query('SELECT store_name,whatsapp_e164,currency_code FROM public.forge_store_settings WHERE id=1'),
      db().query('SELECT id,order_number,customer_name,customer_whatsapp,total_ars::float8 AS total_ars,status,created_at FROM public.forge_orders ORDER BY created_at DESC LIMIT 60')
    ]);
    const ids=orders.rows.map(o=>o.id);
    const orderItems=ids.length?await db().query('SELECT order_id,product_name_snapshot,variant_name_snapshot,sku_snapshot,quantity,unit_price_ars::float8 AS unit_price_ars,line_total_ars::float8 AS line_total_ars FROM public.forge_order_items WHERE order_id=ANY($1::uuid[]) ORDER BY order_id,product_name_snapshot',[ids]):{rows:[]};
    return NextResponse.json({categories:categories.rows,products:products.rows,variants:variants.rows,settings:settings.rows[0],orders:orders.rows,orderItems:orderItems.rows},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return apiError(e,'No se pudo abrir el panel.');}
}
