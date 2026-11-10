import {NextResponse} from 'next/server';
import {isDatabaseReady} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json({ok:await isDatabaseReady(),database:'Neon',schema:'forge_*'});}
  catch{return NextResponse.json({ok:false,error:'No se pudo conectar con Neon.'},{status:503});}
}
