import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authorized,adminDenied,apiError} from '@/lib/auth';
import {db} from '@/lib/db';
const schema=z.object({id:z.string().uuid(),status:z.enum(['draft','whatsapp_opened','contacted','confirmed','cancelled'])});
export async function PATCH(req:NextRequest){
  if(!authorized(req))return adminDenied();
  const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Datos inválidos.'},{status:400});
  const client=await db().connect();
  try{await client.query('BEGIN');const res=await client.query('UPDATE public.forge_orders SET status=$2 WHERE id=$1 RETURNING id',[p.data.id,p.data.status]);
    if(!res.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Pedido no encontrado.'},{status:404});}
    await client.query("INSERT INTO public.forge_order_events(order_id,event_type,details) VALUES($1,'status_changed',$2::jsonb)",[p.data.id,JSON.stringify({status:p.data.status})]);
    await client.query('COMMIT');return NextResponse.json({ok:true});
  }catch(e){await client.query('ROLLBACK');return apiError(e);}finally{client.release();}
}
