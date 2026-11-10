import Link from 'next/link';
import {ArrowLeft,PackageSearch} from 'lucide-react';
export default function NotFound(){return <main className="notfound-page shell"><PackageSearch size={46}/><h1>PRODUCTO NO ENCONTRADO.</h1><p>Puede que el artículo ya no esté disponible o que la dirección haya cambiado.</p><Link href="/hardware" className="btn btn-primary"><ArrowLeft size={17}/> VOLVER AL CATÁLOGO</Link></main>}
