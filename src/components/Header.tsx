'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowUpRight,Menu,ShoppingBag, X} from 'lucide-react';
import {useShop} from './StoreProvider';
import {useState} from 'react';
export default function Header(){
 const {count,setCartOpen}=useShop();const path=usePathname();const [menu,setMenu]=useState(false);
 const links=[['/','Descubrir'],['/hardware','Hardware'],['/builder','PC BUILDER'],['/admin','Admin']];
 return <header className="header"><div className="header-inner shell">
 <Link href="/" className="brand" onClick={()=>setMenu(false)}><span className="brand-symbol">F<span className="brand-spark">.</span></span><span>FORGE<span className="brand-sub">BUILD YOUR RIG</span></span></Link>
 <nav className={'nav-links '+(menu?'nav-mobile-open':'')}>
 {links.map(([href,label])=><Link onClick={()=>setMenu(false)} className={path===href?'nav-active':''} key={href} href={href}>{label}</Link>)}
 </nav>
 <div className="header-actions"><span className="desktop-only small-light">CRAFTED FOR PERFORMANCE <ArrowUpRight size={12}/></span><button className="cart-button" onClick={()=>setCartOpen(true)} aria-label={`Abrir carrito (${count})`}><ShoppingBag size={17}/><span>CARRITO</span><b>{count}</b></button><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Abrir menú">{menu?<X size={21}/>:<Menu size={21}/>}</button></div>
 </div></header>
}
