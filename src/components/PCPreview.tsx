'use client';

type PreviewProps = {className?:string;status?:string};

/** Lightweight real screenshot of the same PC, shown before the WebGL model is ready. */
export default function PCPreview({className='',status='CARGANDO MODELO 3D'}:PreviewProps){
 return <div className={`forge-instant-preview ${className}`} aria-label="Vista previa de la PC gamer">
  <img src="/images/forge-signature-preview.webp" alt="PC gamer FORGE negra con ventiladores RGB, refrigeración líquida y lateral abierto" loading="eager" decoding="async" draggable={false}/>
  <div className="forge-preview-status"><span className="status-pulse"/> {status}</div>
 </div>;
}
