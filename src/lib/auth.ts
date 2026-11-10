import { NextRequest, NextResponse } from 'next/server';
import {timingSafeEqual} from 'node:crypto';
export function authorized(req:NextRequest):boolean{
  const expected=process.env.FORGE_ADMIN_KEY;
  const got=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!expected || !got) return false;
  const a=Buffer.from(expected),b=Buffer.from(got);
  return a.length===b.length && timingSafeEqual(a,b);
}
export function adminDenied():NextResponse {return NextResponse.json({error:'Acceso administrativo no autorizado.'},{status:401});}
export function apiError(e:unknown,publicMessage='No se pudo completar la operación.'){
  console.error('[FORGE]',e);
  return NextResponse.json({error:publicMessage},{status:500});
}
