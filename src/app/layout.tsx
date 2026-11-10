import type {Metadata} from 'next';
import './globals.css';
import {StoreProvider} from '@/components/StoreProvider';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
export const metadata:Metadata={
 metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'http://localhost:3000')),
 title:{default:'FORGE | Build Your Rig — 3D Gaming Commerce',template:'%s'},
 description:'FORGE: e-commerce Full Stack de hardware y configurador de PC con montaje 3D, carrito, Neon PostgreSQL y pedidos por WhatsApp.',
 applicationName:'FORGE',manifest:'/manifest.webmanifest',
 openGraph:{title:'FORGE — BUILD WITHOUT LIMITS',description:'Diseñá tu PC. Explorá el montaje 3D. Elegí cada componente.',type:'website',locale:'es_AR',images:[{url:'/og-forge.jpg',width:1200,height:630,alt:'FORGE: Build Without Limits — Interactive PC Builder'}]},
 twitter:{card:'summary_large_image',title:'FORGE — Build Your Rig',images:['/og-forge.jpg']},
 icons:{icon:'/icon.svg'},robots:{index:true,follow:true}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="es"><head><link rel="preload" as="image" href="/images/forge-signature-preview.webp" fetchPriority="high"/></head><body><StoreProvider><Header/>{children}<CartDrawer/></StoreProvider></body></html>;
}
