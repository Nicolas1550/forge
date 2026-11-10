'use client';
import React,{createContext,useContext,useEffect,useMemo,useState,useCallback} from 'react';
import type {CatalogData,CartLine,Product} from '@/lib/types';

type ShopContext={
  catalog:CatalogData|null; loading:boolean;error:string|null; cart:CartLine[];cartOpen:boolean;setCartOpen:(v:boolean)=>void;
  add:(p:Product,qty?:number)=>void;setQty:(variantId:string,qty:number)=>void;clear:()=>void;
  count:number;total:number;getProduct:(variantId:string)=>Product|undefined;reload:()=>Promise<void>;
};
const Context=createContext<ShopContext|null>(null);
export const CART_STORAGE='forge_cart_v1';
export function StoreProvider({children}:{children:React.ReactNode}){
  const [catalog,setCatalog]=useState<CatalogData|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const [cart,setCart]=useState<CartLine[]>([]),[hydrated,setHydrated]=useState(false),[cartOpen,setCartOpen]=useState(false);
  const reload=useCallback(async()=>{
    setLoading(true);try{const r=await fetch('/api/catalog',{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Neon no responde.');
    setCatalog(data);setError(null);
    }catch(e){setError(e instanceof Error?e.message:'Error al cargar Neon.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{reload();try{const saved=JSON.parse(localStorage.getItem(CART_STORAGE)||'[]');if(Array.isArray(saved))setCart(saved.filter(x=>x&&typeof x.variantId==='string'&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=20).slice(0,40));}catch{}setHydrated(true);},[reload]);
  useEffect(()=>{if(hydrated)localStorage.setItem(CART_STORAGE,JSON.stringify(cart));},[hydrated,cart]);
  const productMap=useMemo(()=>new Map<string,Product>(catalog?.products.map(p=>[p.variant_id,p] as const)||[]),[catalog]);
  useEffect(()=>{if(!catalog)return;setCart(prev=>prev.filter(l=>{const p=productMap.get(l.variantId);return p&&p.stock>0}).map(l=>({...l,quantity:Math.min(l.quantity,20,productMap.get(l.variantId)!.stock)})));},[catalog,productMap]);
  const add=useCallback((p:Product,qty=1)=>{if(p.stock<=0)return;const safeQty=Math.max(1,Math.min(20,p.stock,Math.floor(qty)));setCart(prev=>{
    const old=prev.find(l=>l.variantId===p.variant_id);if(old)return prev.map(l=>l.variantId===p.variant_id?{...l,quantity:Math.min(20,p.stock,l.quantity+safeQty)}:l);
    return [...prev,{variantId:p.variant_id,quantity:safeQty}];
  });setCartOpen(true);},[]);
  const setQty=useCallback((id:string,qty:number)=>setCart(prev=>qty<=0?prev.filter(l=>l.variantId!==id):prev.map(l=>l.variantId===id?{...l,quantity:Math.min(20,productMap.get(id)?.stock||0,qty)}:l).filter(l=>l.quantity>0)),[productMap]);
  const getProduct=useCallback((id:string)=>productMap.get(id),[productMap]);
  const lines=cart.map(l=>({line:l,p:productMap.get(l.variantId)})).filter(l=>!!l.p);
  const count=lines.reduce((s,{line})=>s+line.quantity,0),total=lines.reduce((s,{line,p})=>s+line.quantity*(p?.price_ars||0),0);
  return <Context.Provider value={{catalog,loading,error,cart,cartOpen,setCartOpen,add,setQty,clear:()=>setCart([]),count,total,getProduct,reload}}>{children}</Context.Provider>;
}
export function useShop(){const x=useContext(Context);if(!x)throw new Error('StoreProvider faltante');return x;}
