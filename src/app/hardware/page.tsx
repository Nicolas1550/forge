import Link from 'next/link';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';
import type {Metadata} from 'next';
import CatalogBrowser from '@/components/CatalogBrowser';
export const metadata:Metadata={title:'Hardware | FORGE — Catálogo de componentes',description:'Explorá componentes gaming, filtrá por categoría y armá tu propia PC interactiva en 3D.'};
export default function HardwarePage(){return <main className="hardware-page"><div className="hardware-top shell"><Link href="/" className="back-link"><ArrowLeft size={15}/> VOLVER AL INICIO</Link><span>FORGE / CURATED HARDWARE</span><Link href="/builder" className="back-link">CONSTRUIR MI PC <ArrowUpRight size={15}/></Link></div><CatalogBrowser/></main>}
