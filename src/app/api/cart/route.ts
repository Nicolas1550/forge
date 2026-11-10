import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {apiError} from '@/lib/auth';
import {lineSchema,validateLines} from '@/lib/checkout';
const schema=z.object({cartId:z.string().uuid().nullish(),items:z.array(lineSchema).max(40)});
export async function POST(req:NextRequest){
  const data=schema.safeParse(await req.json().catch(()=>null));
  if(!data.success)return NextResponse.json({error:'Carrito inválido.'},{status:400});
  const client=await db().connect();
  try{
    await client.query('BEGIN');
    const lines=data.data.items.length?await validateLines(client,data.data.items):[];
    let id=data.data.cartId;
    if(id){const old=await client.query("SELECT id FROM public.forge_carts WHERE id=$1 AND status='active' FOR UPDATE",[id]);if(!old.rowCount)id=null;}
    if(!id){const created=await client.query('INSERT INTO public.forge_carts DEFAULT VALUES RETURNING id');id=created.rows[0].id;}
    await client.query('DELETE FROM public.forge_cart_items WHERE cart_id=$1',[id]);
    for(const l of lines)await client.query('INSERT INTO public.forge_cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3)',[id,l.variantId,l.quantity]);
    await client.query('COMMIT');
    return NextResponse.json({cartId:id,items:lines.map(l=>({variantId:l.variantId,quantity:l.quantity})),totalArs:lines.reduce((s,l)=>s+l.price*l.quantity,0)});
  }catch(e){await client.query('ROLLBACK');if(e instanceof Error && /Stock|disponible|existe|Cantidad/.test(e.message))return NextResponse.json({error:e.message},{status:409});return apiError(e,'No se pudo guardar el carrito.');}
  finally{client.release();}
}
