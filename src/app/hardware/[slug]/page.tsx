import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {db} from '@/lib/db';
import {getCatalog} from '@/lib/catalog';
import ProductDetail from '@/components/ProductDetail';

export const dynamic='force-dynamic';
type PageProps={params:Promise<{slug:string}>};
async function productData(slug:string){
 const catalog=await getCatalog();
 const variants=catalog.products.filter(p=>p.slug===slug);
 if(!variants.length)return null;
 let media:{url:string;alt_text:string|null;media_type:string}[]=[];
 try{const images=await db().query('SELECT url,alt_text,media_type FROM public.forge_product_media WHERE product_id=$1 ORDER BY sort_order,id',[variants[0].id]);media=images.rows;}catch(err){console.warn('[FORGE] Galería adicional no disponible',err);}
 return {variants,media};
}
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params;
 try{const data=await productData(slug);if(!data)return {title:'Producto no encontrado | FORGE'};const p=data.variants[0];return {title:`${p.name} | FORGE Hardware`,description:p.description||`Conocé ${p.name}, sus variantes y características en FORGE.`,robots:p.is_demo?{index:false,follow:true}:undefined};}catch{return {title:'Hardware | FORGE'};}
}
export default async function ProductPage({params}:PageProps){const {slug}=await params;const data=await productData(slug);if(!data)notFound();return <ProductDetail {...data}/>}
