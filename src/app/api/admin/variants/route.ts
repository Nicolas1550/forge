import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authorized,adminDenied,apiError} from '@/lib/auth';
import {db} from '@/lib/db';
const schema=z.object({id:z.string().uuid(),stock:z.number().int().min(0),priceArs:z.number().finite().min(0),active:z.boolean()});
export async function PATCH(req:NextRequest){
  if(!authorized(req))return adminDenied();
  const data=schema.safeParse(await req.json().catch(()=>null));if(!data.success)return NextResponse.json({error:'Datos inválidos.'},{status:400});
  try{const res=await db().query('UPDATE public.forge_product_variants SET stock=$2,price_ars=$3,is_active=$4 WHERE id=$1 RETURNING id',
    [data.data.id,data.data.stock,data.data.priceArs,data.data.active]);
    if(!res.rowCount)return NextResponse.json({error:'Variante no encontrada.'},{status:404});return NextResponse.json({ok:true});
  }catch(e){return apiError(e);}
}
