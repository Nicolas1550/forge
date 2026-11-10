'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowUpRight,Check,Plus,ShoppingBag,ArrowLeftRight} from 'lucide-react';
import type {Product} from '@/lib/types';
import {pesos} from '@/lib/format';
import {useShop} from './StoreProvider';

export default function ProductCard({product:p,index=0,compared=false,onCompare}:{product:Product;index?:number;compared?:boolean;onCompare?:(p:Product)=>void}){
 const {add}=useShop();
 const [added,setAdded]=useState(false);
 const image=p.variant_image_url||p.image_url||`/hardware/${p.category_slug}.svg`;
 function addToCart(){if(p.stock<1)return;add(p);setAdded(true);window.setTimeout(()=>setAdded(false),1600);}
 return <article className="product-card commerce-card">
   <div className="product-image"><div className="product-image-mesh"/><span className="card-index">{String(index+1).padStart(2,'0')} / FORGE HARDWARE</span>{p.is_featured&&<span className="card-feature">✳ DESTACADO</span>}
    <Link href={`/hardware/${p.slug}?variant=${p.variant_id}`} aria-label={`Ver detalles de ${p.name}`} className="card-image-link"><img src={image} alt={`Producto ${p.name}`} loading="lazy"/></Link>
    <button className="quick-add" type="button" onClick={addToCart} disabled={p.stock===0} aria-label={`Agregar ${p.name} al carrito`}>{added?<Check size={19}/>:<Plus size={19}/>}</button>
   </div>
   <div className="product-copy"><div className="product-brand">{p.brand||'FORGE'}<span>{p.is_demo?'DEMO':p.category_name}</span></div>
    <h3><Link href={`/hardware/${p.slug}?variant=${p.variant_id}`}>{p.name}</Link></h3>
    <p className="product-variant-label">{p.variant_name} · {p.sku}</p>
    <div className="product-bottom"><div><strong>{pesos(p.price_ars)}</strong><span>{p.stock>0?`STOCK REGISTRADO: ${p.stock}`:'SIN STOCK'}</span></div>
      <Link href={`/hardware/${p.slug}?variant=${p.variant_id}`} className="add-btn product-detail-link" aria-label={`Detalles de ${p.name}`}>VER <ArrowUpRight size={15}/></Link>
    </div>
    <button type="button" className="product-card-cart" onClick={addToCart} disabled={p.stock===0}>{added?<><Check size={15}/> AGREGADO</>:<><ShoppingBag size={15}/> AGREGAR AL CARRITO</>}</button>{onCompare&&<button type="button" className={"compare-card-btn "+(compared?"active":"")} onClick={()=>onCompare(p)}><ArrowLeftRight size={14}/>{compared?"QUITAR COMPARACIÓN":"COMPARAR"}</button>}
   </div>
 </article>;
}
