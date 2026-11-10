'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Check,CheckCircle2,ChevronLeft,ChevronRight,Cpu,Minus,Plus,ShieldCheck,ShoppingBag,Truck,ZoomIn} from 'lucide-react';
import {useShop} from './StoreProvider';
import {pesos} from '@/lib/format';
import type {Product} from '@/lib/types';

type Media={url:string;alt_text:string|null;media_type:string};
function specLabel(s:string){return s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function specValue(v:unknown):string {if(Array.isArray(v))return v.join(' · ');if(typeof v==='boolean')return v?'Sí':'No';return String(v);}
export default function ProductDetail({variants,media=[]}:{variants:Product[];media?:Media[]}){
 const {add}=useShop();
 const [variantId,setVariantId]=useState(variants[0]?.variant_id||'');
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('variant');if(id&&variants.some(v=>v.variant_id===id))setVariantId(id);},[variants]);
 const [quantity,setQuantity]=useState(1),[imageIndex,setImageIndex]=useState(0),[added,setAdded]=useState(false);
 const p=useMemo(()=>variants.find(v=>v.variant_id===variantId)||variants[0],[variants,variantId]);
 if(!p)return null;
 const gallery=[...new Set([p.variant_image_url,p.image_url,...media.filter(m=>m.media_type==='image').map(m=>m.url)].filter((u):u is string=>!!u))];
 if(!gallery.length)gallery.push(`/hardware/${p.category_slug}.svg`);
 const shown=Math.min(imageIndex,gallery.length-1);
 function onAdd(){if(p.stock===0)return;add(p,Math.max(1,Math.min(p.stock,quantity)));setAdded(true);window.setTimeout(()=>setAdded(false),1800)}
 return <main className="detail-page shell">
   <div className="product-breadcrumb"><Link href="/hardware"><ArrowLeft size={14}/> HARDWARE</Link><span>/</span><Link href="/hardware">{p.category_name.toUpperCase()}</Link><span>/</span><strong>{p.name.toUpperCase()}</strong></div>
   <div className="detail-layout"><div className="detail-gallery"><div className="detail-main-image"><span className="gallery-top-label">FORGE / PRODUCT ENGINEERING</span>{p.is_demo&&<span className="detail-demo-tag">PRODUCTO DEMO</span>}<img src={gallery[shown]} alt={`Vista de ${p.name}`} />{gallery.length>1&&<div className="gallery-arrows"><button onClick={()=>setImageIndex(i=>(i+gallery.length-1)%gallery.length)} aria-label="Imagen anterior"><ChevronLeft/></button><button onClick={()=>setImageIndex(i=>(i+1)%gallery.length)} aria-label="Imagen siguiente"><ChevronRight/></button></div>}<span className="gallery-index">{String(shown+1).padStart(2,'0')} / {String(gallery.length).padStart(2,'0')}</span></div>
    {gallery.length>1&&<div className="gallery-thumbs">{gallery.map((url,i)=><button key={url} className={i===shown?'active':''} onClick={()=>setImageIndex(i)} aria-label={`Ver imagen ${i+1}`}><img src={url} alt=""/></button>)}</div>}
    <div className="detail-gallery-note"><ZoomIn size={16}/> Galería según imágenes cargadas en Neon; los productos sin foto usan ilustraciones de categoría.</div>
   </div>
   <div className="detail-info"><span className="eyebrow">{p.brand||'FORGE'} / {p.category_name} / SKU {p.sku}</span><h1>{p.name}<span>.</span></h1><p className="detail-description">{p.description||'Hardware diseñado para configurar tu próximo equipo. Consultá las características y variantes disponibles.'}</p>
    <div className="detail-price-block"><span>PRECIO DE REFERENCIA / ARS</span><strong>{pesos(p.price_ars)}</strong><small>{p.is_demo?'Precio ilustrativo de demostración. No es una oferta comercial.':'Precio del catálogo sujeto a confirmación.'}</small></div>
    <div className="detail-stock"><span className={p.stock>0?'stock-green':'stock-red'}/>{p.stock>0?`${p.stock} unidades registradas en catálogo`:'Sin stock registrado'}</div>
    {variants.length>1&&<div className="detail-variants"><h3>VARIANTE</h3><div>{variants.map(v=><button key={v.variant_id} onClick={()=>{setVariantId(v.variant_id);setQuantity(1);setImageIndex(0)}} className={v.variant_id===variantId?'active':''}>{v.variant_name}<small>{pesos(v.price_ars)}</small></button>)}</div></div>}
    <div className="detail-purchase"><div className="detail-qty"><button type="button" aria-label="Restar unidad" disabled={quantity<=1} onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus size={17}/></button><span>{quantity}</span><button type="button" aria-label="Agregar unidad" disabled={quantity>=p.stock||quantity>=20} onClick={()=>setQuantity(q=>Math.min(20,p.stock,q+1))}><Plus size={17}/></button></div><button type="button" className="btn btn-primary detail-buy" onClick={onAdd} disabled={p.stock<1}>{added?<><Check size={18}/> AGREGADO AL CARRITO</>:<><ShoppingBag size={18}/> AGREGAR AL CARRITO <ArrowUpRight size={17}/></>}</button></div>
    <Link href="/builder" className="detail-builder-link"><Cpu size={18}/> ¿Querés usar esta pieza? Abrí el configurador 3D <ArrowUpRight size={16}/></Link>
    <div className="detail-highlights"><div><ShieldCheck size={19}/><span>Compatibilidad orientativa en PC Builder</span></div><div><CheckCircle2 size={19}/><span>Precios y stock validados al solicitar</span></div><div><Truck size={19}/><span>Envío y disponibilidad a confirmar</span></div></div>
   </div></div>
   <section className="detail-specs"><div><span className="eyebrow">DATOS DEL PRODUCTO / FORGE</span><h2>DETALLES <span>TÉCNICOS.</span></h2><p>Especificaciones declaradas en el catálogo. Revisá las fichas oficiales antes de confirmar compatibilidad.</p></div><div className="specs-grid">{Object.entries(p.specs||{}).length?Object.entries(p.specs).map(([key,val])=><div key={key}><span>{specLabel(key)}</span><strong>{specValue(val)}</strong></div>):<p>Este producto todavía no tiene especificaciones cargadas en Neon.</p>}</div></section>
   <div className="detail-bottom-cta"><div><span>FORGE // BUILD YOUR RIG</span><h3>ESTÁS A UNA PIEZA DE TU PRÓXIMA PC.</h3></div><Link href="/builder" className="btn btn-outline">ABRIR CONFIGURADOR <ArrowUpRight size={16}/></Link></div>
 </main>;
}
