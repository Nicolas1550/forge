import type { PoolClient } from 'pg';
import {z} from 'zod';
export const lineSchema=z.object({variantId:z.string().uuid(),quantity:z.number().int().min(1).max(20)});
export const checkoutSchema=z.object({
  customerName:z.string().trim().min(2).max(90),
  customerWhatsapp:z.string().trim().max(35).optional().default(''),
  customerEmail:z.union([z.literal(''),z.email()]).optional().default(''),
  notes:z.string().trim().max(700).optional().default(''),
  items:z.array(lineSchema).min(1).max(40),
  cartId:z.string().uuid().optional(),
  build:z.object({name:z.string().trim().max(80).default('Mi PC personalizada'),slots:z.record(z.string(),z.string().uuid()).optional()}).optional()
});
export type ValidatedLine={variantId:string;quantity:number;price:number;sku:string;productName:string;variantName:string;stock:number};
export async function validateLines(client:PoolClient, items:z.infer<typeof lineSchema>[]){
  const qty=new Map<string,number>();
  for(const l of items)qty.set(l.variantId,(qty.get(l.variantId)||0)+l.quantity);
  if([...qty.values()].some(n=>n>20))throw new Error('Cantidad máxima: 20 por variante.');
  const ids=[...qty.keys()];
  const result=await client.query(`SELECT v.id,v.sku,v.variant_name,v.price_ars::float8 AS price_ars,v.stock,
    p.name,p.is_active,p.slug AS product_slug,v.is_active AS variant_active
    FROM public.forge_product_variants v JOIN public.forge_products p ON p.id=v.product_id
    WHERE v.id=ANY($1::uuid[]) FOR UPDATE OF v`,[ids]);
  if(result.rows.length!==ids.length)throw new Error('Algún producto ya no existe.');
  const rows:ValidatedLine[]=result.rows.map(r=>{
    const quantity=qty.get(r.id)||0;
    if(!r.is_active || !r.variant_active)throw new Error(`${r.name} ya no está disponible.`);
    if(quantity>r.stock)throw new Error(`Stock insuficiente para ${r.name}.`);
    return {variantId:r.id,quantity,price:Number(r.price_ars),sku:r.sku,productName:r.name,variantName:r.variant_name,stock:r.stock};
  });
  return rows;
}
export function makeWhatsappUrl(phone:string,orderNumber:number,lines:ValidatedLine[],total:number,buildName?:string){
  const normalized=phone.replace(/[^\d]/g,'');
  if(!/^\d{8,15}$/.test(normalized))return null;
  const text=[`Hola, quiero consultar por mi pedido FORGE #${orderNumber}.`,buildName?`Configuración: ${buildName}`:'',
    ...lines.map(l=>`• ${l.productName} (${l.variantName}) x${l.quantity} — ${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(l.price*l.quantity)}`),
    `Total de referencia: ${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(total)}`,
    '¿Me confirman disponibilidad y el siguiente paso?'].filter(Boolean).join('\n');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
