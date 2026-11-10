import type {Metadata} from 'next';
import BuildQuote from '@/components/BuildQuote';
export const metadata:Metadata={title:'Resumen de configuración | FORGE',robots:{index:false,follow:false}};
export default function QuotePage(){return <BuildQuote/>}
