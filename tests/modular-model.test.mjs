import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const where=file=>path.join(root,file);
const read=file=>fs.readFileSync(where(file),'utf8');
const folder='public/models/forge/modular/';
function inspectGLB(filename){
 const buf=fs.readFileSync(where(folder+filename));
 assert.equal(buf.toString('utf8',0,4),'glTF',filename);
 assert.equal(buf.readUInt32LE(4),2,filename);
 assert.equal(buf.readUInt32LE(8),buf.length,filename);
 const jsonLength=buf.readUInt32LE(12);
 assert.equal(buf.toString('utf8',16,20),'JSON',filename);
 const data=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8'));
 const tail=20+jsonLength;
 const binaryLength=buf.readUInt32LE(tail);
 assert.equal(buf.toString('utf8',tail+4,tail+8),'BIN\0',filename);
 assert.ok(data.bufferViews.every(v=>(v.byteOffset||0)+v.byteLength<=binaryLength),filename);
 return {data,buf};
}
test('12 GLB V3 válidos y las 426 mallas originales están cubiertas una sola vez',()=>{
 const meshes={base_static:107,glass_panel:1,motherboard:166,cpu:1,gpu:34,ram:40,storage:1,psu:1,radiator:23,aio_pump:9,aio_hoses:2,fans:44};
 for(const [stem,count] of Object.entries(meshes)){
  const {data}=inspectGLB(stem+'.glb');
  assert.equal(data.meshes.length,count,stem);
 }
 const original=Object.entries(meshes).filter(([key])=>!['cpu','psu','storage'].includes(key)).reduce((s,[,v])=>s+v,0);
 assert.equal(original,426);
 const meta=JSON.parse(read('src/data/forge_validation.json'));
 assert.equal(meta.coverage_ok,true);
 assert.equal(meta.source_meshes_covered_once,426);
});
test('modelo compacto sin versiones GLB antiguas duplicadas',()=>{
 assert.ok(fs.statSync(where(folder+'base_static.glb')).size<36e6);
 assert.ok(!fs.existsSync(where(folder+'scene_reference_v2.glb')));
 assert.ok(!fs.existsSync(where(folder+'glass_panel_v2.glb')));
 assert.ok(!fs.existsSync(where('public/models/forge/signature-one/scene.gltf')));
});
test('puntos de cámara para todos los componentes y bisagra del vidrio',()=>{
 const camera=JSON.parse(read('src/data/forge_camera_targets.json'));
 const mount=JSON.parse(read('src/data/forge_mounting_points.json'));
 const parts=['motherboard','cpu','gpu','ram','storage','psu','radiator','aio_pump','aio_hoses','fans'];
 for(const part of parts){
  assert.equal(camera.targets[part].position.length,3);
  assert.equal(camera.targets[part].target.length,3);
  assert.equal(mount.parts[part].staging_offset_gltf.length,3);
 }
 assert.equal(camera.targets.glass_open.position.length,3);
 assert.equal(mount.parts.glass.pivot_gltf.length,3);
 assert.equal(mount.parts.glass.modes.door.rotation_y_degrees,-100);
 assert.equal(mount.parts.glass.modes.detached.translation_gltf.length,3);
});
test('visor integra 10 módulos, montaje secuencial del cooler y apertura como puerta',()=>{
 const src=read('src/components/PCScene.tsx');
 for(const word of ['base_static.glb','glass_panel.glb','motherboard.glb','cpu.glb','gpu.glb','ram.glb','storage.glb','psu.glb','radiator.glb','aio_pump.glb','aio_hoses.glb','fans.glb','CameraDirector','staging_offset_gltf','pivot_gltf','CERRAR PUERTA','ABRIR PUERTA','RETIRAR VIDRIO','DESPIECE','VISTA GENERAL','PCPreview','PartModel']) assert.ok(src.includes(word),word);
 assert.ok(src.includes("part==='aio_pump'?.42:part==='aio_hoses'?.78"));
 assert.ok(!src.includes("from '@/lib/db'"));
 const builder=read('src/components/Builder.tsx');
 assert.ok(builder.includes('focusSlot={slot}'));
 assert.ok(builder.includes('changeRequest={changeRequest}'));
});
test('créditos CC BY y ZIP sin claves privadas',()=>{
 assert.match(read('MODEL_LICENSE.md'),/Yolala1232/);
 assert.match(read('src/components/Builder.tsx'),/Yolala1232/);
 assert.ok(!fs.existsSync(where('.env.local')));
 assert.ok(read('.gitignore').includes('.env.*'));
});
