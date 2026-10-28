const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('let cloudCatalogBaseline=null;'),html.indexOf('\nfunction adminAddRoom',html.indexOf('let cloudCatalogBaseline=null;')));
const clone=x=>JSON.parse(JSON.stringify(x));
function catalog(size=1){return {turmas:{room:{name:'Fixture class'}},trilhas:{room:[{id:'same-id',tipo:'teoria+flashcard+quiz',teoria:Array.from({length:size},(_,i)=>({en:'Word '+i,pt:'Palavra'})),pratica:Array.from({length:size},()=>({p:'Question',c:'Answer'}))}]},semanas:{room:[{title:'Same week',vocab:Array.from({length:size},()=>({en:'Week',pt:'Semana'}))}]},musicas:{room:[]},aulasArquivadas:[],audioRevisao:{},studentControls:{},musicCatalogMigrations:{}};}
function setup({initial=catalog(),remote=catalog(),cached=null,failRead=false,casConflict=false}={}){
  const storage=new Map(cached?[['english_hub_db',JSON.stringify(cached)]]:[]),alerts=[],writes=[],tables=[];
  let row={data:clone(remote),updated_at:'2026-10-28T01:00:00.000Z'},clock=0;
  const backend={
    failRead,casConflict,
    setRemote(data){row={data:clone(data),updated_at:`2026-10-28T02:00:00.${String(++clock).padStart(3,'0')}Z`};},
    from(table){
      tables.push(table);assert.equal(table,'app_content');
      let mode='read',payload=null;const filters={};
      const query={select(){return query;},eq(key,value){filters[key]=value;return query;},
        update(value){mode='update';payload=clone(value);return query;},
        single:async()=>finish(),maybeSingle:async()=>finish()};
      function finish(){
        if(mode==='read')return backend.failRead?{data:null,error:{message:'Unavailable'}}:{data:filters.id==='main'?clone(row):null,error:null};
        assert.equal(filters.id,'main');assert.ok(filters.updated_at,'conditional timestamp required');
        if(backend.casConflict||filters.updated_at!==row.updated_at)return {data:null,error:null};
        writes.push({table,payload});row=clone(payload);return {data:clone(row),error:null};
      }
      return query;
    }
  };
  const ctx=vm.createContext({DATABASE:clone(initial),sbClient:backend,Date,Array,Object,JSON,
    console:{log(){},warn(){},error(){}},alert:message=>alerts.push(message),withTimeout:p=>p,
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    I_WANT_IT_THAT_WAY_MUSIC:{},SHALLOW_MUSIC:{}});
  vm.runInContext(source,ctx);
  return {ctx,backend,storage,alerts,writes,tables};
}
test('complete cached phase and week replace seed with matching id/title when cloud fails',async()=>{
  const s=setup({cached:catalog(30),failRead:true});await s.ctx.loadCloudDB();
  assert.equal(s.ctx.DATABASE.trilhas.room[0].teoria.length,30);
  assert.equal(s.ctx.DATABASE.semanas.room[0].vocab.length,30);
  assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
});
test('a save without a successful cloud load preserves local edit but cannot write defaults',async()=>{
  const s=setup();assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
  assert.ok(s.storage.has('english_hub_db'));assert.equal(s.tables.length,0);
});
test('cloud load retains a richer cache as a recovery copy without restoring it',async()=>{
  const s=setup({cached:catalog(30)});await s.ctx.loadCloudDB();
  const saved=JSON.parse(s.storage.get('english_hub_catalog_recovery_v1'));
  assert.equal(saved.catalog.trilhas.room[0].pratica.length,30);
  assert.equal(s.ctx.DATABASE.trilhas.room[0].pratica.length,1);
  assert.equal(s.writes.length,0);
});
test('an existing recovery copy is never overwritten by later loads',async()=>{
  const s=setup({cached:catalog(30)});s.storage.set('english_hub_catalog_recovery_v1','original-copy');
  await s.ctx.loadCloudDB();assert.equal(s.storage.get('english_hub_catalog_recovery_v1'),'original-copy');
});
test('a read failure before save cannot replace the remote catalog',async()=>{
  const s=setup();await s.ctx.loadCloudDB();s.backend.failRead=true;
  assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
});
test('another session changing the catalog blocks a stale full-catalog save',async()=>{
  const s=setup();await s.ctx.loadCloudDB();s.backend.setRemote(catalog(30));
  assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
});
test('a concurrent update between read and write leaves the remote row untouched',async()=>{
  const s=setup();await s.ctx.loadCloudDB();s.backend.casConflict=true;
  assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
});
test('a confirmed edit saves all content with a conditional update and can be saved again',async()=>{
  const s=setup({remote:catalog(30)});await s.ctx.loadCloudDB();
  s.ctx.DATABASE.trilhas.room[0].title='Edited title';
  assert.equal(await s.ctx.saveCloudDB(),true);assert.equal(s.writes.length,1);
  assert.equal(s.writes[0].payload.data.trilhas.room[0].pratica.length,30);
  assert.equal(s.writes[0].payload.data.trilhas.room[0].title,'Edited title');
  assert.equal(await s.ctx.saveCloudDB(),true);assert.equal(s.writes.length,2);
  assert.ok(s.tables.every(name=>name==='app_content'));
});
test('equivalent JSON key ordering does not cause a false conflict',async()=>{
  const s=setup();await s.ctx.loadCloudDB();
  const reordered=Object.fromEntries(Object.entries(catalog()).reverse());s.backend.setRemote(reordered);
  assert.equal(await s.ctx.saveCloudDB(),true);
});
test('valid empty cloud arrays remain empty rather than resurrecting the embedded phases',async()=>{
  const empty=catalog();empty.trilhas.room=[];empty.semanas.room=[];
  const s=setup({remote:empty});await s.ctx.loadCloudDB();
  assert.equal(s.ctx.DATABASE.trilhas.room.length,0);assert.equal(s.ctx.DATABASE.semanas.room.length,0);
});
test('malformed main catalog cannot enable a cloud save',async()=>{
  const s=setup({remote:{trilhas:[]}});await s.ctx.loadCloudDB();
  assert.equal(await s.ctx.saveCloudDB(),false);assert.equal(s.writes.length,0);
});
