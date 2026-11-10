'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,FileDown,Printer,ShieldCheck} from 'lucide-react';
import {useShop} from './StoreProvider';
import {BUILD_SLOTS,SLOT_LABELS} from '@/lib/types';
import type {Slot} from '@/lib/types';
import {pesos} from '@/lib/format';
import {checkCompatibility} from '@/lib/compatibility';
export default function BuildQuote(){
 const {catalog,loading,error}=useShop();
 const [saved,setSaved]=useState<Partial<Record<Slot,string>>>({});
 const [date,setDate]=useState('');
 useEffect(()=>{setDate(new Date().toLocaleDateString('es-AR',{year:'numeric',month:'long',day:'numeric'}));try{const raw=sessionStorage.getItem('forge_quote_build');if(raw){const value=JSON.parse(raw);if(typeof value==='object'&&value)setSaved(value);}}catch{}},[]);
 const entries=useMemo(()=>BUILD_SLOTS.map(slot=>({slot,p:catalog?.products.find(p=>p.variant_id===saved[slot])})).filter(x=>!!x.p),[saved,catalog]);
 const chosen=useMemo(()=>Object.fromEntries(entries.map(({slot,p})=>[slot,p])) as Parameters<typeof checkCompatibility>[0],[entries]);
 const issues=checkCompatibility(chosen);
 const total=entries.reduce((n,{p})=>n+(p?.price_ars||0),0);
 return <main className="quote-page shell"><div className="quote-header"><div><span className="eyebrow">FORGE // BUILD YOUR RIG</span><h1>BUILD REPORT<span className="highlight">.</span></h1><span className="quote-small">Presupuesto orientativo generado el {date}</span></div><Link href="/builder" className="btn btn-outline"><ArrowLeft size={17}/> VOLVER AL BUILDER</Link></div>
 <div className="quote-title"><span className="eyebrow">CONFIGURACIÓN PERSONALIZADA</span><h2>EL HARDWARE DE TU PRÓXIMA PC.</h2><p className="quote-small">Este documento refleja los artículos registrados en FORGE. No reserva stock, no constituye una cotización vinculante ni confirma una compra.</p></div>
 {loading?<p>Cargando catálogo de Neon...</p>:error?<p className="notice caution">No se pudo consultar Neon: {error}</p>:!entries.length?<div className="empty-products">No hay un armado para mostrar. Volvé al configurador y seleccioná componentes.</div>:<><table className="quote-table"><thead><tr><th>COMPONENTE</th><th>PRODUCTO</th><th>PRECIO</th></tr></thead><tbody>{entries.map(({slot,p})=><tr key={slot}><td>{SLOT_LABELS[slot]}</td><td>{p!.name}<div className="quote-small">{p!.variant_name} · {p!.sku}</div></td><td>{pesos(p!.price_ars)}</td></tr>)}</tbody></table><div className="quote-total"><span>TOTAL DE REFERENCIA</span><strong>{pesos(total)}</strong></div><div className="quote-small">{issues.map((i,n)=><p key={n}>{i.level==='error'?'⚠':'•'} {i.message}</p>)}{entries.some(({p})=>p?.is_demo)&&<p>ATENCIÓN: contiene productos de demostración con precios y stock ilustrativos.</p>}</div></>}
 <div className="quote-actions"><button className="btn btn-primary" disabled={!entries.length} onClick={()=>window.print()}><FileDown size={18}/> GUARDAR COMO PDF / IMPRIMIR</button><Link href="/hardware" className="btn btn-outline"><Printer size={17}/> EXPLORAR HARDWARE</Link></div><p className="quote-small"><ShieldCheck size={14} style={{verticalAlign:'middle'}}/> Guardar como PDF utiliza la opción de impresión de tu navegador; no se envían datos a otros servicios.</p></main>
}
