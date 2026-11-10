'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Filter,RotateCcw,Search,SlidersHorizontal,Terminal,ChevronDown,ArrowLeftRight,X} from 'lucide-react';
import ProductCard from './ProductCard';
import type {Product} from '@/lib/types';
import {pesos} from '@/lib/format';
import {useShop} from './StoreProvider';

export default function CatalogBrowser(){
 const {catalog,loading,error}=useShop();
 const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey)return;const tag=(event.target as HTMLElement)?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;event.preventDefault();searchInput.current?.focus();};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
 const [category,setCategory]=useState('all'),[brand,setBrand]=useState('all'),[query,setQuery]=useState(''),[sort,setSort]=useState('featured'),[onlyStock,setOnlyStock]=useState(false);
 const [comparison,setComparison]=useState<Product[]>([]),[compareOpen,setCompareOpen]=useState(false),[compareNote,setCompareNote]=useState('');
 function toggleCompare(p:Product){setComparison(prev=>{if(prev.some(x=>x.variant_id===p.variant_id)){setCompareNote('');return prev.filter(x=>x.variant_id!==p.variant_id)}if(prev.length&&prev[0].category_slug!==p.category_slug){setCompareNote('Compará componentes de la misma categoría.');return prev}if(prev.length>=3){setCompareNote('Podés comparar hasta tres productos.');return prev}setCompareNote('');return [...prev,p]});}
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get('category');if(value&&/^[a-z-]+$/.test(value))setCategory(value);},[]);
 const products=catalog?.products||[];
 const brands=useMemo(()=>[...new Set(products.map(p=>p.brand).filter((x):x is string=>!!x))].sort((a,b)=>a.localeCompare(b)),[products]);
 const categories=catalog?.categories||[];
 const visible=useMemo(()=>products.filter(p=>
  (category==='all'||p.category_slug===category)&&
  (brand==='all'||p.brand===brand)&&
  (!onlyStock||p.stock>0)&&
  `${p.name} ${p.brand||''} ${p.variant_name} ${p.category_name} ${p.sku}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))
 ).sort((a,b)=>sort==='priceAsc'?a.price_ars-b.price_ars:sort==='priceDesc'?b.price_ars-a.price_ars:sort==='az'?a.name.localeCompare(b.name):Number(b.is_featured)-Number(a.is_featured)||a.name.localeCompare(b.name)),[products,category,brand,query,sort,onlyStock]);
 function reset(){setQuery('');setCategory('all');setBrand('all');setSort('featured');setOnlyStock(false)}
 return <section id="catalogo" className="catalog-section shell catalog-standalone" aria-label="Catálogo de hardware">
  <div className="section-head"><div><span className="eyebrow"><span className="small-green"/> CURATED HARDWARE / FORGE LAB</span><h2>HARDWARE <span className="outlined-text">COLLECTION.</span></h2><p>Explorá el catálogo conectado a Neon y elegí las piezas de tu próxima máquina.</p></div><div className="section-count">{String(visible.length).padStart(2,'0')} <span>RESULTADOS</span></div></div>
  {catalog?.demo&&<div className="demo-banner"><Terminal size={17}/><span><strong>CATÁLOGO DEMO.</strong> Valores y stock ilustrativos, no ofertas comerciales. Se modifican desde <Link href="/admin">Administración</Link>.</span></div>}
  {error&&<div role="alert" className="notice caution catalog-error">Error al consultar Neon: {error}. Comprobá tu conexión desde /api/health.</div>}
  <div className="catalog-control-bar"><label className="catalog-search"><Search size={19}/><input type="search" ref={searchInput} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar placas, CPUs, memorias..." aria-label="Buscar productos"/><kbd>/</kbd></label>
   <div className="catalog-selects"><label><span>MARCA</span><select value={brand} onChange={e=>setBrand(e.target.value)}><option value="all">Todas</option>{brands.map(b=><option key={b}>{b}</option>)}</select><ChevronDown size={13}/></label>
    <label><span>ORDEN</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Destacados</option><option value="priceAsc">Menor precio</option><option value="priceDesc">Mayor precio</option><option value="az">Nombre A—Z</option></select><ChevronDown size={13}/></label>
   </div>
  </div>
  <div className="catalog-chips" role="group" aria-label="Filtrar por categoría"><button className={category==='all'?'active':''} onClick={()=>setCategory('all')}>TODO <span>{products.length}</span></button>{categories.map(c=><button key={c.id} className={category===c.slug?'active':''} onClick={()=>setCategory(c.slug)}>{c.name}<span>{products.filter(p=>p.category_slug===c.slug).length}</span></button>)}</div>
  <div className="catalog-filter-row"><label className="stock-toggle"><input type="checkbox" checked={onlyStock} onChange={e=>setOnlyStock(e.target.checked)}/><span/> SOLO CON STOCK</label><span><Filter size={14}/> {visible.length} artículos encontrados</span><button onClick={reset}><RotateCcw size={14}/> LIMPIAR FILTROS</button></div>
  {loading?<div className="loading-grid">{Array.from({length:8},(_,i)=><div key={i} className="skeleton-card"/>)}</div>:visible.length?<div className="product-grid">{visible.map((p,i)=><ProductCard key={p.variant_id} product={p} index={i} onCompare={toggleCompare} compared={comparison.some(x=>x.variant_id===p.variant_id)}/>)}</div>:<div className="empty-products"><SlidersHorizontal size={42}/><h3>No hay resultados</h3><p>Probá otra categoría o borrá algunos filtros.</p><button className="btn btn-outline" onClick={reset}>MOSTRAR TODO <ArrowRight size={16}/></button></div>}
  {(comparison.length>0||compareNote)&&<div className="compare-bar"><div><ArrowLeftRight size={19}/><strong>{comparison.length}/3 EN COMPARACIÓN</strong><span>{compareNote||comparison.map(p=>p.name).join(' · ')}</span></div><div><button type="button" onClick={()=>{setComparison([]);setCompareNote('');}}>LIMPIAR</button><button type="button" className="compare-open-btn" disabled={comparison.length<2} onClick={()=>setCompareOpen(true)}>COMPARAR PRODUCTOS <ArrowRight size={16}/></button></div></div>}
  {compareOpen&&<div className="compare-backdrop" role="presentation" onClick={()=>setCompareOpen(false)}><div className="compare-modal" role="dialog" aria-modal="true" aria-label="Comparación de hardware" onClick={e=>e.stopPropagation()}><div className="compare-modal-head"><div><span className="eyebrow">FORGE / HARDWARE LAB</span><h2>COMPARATIVA TÉCNICA.</h2></div><button onClick={()=>setCompareOpen(false)} aria-label="Cerrar comparativa"><X/></button></div><div className="compare-table-scroll"><table className="compare-table"><thead><tr><th>PARÁMETRO</th>{comparison.map(p=><th key={p.variant_id}>{p.name}</th>)}</tr></thead><tbody><tr><td>Precio ARS</td>{comparison.map(p=><td key={p.variant_id}>{pesos(p.price_ars)}</td>)}</tr><tr><td>Marca</td>{comparison.map(p=><td key={p.variant_id}>{p.brand||'—'}</td>)}</tr><tr><td>Variante</td>{comparison.map(p=><td key={p.variant_id}>{p.variant_name}</td>)}</tr><tr><td>Stock registrado</td>{comparison.map(p=><td key={p.variant_id}>{p.stock}</td>)}</tr>{[...new Set(comparison.flatMap(p=>Object.keys(p.specs||{})))].map(k=><tr key={k}><td>{k.replaceAll('_',' ')}</td>{comparison.map(p=><td key={p.variant_id}>{Array.isArray(p.specs[k])?(p.specs[k] as unknown[]).join(' · '):p.specs[k]===undefined?'—':String(p.specs[k])}</td>)}</tr>)}</tbody></table></div><p>Datos cargados en Neon. Las especificaciones DEMO son orientativas.</p></div></div>}
 </section>;
}
