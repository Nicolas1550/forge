import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authorized,adminDenied,apiError} from '@/lib/auth';
import {db} from '@/lib/db';
const schema=z.object({storeName:z.string().trim().min(2).max(100),whatsapp:z.string().trim().max(20).refine(s=>!s || /^\+?[0-9\s()-]{8,20}$/.test(s),'Número inválido')});
export async function PATCH(req:NextRequest){
  if(!authorized(req))return adminDenied();
  const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Nombre o WhatsApp inválido.'},{status:400});
  try{await db().query('UPDATE public.forge_store_settings SET store_name=$1,whatsapp_e164=$2 WHERE id=1',[p.data.storeName,p.data.whatsapp||null]);return NextResponse.json({ok:true});}
  catch(e){return apiError(e);}
}
