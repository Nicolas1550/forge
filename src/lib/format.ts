/* Utilidad de formato compartida: segura para servidor y navegador. */
export const pesos=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
