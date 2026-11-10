'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useMemo,useState,useEffect,useRef} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,ChevronDown,ChevronRight,CircleAlert,Focus,Maximize,Minus,Plus,RotateCcw,ShieldCheck,ShoppingBag,SlidersHorizontal, X, Zap} from 'lucide-react';
import type {Product,Slot} from '@/lib/types';
import {BUILD_SLOTS,SLOT_LABELS} from '@/lib/types';
import {checkCompatibility} from '@/lib/compatibility';
import {pesos} from '@/lib/format';
import {useShop} from './StoreProvider';
import PCPreview from './PCPreview';
const PCScene=dynamic(()=>import('./PCScene'),{ssr:false,loading:()=> <PCPreview className="forge-preview-boot" status="INICIANDO VISOR 3D"/>});
const RGB=['#d5ff6a','#76dfff','#b49bff','#ff9d63','#ff6fb1','#f6f8fd'];
export default function Builder(){
 const {catalog,loading,error,add,setCartOpen}=useShop();
 const [selected,setSelected]=useState<Partial<Record<Slot,string>>>({});
 const [slot,setSlot]=useState<Slot>('case'),[accent,setAccent]=useState('#d5ff6a'),[spin,setSpin]=useState(false);
 const [changeRequest,setChangeRequest]=useState<{slot:Slot;revision:number}>({slot:'case',revision:0});
 const [shareMessage,setShareMessage]=useState('');const [hasSavedBuild,setHasSavedBuild]=useState(false);const restored=useRef(false);
 useEffect(()=>{setHasSavedBuild(!!localStorage.getItem('forge_saved_build_v1'));},[]);
 const products=catalog?.products||[];
 const byId=useMemo(()=>new Map<string,Product>(products.map(p=>[p.variant_id,p] as const)),[products]);
 const chosen=useMemo(()=>Object.fromEntries(BUILD_SLOTS.filter(s=>selected[s]&&byId.has(selected[s]!)).map(s=>[s,byId.get(selected[s]!)!])) as Partial<Record<Slot,Product>>,[selected,byId]);
 const issues=useMemo(()=>checkCompatibility(chosen),[chosen]);const incompatible=issues.some(x=>x.level==='error');
 const total=Object.values(chosen).reduce((s,p)=>s+(p?.price_ars||0),0);
 const installed=useMemo(()=>Object.fromEntries(BUILD_SLOTS.map(s=>[s,Boolean(chosen[s])])) as Partial<Record<Slot,boolean>>,[chosen]);
 const slotProducts=products.filter(p=>p.category_slug===slot);
 const counter=Object.keys(chosen).length;
 useEffect(()=>{if(!catalog||restored.current)return;restored.current=true;const encoded=new URLSearchParams(window.location.search).get('build');if(!encoded)return;try{const data=JSON.parse(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')));if(typeof data!=='object'||!data)return;const ids=new Set(products.map(p=>p.variant_id));const valid:Partial<Record<Slot,string>>={};for(const key of BUILD_SLOTS){if(typeof data[key]==='string'&&ids.has(data[key]))valid[key]=data[key];}setSelected(valid);setShareMessage('Configuración compartida cargada.');}catch{setShareMessage('El enlace de configuración no es válido.');}},[catalog,products]);
 function saveBuild(){localStorage.setItem('forge_saved_build_v1',JSON.stringify(selected));setHasSavedBuild(true);setShareMessage('Armado guardado en este navegador.');}
 function loadBuild(){try{const raw=localStorage.getItem('forge_saved_build_v1');if(!raw)return;const parsed=JSON.parse(raw);const ids=new Set(products.map(p=>p.variant_id));const valid:Partial<Record<Slot,string>>={};for(const key of BUILD_SLOTS){if(typeof parsed?.[key]==='string'&&ids.has(parsed[key]))valid[key]=parsed[key];}setSelected(valid);setSlot('case');setShareMessage('Armado guardado restaurado.');}catch{setShareMessage('No se pudo recuperar el armado guardado.');}}
 async function shareBuild(){if(counter===0){setShareMessage('Seleccioná una pieza antes de compartir.');return;}const encoded=btoa(JSON.stringify(selected)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const url=new URL('/builder',window.location.origin);url.searchParams.set('build',encoded);try{await navigator.clipboard.writeText(url.toString());setShareMessage('Enlace copiado. Otra persona puede abrir esta configuración.');}catch{window.prompt('Copiá el enlace de tu armado:',url.toString());setShareMessage('Enlace preparado.');}}
 function openQuote(){sessionStorage.setItem('forge_quote_build',JSON.stringify(selected));window.location.href='/quote';}
 function addBuild(){if(incompatible||!counter)return;
   const slots:Record<string,string>={};for(const s of BUILD_SLOTS){if(chosen[s]){slots[s]=chosen[s]!.variant_id;add(chosen[s]!);}}
   sessionStorage.setItem('forge_pending_build',JSON.stringify({name:'Mi PC personalizada',slots}));setCartOpen(true);
 }
 return <main className="builder-page"><div className="builder-top shell"><Link href="/" className="back-link"><ArrowLeft size={16}/> VOLVER A LA TIENDA</Link><span>FORGE CONFIGURATOR / SIGNATURE EDITION</span><div className="builder-progress">{counter}/9 PIEZAS</div></div>
 <div className="builder-layout shell"><aside className="builder-sidebar"><div className="builder-sidebar-head"><span className="eyebrow">01 — COMPONENT SELECTION</span><h1>BUILD <span>YOUR</span><br/>MACHINE.</h1><p>Elegí los componentes. Elegí hardware para tu PC. El visor MODULAR incorpora GPU, RAM, motherboard, CPU, fuente, almacenamiento, radiador, bomba y ventiladores, con zoom cinematográfico. Los modelos específicos de cada producto todavía no están disponibles.</p></div>
 <div className="build-slots">{BUILD_SLOTS.map((s,i)=><button key={s} className={'build-slot '+(slot===s?'slot-active':'')} onClick={()=>setSlot(s)}><span className="slot-count">{String(i+1).padStart(2,'0')}</span><span className="slot-name"><strong>{SLOT_LABELS[s]}</strong><small>{chosen[s]?chosen[s]!.name:'SIN SELECCIONAR'}</small></span>{chosen[s]?<Check size={17} className="slot-done"/>:<ChevronRight size={17}/>}</button>)}</div>
 </aside>
 <div className="builder-scene"><div className="scene-corner scene-tl">INTERACTIVE ASSEMBLY <span>LIVE ENGINE</span></div><PCScene className="builder-canvas" installed={installed} selectedVariants={selected} focusSlot={slot} changeRequest={changeRequest} accent={accent} autoRotate={spin}/><div className="scene-corner scene-bl">MOUSE: ROTAR / RUEDA: ZOOM</div><div className="scene-tools"><button onClick={()=>setSpin(!spin)} title={spin?'Detener giro':'Activar giro'}><RotateCcw size={16}/>{spin?'AUTO ON':'AUTO OFF'}</button><div className="rgb-options">{RGB.map(c=><button key={c} style={{background:c}} aria-label={`RGB ${c}`} onClick={()=>setAccent(c)} className={accent===c?'rgb-active':''}/>)}</div></div><div className="build-pill"><span className="status-pulse"/> MONTAJE REALISTA MODULAR · PIEZAS DE REFERENCIA</div></div>
 <aside className="parts-panel"><div className="parts-head"><span className="eyebrow">02 — HARDWARE OPTIONS</span><h2>{SLOT_LABELS[slot]}</h2><p>Seleccioná una opción para instalarla en tu PC.</p></div>
 <div className="part-options">{loading?<div className="panel-message">Cargando productos desde Neon...</div>:error?<div className="notice caution">{error}</div>:slotProducts.length===0?<div className="panel-message">No hay productos disponibles en esta categoría. Cargalos desde Admin.</div>:slotProducts.map(p=><button key={p.variant_id} className={'part-option '+(selected[slot]===p.variant_id?'part-option-active':'')} disabled={p.stock===0} onClick={()=>{if(selected[slot]===p.variant_id)return;setSelected(prev=>({...prev,[slot]:p.variant_id}));setChangeRequest(prev=>({slot,revision:prev.revision+1}));}}><div className="part-img"><img src={p.variant_image_url||p.image_url||`/hardware/${p.category_slug}.svg`} alt=""/></div><div><span className="part-brand">{p.brand||'FORGE'} / {p.is_demo?'DEMO':'EN STOCK'}</span><strong>{p.name}</strong><span className="part-price">{pesos(p.price_ars)}</span></div><span className="part-check">{selected[slot]===p.variant_id?<Check size={16}/>:<Plus size={16}/>}</span></button>)}</div>
 {chosen[slot]&&<button className="remove-part" onClick={()=>setSelected(prev=>({...prev,[slot]:undefined}))}><X size={14}/> QUITAR {SLOT_LABELS[slot].toUpperCase()}</button>}
 <div className="compat-box"><h4><ShieldCheck size={18}/> COMPATIBILIDAD</h4>{issues.map((i,n)=><p key={n} className={'compat-'+i.level}>{i.level==='error'?<CircleAlert size={15}/>:<Check size={15}/>} {i.message}</p>)}</div>
 <div className="builder-summary"><div><span>PRESUPUESTO ESTIMADO</span><strong>{pesos(total)}</strong></div><div className="builder-save-row"><button type="button" onClick={saveBuild} disabled={!counter}>GUARDAR EN ESTE DISPOSITIVO</button><button type="button" onClick={shareBuild} disabled={!counter}>COMPARTIR ENLACE</button>{hasSavedBuild&&<button type="button" onClick={loadBuild}>RECUPERAR</button>}<button type="button" onClick={openQuote} disabled={!counter}>PRESUPUESTO PDF</button></div>{shareMessage&&<div className="builder-share-message" role="status">{shareMessage}</div>}<button onClick={addBuild} className="btn btn-primary full" disabled={counter===0||incompatible||!catalog}><ShoppingBag size={17}/> AGREGAR ARMADO AL CARRITO <ArrowUpRight size={16}/></button><small>Precios DEMO ilustrativos. Compatibilidad orientativa: verificá especificaciones reales.</small></div>
 </aside></div><div className="forge-credit-builder shell">Modelo realista basado en <a href="https://sketchfab.com/3d-models/custom-gaming-pc-1a24273417534f69afa0f7c62b643ffc" target="_blank" rel="noopener noreferrer">Custom Gaming PC de Yolala1232</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Componentes de referencia extraídos del modelo original; los GLB todavía no representan las variantes exactas elegidas.</div>
 </main>
}
