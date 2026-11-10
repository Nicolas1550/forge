'use client';

import {Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {ContactShadows,OrbitControls,useGLTF} from '@react-three/drei';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import type {Slot} from '@/lib/types';
import cameraSpec from '@/data/forge_camera_targets.json';
import mountSpec from '@/data/forge_mounting_points.json';
import PCPreview from './PCPreview';

export type PCSceneProps={
 installed?:Partial<Record<Slot,boolean>>;
 selectedVariants?:Partial<Record<Slot,string>>;
 accent?:string;
 autoRotate?:boolean;
 interactive?:boolean;
 className?:string;
 focusSlot?:Slot;
 changeRequest?:{slot:Slot;revision:number};
};
type PartKey='motherboard'|'cpu'|'gpu'|'ram'|'storage'|'psu'|'radiator'|'aio_pump'|'aio_hoses'|'fans';
type FocusKey=keyof typeof cameraSpec.targets;
type GlassMode='closed'|'door'|'detached';
const BASE='/models/forge/modular/';
const PATHS={base:BASE+'base_static.glb',glass:BASE+'glass_panel.glb',motherboard:BASE+'motherboard.glb',cpu:BASE+'cpu.glb',gpu:BASE+'gpu.glb',ram:BASE+'ram.glb',storage:BASE+'storage.glb',psu:BASE+'psu.glb',radiator:BASE+'radiator.glb',aio_pump:BASE+'aio_pump.glb',aio_hoses:BASE+'aio_hoses.glb',fans:BASE+'fans.glb'} as const;
const PARTS:PartKey[]=['motherboard','cpu','gpu','ram','storage','psu','radiator','aio_pump','aio_hoses','fans'];
function slotFocus(slot?:Slot):FocusKey{
 if(slot==='cooler')return 'aio_pump';
 if(slot==='case'||!slot)return 'overview';
 return slot in cameraSpec.targets ? slot as FocusKey : 'overview';
}
function slotForPart(part:PartKey):Slot{
 return part==='radiator'||part==='aio_pump'||part==='aio_hoses'?'cooler':part;
}
function Environment(){
 const {gl,scene}=useThree();
 useEffect(()=>{
  const generator=new THREE.PMREMGenerator(gl);
  const room=new RoomEnvironment();
  const env=generator.fromScene(room,0.03);
  const previous=scene.environment;
  scene.environment=env.texture;
  scene.environmentIntensity=.95;
  return ()=>{scene.environment=previous;env.dispose();room.dispose();generator.dispose();};
 },[gl,scene]);
 return null;
}

/**
 * Every GLB was exported from the same world origin. Its root stays unmodified.
 * The wrapper moves to a staging location, then returns to (0,0,0).
 * Cooler is split into radiator -> pump -> hoses, each with a short stagger.
 */
function PartModel({part,installed,exploded,replay}:{part:PartKey;installed:boolean;exploded:boolean;replay:number}){
 const {scene}=useGLTF(PATHS[part]);
 const object=useMemo(()=>scene.clone(true),[scene]);
 const group=useRef<THREE.Group>(null);
 const initialized=useRef(false);
 const stage=mountSpec.parts[part].staging_offset_gltf as number[];
 const explodedOffset=useMemo(()=>{
  const v=stage.slice();
  v[0]*=1.25;v[1]*=1.25;v[2]*=1.25;
  return new THREE.Vector3(v[0],v[1],v[2]);
 },[stage[0],stage[1],stage[2]]);
 const staging=useMemo(()=>new THREE.Vector3(stage[0],stage[1],stage[2]),[stage[0],stage[1],stage[2]]);
 const anim=useRef({elapsed:0,delay:0,active:false,hiding:false});
 const stagger=part==='radiator'?0:part==='aio_pump'?.42:part==='aio_hoses'?.78:0;
 useEffect(()=>{
  const g=group.current;
  if(!g)return;
  if(!initialized.current){
   initialized.current=true;
   g.position.copy(installed?new THREE.Vector3():staging);
   g.visible=installed;
   return;
  }
  if(installed){
   if(!exploded){g.position.copy(staging);} // show the part arriving from its mounting path
   g.visible=true;
   anim.current={elapsed:0,delay:stagger,active:true,hiding:false};
  }else{
   anim.current={elapsed:0,delay:0,active:true,hiding:true};
  }
 },[installed,replay]);
 useFrame((_,delta)=>{
  const g=group.current;
  if(!g)return;
  const a=anim.current;
  if(a.active){a.elapsed+=Math.min(delta,.1);}
  const goal=exploded?explodedOffset:(installed?new THREE.Vector3():staging);
  const paused=a.active&&a.elapsed<a.delay&&!exploded&&installed;
  if(!paused){g.position.lerp(goal,1-Math.exp(-delta*4.7));}
  if(a.active&&!paused&&g.position.distanceTo(goal)<.018){
   a.active=false;
   if(a.hiding&&!installed&&!exploded)g.visible=false;
  }
  if(exploded){g.visible=installed;}
  if(!exploded&&!installed&&!a.active)g.visible=false;
 });
 return <group ref={group}><primitive object={object}/></group>;
}

/** Genuine hinge transform; NOT translating the pane straight back. */
function GlassModel({mode}:{mode:GlassMode}){
 const {scene}=useGLTF(PATHS.glass);
 const object=useMemo(()=>scene.clone(true),[scene]);
 const hinge=mountSpec.parts.glass.pivot_gltf as number[];
 const door=mountSpec.parts.glass.modes.door.rotation_y_degrees*Math.PI/180;
 const detached=mountSpec.parts.glass.modes.detached.translation_gltf as number[];
 const pivot=useRef<THREE.Group>(null);
 useFrame((_,delta)=>{
  const g=pivot.current;if(!g)return;
  const rate=1-Math.exp(-delta*3.6);
  const goalAngle=mode==='door'?door:0;
  g.rotation.y=THREE.MathUtils.lerp(g.rotation.y,goalAngle,rate);
  const move=mode==='detached'?detached:[0,0,0];
  g.position.lerp(new THREE.Vector3(hinge[0]+move[0],hinge[1]+move[1],hinge[2]+move[2]),rate);
 });
 return <group ref={pivot} position={[hinge[0],hinge[1],hinge[2]]}>
  <group position={[-hinge[0],-hinge[1],-hinge[2]]}><primitive object={object}/></group>
 </group>;
}

function CameraDirector({focus,scale,offset,autoRotate,interactive,focusRevision}:{focus:FocusKey;scale:number;offset:THREE.Vector3;autoRotate:boolean;interactive:boolean;focusRevision:number}){
 const {camera}=useThree();
 const controls=useRef<React.ElementRef<typeof OrbitControls>>(null);
 const flight=useRef<{time:number;duration:number;fromPosition:THREE.Vector3;toPosition:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3}|null>(null);
 useEffect(()=>{
  const spec=cameraSpec.targets[focus];
  const destPosition=focus==='overview'?new THREE.Vector3(-5.4,2.25,5.9):new THREE.Vector3(spec.position[0],spec.position[1],spec.position[2]).multiplyScalar(scale).add(offset);
  const destTarget=focus==='overview'?new THREE.Vector3():new THREE.Vector3(spec.target[0],spec.target[1],spec.target[2]).multiplyScalar(scale).add(offset);
  flight.current={time:0,duration:spec.duration_seconds??1.2,fromPosition:camera.position.clone(),toPosition:destPosition,fromTarget:controls.current?.target.clone()??new THREE.Vector3(),toTarget:destTarget};
 },[camera,focus,scale,offset,focusRevision]);
 useFrame((_,delta)=>{
  const active=flight.current;
  if(!active||!controls.current)return;
  active.time=Math.min(1,active.time+delta/active.duration);
  const t=active.time<.5?4*active.time**3:1-Math.pow(-2*active.time+2,3)/2;
  camera.position.copy(active.fromPosition).lerp(active.toPosition,t);
  controls.current.target.copy(active.fromTarget).lerp(active.toTarget,t);
  controls.current.update();
  if(active.time>=1)flight.current=null;
 });
 return <OrbitControls ref={controls} enablePan={false} enableRotate={interactive} enableZoom={interactive}
  enableDamping dampingFactor={.075} autoRotate={autoRotate&&focus==='overview'} autoRotateSpeed={.48}
  minDistance={.65} maxDistance={11} minPolarAngle={.12} maxPolarAngle={Math.PI/2.01}
  target={[0,0,0]}/>;
}
function Podium({accent}:{accent:string}){
 return <group>
  <mesh position={[0,-2.00,0]} receiveShadow><cylinderGeometry args={[2.33,2.42,.16,80]}/><meshStandardMaterial color="#10151b" metalness={.82} roughness={.28}/></mesh>
  <mesh position={[0,-1.91,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.25,2.29,96]}/><meshBasicMaterial color={accent} toneMapped={false}/></mesh>
  <mesh position={[0,-1.84,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.88,1.895,96]}/><meshBasicMaterial color="#53606a" transparent opacity={.5}/></mesh>
 </group>;
}
function ModularAssembly({installed,glassMode,exploded,onReady,focus,focusRevision,autoRotate,interactive,changeRequest}:{installed?:Partial<Record<Slot,boolean>>;glassMode:GlassMode;exploded:boolean;onReady:()=>void;focus:FocusKey;focusRevision:number;autoRotate:boolean;interactive:boolean;changeRequest?:{slot:Slot;revision:number}}){
 const baseGLTF=useGLTF(PATHS.base);
 const chassis=useMemo(()=>baseGLTF.scene.clone(true),[baseGLTF.scene]);
 const {offset,scale}=useMemo(()=>{
  const bounds=new THREE.Box3().setFromObject(chassis);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const factor=3.65/Math.max(size.x,size.y,size.z);
  return {scale:factor,offset:center.multiplyScalar(-factor)};
 },[chassis]);
 const frame=useRef(0);
 useFrame(()=>{if(frame.current<3&&++frame.current===3)onReady();});
 // By default the homepage shows a complete PC. In /builder we only install selected slots.
 const partInstalled=(part:PartKey)=>installed===undefined?true:Boolean(installed[slotForPart(part)]);
 const partRevision=(part:PartKey)=>slotForPart(part)===changeRequest?.slot ? changeRequest.revision : 0;
 return <>
  <group position={offset} scale={scale}>
   <primitive object={chassis}/>
   {PARTS.map(part=><PartModel key={part} part={part} installed={partInstalled(part)} exploded={exploded} replay={partRevision(part)}/>)}
   <GlassModel mode={exploded?'detached':glassMode}/>
  </group>
  <CameraDirector focus={focus} focusRevision={focusRevision} scale={scale} offset={offset} autoRotate={autoRotate} interactive={interactive}/>
 </>;
}
function ForgeCanvas({installed,accent,glassMode,exploded,autoRotate,interactive,onReady,focus,focusRevision,changeRequest}:{installed?:Partial<Record<Slot,boolean>>;accent:string;glassMode:GlassMode;exploded:boolean;autoRotate:boolean;interactive:boolean;onReady:()=>void;focus:FocusKey;focusRevision:number;changeRequest?:{slot:Slot;revision:number}}){
 return <Canvas camera={{position:[-5.4,2.25,5.9],fov:34,near:.1,far:100}}
  dpr={[1,1.5]} shadows gl={{antialias:true,alpha:true,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping}}
  onCreated={({gl})=>{gl.toneMappingExposure=1.25;}}>
  <Environment/>
  <ambientLight intensity={1.18}/>
  <hemisphereLight args={['#eaf6ff','#1a2730',1.55]}/>
  <directionalLight position={[-5,7,7]} intensity={4.2} color="#ecf6ff" castShadow shadow-mapSize={[1024,1024]}/>
  <directionalLight position={[5,4,-5]} intensity={2.2} color="#9bd5ff"/>
  <pointLight position={[-3,1.2,4]} color={accent} intensity={18} distance={9}/>
  <pointLight position={[3,-.2,-4]} color="#5d90fc" intensity={14} distance={9}/>
  <Suspense fallback={null}><ModularAssembly installed={installed} glassMode={glassMode} exploded={exploded} onReady={onReady} focus={focus} focusRevision={focusRevision} autoRotate={autoRotate} interactive={interactive} changeRequest={changeRequest}/></Suspense>
  <Podium accent={accent}/>
  <ContactShadows position={[0,-1.92,0]} opacity={.24} scale={7} blur={2.6} far={4}/>
 </Canvas>;
}
export default function PCScene({installed,accent='#d5ff6a',autoRotate=false,interactive=true,className,focusSlot,changeRequest}:PCSceneProps){
 const [glassMode,setGlassMode]=useState<GlassMode>('closed');
 const [exploded,setExploded]=useState(false);
 const [modelReady,setModelReady]=useState(false);
 const [manualOverview,setManualOverview]=useState(false);
 const [focusRevision,setFocusRevision]=useState(0);
 const markReady=useCallback(()=>setModelReady(true),[]);
 useEffect(()=>{
  if(!focusSlot||slotFocus(focusSlot)==='overview')return;
  setManualOverview(false);setGlassMode('door');setFocusRevision(x=>x+1);
 },[focusSlot]);
 useEffect(()=>{
  if(!changeRequest?.revision)return;
  setManualOverview(false);setGlassMode('door');setFocusRevision(x=>x+1);
 },[changeRequest?.revision]);
 const currentFocus:FocusKey=manualOverview?'overview':glassMode==='closed'?'overview':slotFocus(focusSlot)==='overview'?'glass_open':slotFocus(focusSlot);
 function toggleDoor(){setGlassMode(v=>v==='door'?'closed':'door');setExploded(false);setManualOverview(false);setFocusRevision(x=>x+1);}
 function toggleDetach(){setGlassMode(v=>v==='detached'?'door':'detached');setExploded(false);setManualOverview(false);setFocusRevision(x=>x+1);}
 function overview(){setGlassMode('closed');setExploded(false);setManualOverview(true);setFocusRevision(x=>x+1);}
 return <div className={`${className||'pc-canvas'} forge-realistic-viewer`} aria-label="Configurador 3D modular con puerta de vidrio, montaje animado y zoom">
  <ForgeCanvas installed={installed} accent={accent} glassMode={glassMode} exploded={exploded} autoRotate={autoRotate} interactive={interactive} onReady={markReady} focus={currentFocus} focusRevision={focusRevision} changeRequest={changeRequest}/>
  <PCPreview className={`forge-preview-overlay ${modelReady?'forge-preview-ready':''}`} status="CARGANDO PC 3D MODULAR"/>
  {interactive&&<div className="forge-viewer-actions">
   <button type="button" disabled={!modelReady} onClick={toggleDoor}>{glassMode==='door'?'CERRAR PUERTA':'ABRIR PUERTA'}</button>
   <button type="button" disabled={!modelReady} onClick={toggleDetach}>{glassMode==='detached'?'PONER VIDRIO':'RETIRAR VIDRIO'}</button>
   <button type="button" disabled={!modelReady} className={exploded?'active':''} onClick={()=>{setExploded(v=>!v);setGlassMode('door');setManualOverview(false);setFocusRevision(x=>x+1);}}>{exploded?'ENSAMBLAR':'DESPIECE'}</button>
   <button type="button" disabled={!modelReady} onClick={overview}>VISTA GENERAL</button>
  </div>}
  <div className="forge-model-disclaimer">MODELOS VISUALES DE REFERENCIA · NO SON LAS VARIANTES EXACTAS DEL CATÁLOGO</div>
 </div>;
}
