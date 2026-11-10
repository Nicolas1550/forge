import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {apiError} from '@/lib/auth';
import {checkoutSchema,makeWhatsappUrl,validateLines} from '@/lib/checkout';
import {BUILD_SLOTS} from '@/lib/types';
export async function POST(req:NextRequest){
  const parsed=checkoutSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Revisá nombre, contacto y productos del pedido.'},{status:400});
  const data=parsed.data,client=await db().connect();
  try{
    await client.query('BEGIN');
    const lines=await validateLines(client,data.items);
    const total=lines.reduce((s,l)=>s+l.price*l.quantity,0);
    let cartId:string;
    const existing=data.cartId?await client.query("SELECT id FROM public.forge_carts WHERE id=$1 AND status='active' FOR UPDATE",[data.cartId]):null;
    if(existing?.rowCount){
      cartId=existing.rows[0].id;
      await client.query("UPDATE public.forge_carts SET status='converted' WHERE id=$1",[cartId]);
    }else{
      const c=await client.query("INSERT INTO public.forge_carts(status) VALUES('converted') RETURNING id");
      cartId=c.rows[0].id;
      for(const l of lines)await client.query('INSERT INTO public.forge_cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3)',[cartId,l.variantId,l.quantity]);
    }
    let buildId:null|string=null;
    if(data.build?.slots && Object.keys(data.build.slots).length){
      const b=await client.query("INSERT INTO public.forge_pc_builds(cart_id,name,status) VALUES($1,$2,'quoted') RETURNING id",[cartId,data.build.name]);
      buildId=b.rows[0].id;
      for(const slot of BUILD_SLOTS){const variantId=data.build.slots[slot];if(!variantId)continue;
        if(!lines.some(l=>l.variantId===variantId))throw new Error('La configuración contiene productos que no están en el pedido.');
        await client.query('INSERT INTO public.forge_pc_build_items(build_id,slot,variant_id) VALUES($1,$2,$3)',[buildId,slot,variantId]);}
    }
    const order=await client.query(`INSERT INTO public.forge_orders(cart_id,build_id,customer_name,customer_whatsapp,customer_email,customer_notes,total_ars,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING id,order_number`,[cartId,buildId,data.customerName,data.customerWhatsapp||null,data.customerEmail||null,data.notes||null,total]);
    const id=order.rows[0].id,orderNumber=Number(order.rows[0].order_number);
    for(const l of lines)await client.query(`INSERT INTO public.forge_order_items(order_id,variant_id,sku_snapshot,product_name_snapshot,variant_name_snapshot,unit_price_ars,quantity)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,l.variantId,l.sku,l.productName,l.variantName,l.price,l.quantity]);
    await client.query("INSERT INTO public.forge_order_events(order_id,event_type,details) VALUES($1,'created',$2::jsonb)",[id,JSON.stringify({channel:'whatsapp',items:lines.length,demo:lines.some(l=>l.sku.startsWith('DEMO-'))})]);
    const settings=await client.query('SELECT whatsapp_e164 FROM public.forge_store_settings WHERE id=1');
    const whatsappUrl=makeWhatsappUrl(settings.rows[0]?.whatsapp_e164||'',orderNumber,lines,total,data.build?.name);
    await client.query('COMMIT');
    return NextResponse.json({orderId:id,orderNumber,totalArs:total,whatsappUrl});
  }catch(e){await client.query('ROLLBACK');if(e instanceof Error && /Stock|disponible|existe|configuración|Cantidad/.test(e.message))return NextResponse.json({error:e.message},{status:409});return apiError(e,'No se pudo registrar el pedido.');}
  finally{client.release();}
}
