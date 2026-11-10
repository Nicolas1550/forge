'use client';
import React,{useState,useEffect} from 'react';
import {ArrowRight,Check,ExternalLink,Minus,Plus,ShoppingBag,X,LoaderCircle,AlertCircle,MessageCircle} from 'lucide-react';
import {useShop} from './StoreProvider';
import type {CheckoutResult} from '@/lib/types';
import {pesos} from '@/lib/format';

// Número público de consultas FORGE. No es una credencial.
const FORGE_WHATSAPP = '5492964541181';
const whatsappLink = (message: string) => `https://wa.me/${FORGE_WHATSAPP}?text=${encodeURIComponent(message)}`;
export default function CartDrawer(){
 const {cart,cartOpen,setCartOpen,getProduct,setQty,clear,total,count,catalog}=useShop();
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[notes,setNotes]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<CheckoutResult|null>(null);
 const [showPreview,setShowPreview]=useState(false),[submittedMessage,setSubmittedMessage]=useState('');
 useEffect(()=>{if(!cartOpen)return;const handle=(e:KeyboardEvent)=>{if(e.key==='Escape')setCartOpen(false)};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);},[cartOpen,setCartOpen]);
 async function checkout(e:React.FormEvent){e.preventDefault();if(!cart.length||busy)return;setBusy(true);setError('');
  try{
    const saved=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart})});
    const savedData=await saved.json();if(!saved.ok)throw new Error(savedData.error||'No se pudo guardar el carrito.');
    let build;try{const raw=sessionStorage.getItem('forge_pending_build');if(raw)build=JSON.parse(raw);}catch{}
    const order=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerName:name,customerWhatsapp:phone,customerEmail:email,notes,items:cart,build,cartId:savedData.cartId})});
    const orderData=await order.json();if(!order.ok)throw new Error(orderData.error||'Error al crear pedido.');
    setSubmittedMessage(`Hola, quiero consultar por mi pedido FORGE #${orderData.orderNumber}.\n\n${previewText}`);
    setResult(orderData);sessionStorage.removeItem('forge_pending_build');clear();
  }catch(e){setError(e instanceof Error?e.message:'Ocurrió un error.');}finally{setBusy(false);}
 }
 const entries=cart.map(line=>({line,product:getProduct(line.variantId)})).filter(x=>x.product);
 const previewText=[
   'Hola, quiero consultar por estos productos de FORGE:',
   '',
   ...entries.map(({line,product:p})=>`• ${p!.name} (${p!.variant_name}) x${line.quantity} — ${pesos(Number(p!.price_ars)*line.quantity)}`),
   '',
   `Total estimado: ${pesos(total)}`,
   name.trim()?`Nombre: ${name.trim()}`:'',
   notes.trim()?`Consulta: ${notes.trim()}`:'',
   '',
   'Los precios y la disponibilidad deben confirmarse. ¿Cómo podemos continuar?'
 ].filter((line,index,array)=>line!==''||array[index-1]!=='').join('\n');
 const previewUrl=whatsappLink(previewText);
 const resultWhatsappUrl=result?(result.whatsappUrl||whatsappLink(submittedMessage)):null;
 return <><div className={'drawer-backdrop '+(cartOpen?'visible':'')} onClick={()=>setCartOpen(false)} aria-hidden="true"/>
 <aside className={'drawer '+(cartOpen?'drawer-open':'')} aria-hidden={!cartOpen} role="dialog" aria-modal={cartOpen} aria-label="Tu carrito">
  <div className="drawer-head"><div><span className="eyebrow">TU SELECCIÓN / 01</span><h2>Mi carrito <span className="highlight">({count})</span></h2></div><button className="icon-btn" onClick={()=>setCartOpen(false)} aria-label="Cerrar carrito"><X/></button></div>
  <div className="drawer-scroll">
  {result?<section className="order-success"><div className="success-ring"><Check size={32}/></div><h3>Solicitud registrada</h3><p>Tu pedido <b>#{result.orderNumber}</b> quedó guardado en Neon. Todavía no implica una compra confirmada.</p><p className="success-total">{pesos(result.totalArs)}</p>
    {resultWhatsappUrl?<a className="btn btn-primary full" href={resultWhatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> ABRIR WHATSAPP <ExternalLink size={15}/></a>:
    <div className="notice caution"><AlertCircle size={18}/><span>No se pudo preparar el enlace de WhatsApp.</span></div>}
    <button className="btn btn-outline full" onClick={()=>{setResult(null);setCartOpen(false);}}>CONTINUAR EXPLORANDO</button>
   </section>:
  <>{entries.length===0?<div className="empty-cart"><ShoppingBag size={48}/><h3>Tu próxima PC empieza acá.</h3><p>Explorá el hardware o diseñá tu propio setup.</p><button className="btn btn-primary" onClick={()=>setCartOpen(false)}>EXPLORAR TIENDA <ArrowRight size={16}/></button></div>:
   <><div className="cart-list"><div className="cart-list-top"><span>{entries.length} PRODUCTOS EN TU SELECCIÓN</span><button type="button" onClick={clear}>VACIAR CARRITO</button></div>{entries.map(({line,product:p})=><div key={line.variantId} className="cart-item"><div className="cart-thumb"><img src={p!.variant_image_url||p!.image_url||`/hardware/${p!.category_slug}.svg`} alt=""/></div><div className="cart-item-details"><span className="eyebrow">{p!.brand||'FORGE'}</span><strong>{p!.name}</strong><span className="price-small">{pesos(p!.price_ars)}</span><div className="qty-row"><button onClick={()=>setQty(line.variantId,line.quantity-1)} aria-label="Quitar uno"><Minus size={13}/></button><span>{line.quantity}</span><button onClick={()=>setQty(line.variantId,Math.min(p!.stock,line.quantity+1))} aria-label="Agregar uno" disabled={line.quantity>=p!.stock}><Plus size={13}/></button></div></div></div>)}</div>
   <form id="forge-checkout" onSubmit={checkout} className="checkout-form"><span className="eyebrow">SOLICITAR COMPRA</span><h3>Finalizar consulta</h3><label>Tu nombre <input required minLength={2} maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre y apellido"/></label><label>Tu WhatsApp <span className="optional">(opcional)</span><input maxLength={35} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Número de contacto"/></label><label>Correo <span className="optional">(opcional)</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@dominio.com"/></label><label>Notas <span className="optional">(opcional)</span><textarea maxLength={700} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Alguna preferencia o consulta" rows={2}/></label>
   {error&&<div className="notice caution"><AlertCircle size={16}/>{error}</div>}
   <p className="disclaimer">El envío por WhatsApp es una consulta: el precio y la disponibilidad deben ser confirmados. Los productos DEMO no representan una oferta real.</p>
   </form></> }</>}
  </div>
  {!result&&entries.length>0&&<div className="drawer-footer"><div className="total-row"><span>SUBTOTAL ESTIMADO</span><strong>{pesos(total)}</strong></div>
    <button type="button" className="btn btn-outline full" aria-expanded={showPreview} onClick={()=>setShowPreview(v=>!v)} style={{marginBottom:12}}>
     <MessageCircle size={16}/> {showPreview?'OCULTAR MENSAJE':'PREVISUALIZAR WHATSAPP (SIN COMPRAR)'}
    </button>
    {showPreview&&<section aria-label="Vista previa del mensaje de WhatsApp" style={{marginBottom:14,border:'1px solid #375943',background:'#152820',padding:12}}>
      <div style={{font:'700 10px var(--font-mono)',color:'#c9ff81',letterSpacing:'.08em',marginBottom:8}}>MENSAJE PREPARADO · SIN REGISTRO EN NEON</div>
      <div style={{background:'#243c31',color:'#e8f5e9',padding:'12px 13px',borderRadius:'12px 12px 3px 12px',fontSize:12,lineHeight:1.65,whiteSpace:'pre-wrap',maxHeight:150,overflowY:'auto',overflowWrap:'anywhere'}}>{previewText}</div>
      <a className="btn btn-primary full" href={previewUrl} target="_blank" rel="noopener noreferrer" style={{marginTop:10}}><MessageCircle size={16}/> ABRIR CHAT EN WHATSAPP <ExternalLink size={14}/></a>
      <p style={{fontSize:10,lineHeight:1.5,color:'#afc2b5',margin:'9px 0 0'}}>Es una demostración: no se guarda un pedido ni se envía un mensaje automáticamente. WhatsApp permite revisar el texto antes de enviarlo.</p>
    </section>}
    <button type="submit" form="forge-checkout" disabled={busy||!catalog} className="btn btn-primary full">{busy?<><LoaderCircle size={17} className="spin"/>GUARDANDO EN NEON</>:<>REGISTRAR PEDIDO <ArrowRight size={17}/></>}</button><div className="footer-note"><Check size={14}/> Solicitud registrada en PostgreSQL</div></div>}
 </aside></>
}
