import type {Product,Slot} from './types';
export type CompatibilityIssue={level:'error'|'info';message:string};
const str=(v:unknown)=>typeof v==='string'?v:'';
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
export function checkCompatibility(selected:Partial<Record<Slot,Product>>):CompatibilityIssue[]{
  const issues:CompatibilityIssue[]=[];
  const {cpu,motherboard,ram,gpu,psu,case:computerCase,cooler}=selected;
  if(cpu&&motherboard&&str(cpu.specs.socket)&&str(motherboard.specs.socket)&&cpu.specs.socket!==motherboard.specs.socket)
    issues.push({level:'error',message:`Socket incompatible: ${cpu.specs.socket} vs ${motherboard.specs.socket}.`});
  if(ram&&motherboard&&str(ram.specs.memory_type)&&str(motherboard.specs.memory_type)&&ram.specs.memory_type!==motherboard.specs.memory_type)
    issues.push({level:'error',message:`Memoria incompatible: ${ram.specs.memory_type} vs ${motherboard.specs.memory_type}.`});
  if(gpu&&computerCase&&num(gpu.specs.length_mm)&&num(computerCase.specs.max_gpu_length_mm)&&num(gpu.specs.length_mm)>num(computerCase.specs.max_gpu_length_mm))
    issues.push({level:'error',message:`GPU de ${gpu.specs.length_mm} mm no entra en el gabinete (${computerCase.specs.max_gpu_length_mm} mm).`});
  if(motherboard&&computerCase&&Array.isArray(computerCase.specs.supported_form_factors)&&!computerCase.specs.supported_form_factors.includes(motherboard.specs.form_factor))
    issues.push({level:'error',message:`El gabinete no admite motherboards ${motherboard.specs.form_factor}.`});
  if(gpu&&psu&&num(gpu.specs.recommended_psu_watts)>num(psu.specs.wattage))
    issues.push({level:'error',message:`La GPU recomienda al menos ${gpu.specs.recommended_psu_watts}W y la fuente elegida tiene ${psu.specs.wattage}W.`});
  if(cpu&&cooler&&Array.isArray(cooler.specs.supported_sockets)&&!cooler.specs.supported_sockets.includes(cpu.specs.socket))
    issues.push({level:'error',message:`La refrigeración no soporta socket ${cpu.specs.socket}.`});
  if(computerCase&&cooler&&num(cooler.specs.height_mm)&&num(computerCase.specs.max_cooler_height_mm)&&num(cooler.specs.height_mm)>num(computerCase.specs.max_cooler_height_mm))
    issues.push({level:'error',message:`El cooler mide ${cooler.specs.height_mm} mm, supera el límite del gabinete.`});
  if(!cpu||!motherboard||!ram||!gpu||!psu||!computerCase)issues.push({level:'info',message:'Elegí gabinete, motherboard, procesador, gráfica, RAM y fuente para revisar el armado básico.'});
  if(!issues.some(i=>i.level==='error')&&cpu&&motherboard&&ram&&gpu&&psu&&computerCase)issues.push({level:'info',message:'Las reglas registradas no detectaron incompatibilidades. Verificá BIOS, conectores, dimensiones y consumo antes de comprar.'});
  return issues;
}
