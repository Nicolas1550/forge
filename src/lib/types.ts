export type Slot = 'cpu' | 'motherboard' | 'gpu' | 'ram' | 'storage' | 'psu' | 'case' | 'cooler' | 'fans';
export type Category = {id:string; slug:string;name:string;description:string|null; sort_order:number};
export type Product = {
  id:string;slug:string;name:string;brand:string|null;description:string|null;image_url:string|null;
  category_id:string;category_slug:string;category_name:string;is_featured:boolean;is_active:boolean;
  variant_id:string;sku:string;variant_name:string;price_ars:number;stock:number;attributes:Record<string,unknown>;
  specs:Record<string,unknown>;variant_image_url:string|null;model_glb_url:string|null;is_demo:boolean;
};
export type CartLine = {variantId:string;quantity:number};
export type CatalogData = {categories:Category[];products:Product[];whatsappConfigured:boolean;demo:boolean};
export type CheckoutResult={orderId:string;orderNumber:number;totalArs:number;whatsappUrl:string|null};
export const SLOT_LABELS:Record<Slot,string> = {
  cpu:'Procesador', motherboard:'Placa madre',gpu:'Tarjeta gráfica',ram:'Memoria RAM',storage:'Almacenamiento',psu:'Fuente',case:'Gabinete',cooler:'Refrigeración',fans:'Ventiladores'
};
export const BUILD_SLOTS:Slot[] = ['case','motherboard','cpu','gpu','ram','cooler','psu','storage','fans'];
