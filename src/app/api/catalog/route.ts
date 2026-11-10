import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';
import {apiError} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await getCatalog(),{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e,'No se pudo cargar el catálogo desde Neon.');}}
