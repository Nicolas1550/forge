import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authorized,adminDenied,apiError} from '@/lib/auth';
import {db} from '@/lib/db';
const productSchema=z.object({
  id:z.string().uuid().optional(), categoryId:z.string().uuid(),name:z.string().trim().min(3).max(150),
  slug:z.string().trim().min(3).max(150).regex(/^[a-z0-9-]+$/),
  brand:z.string().trim().max(70).optional().default(''),description:z.string().trim().max(2000).optional().default(''),
  imageUrl:z.string().max(400).refine(v=>!v || v.startsWith('/') || /^https:\/\//.test(v)).optional().default(''),featured:z.boolean().default(false),active:z.boolean().default(true),
  variantId:z.string().uuid().optional(), sku:z.string().trim().min(3).max(80), variantName:z.string().trim().min(1).max(100),
  priceArs:z.number().finite().min(0).max(1000000000),stock:z.number().int().min(0).max(1000000),
  specs:z.record(z.string(),z.unknown()).default({}), attributes:z.record(z.string(),z.unknown()).default({}),
  modelGlbUrl:z.string().max(400).refine(v=>!v || v.startsWith('/') || /^https:\/\//.test(v)).optional().default('')
});
export async function POST(req:NextRequest){
  if(!authorized(req))return adminDenied();
  const p=productSchema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({error:'Datos inválidos: comprobá categoría, slug, SKU y precio.'},{status:400});
  const d=p.data,client=await db().connect();
  try{
    await client.query('BEGIN');
    const prod=d.id?
      await client.query(`UPDATE public.forge_products SET name=$2,slug=$3,brand=$4,description=$5,image_url=$6,category_id=$7,is_featured=$8,is_active=$9
       WHERE id=$1 RETURNING id`,[d.id,d.name,d.slug,d.brand,d.description,d.imageUrl||null,d.categoryId,d.featured,d.active]):
      await client.query(`INSERT INTO public.forge_products(name,slug,brand,description,image_url,category_id,is_featured,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[d.name,d.slug,d.brand,d.description,d.imageUrl||null,d.categoryId,d.featured,d.active]);
    if(!prod.rowCount)throw new Error('Producto no encontrado.');
    const id=prod.rows[0].id;
    if(d.variantId){
      const updated=await client.query(`UPDATE public.forge_product_variants SET sku=$3,variant_name=$4,price_ars=$5,stock=$6,specs=$7::jsonb,attributes=$8::jsonb,model_glb_url=$9
        WHERE id=$1 AND product_id=$2 RETURNING id`,[d.variantId,id,d.sku,d.variantName,d.priceArs,d.stock,JSON.stringify(d.specs),JSON.stringify(d.attributes),d.modelGlbUrl||null]);
      if(!updated.rowCount)throw new Error('Variante no encontrada.');
    }else{
      await client.query(`INSERT INTO public.forge_product_variants(product_id,sku,variant_name,price_ars,stock,specs,attributes,model_glb_url)
        VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,[id,d.sku,d.variantName,d.priceArs,d.stock,JSON.stringify(d.specs),JSON.stringify(d.attributes),d.modelGlbUrl||null]);
    }
    await client.query('COMMIT');return NextResponse.json({ok:true,id});
  }catch(e){await client.query('ROLLBACK');if(e && typeof e==='object' && 'code' in e && (e as {code:string}).code==='23505')return NextResponse.json({error:'El slug o SKU ya existe.'},{status:409});return apiError(e,'No se pudo guardar el producto.');}
  finally{client.release();}
}
