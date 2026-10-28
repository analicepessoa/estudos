'use strict';

async function runCatalogSaveTests(html){
  const checks=[];
  function check(condition,message){if(!condition)throw new Error(message);checks.push(message);}
  const slice=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
  const helpers=slice("const CATALOG_RECOVERY_KEY =", "function saveLocalDB(){");
  const save=slice("function saveCloudDB(){", "async function loadCloudDB(){");
  const load=slice("async function loadCloudDB(){","function adminAddRoom(){");
  const form=slice("async function adminSaveSemana(){","function adminEditSemana(");
  function catalog(){
    return {turmas:{r:{name:'Room'}},semanas:{r:[{title:'Original'}]},trilhas:{r:[{id:'p',teoria:[{exp:'Original'}]}]},musicas:{r:[]},audioRevisao:{r:[]},aulasArquivadas:[],musicCatalogMigrations:{}};
  }
  function harness(options={}){
    const alerts=[],requests=[],storage=new Map(),elements={};
    let DATABASE=catalog(),revision='2026-10-28T15:50:16.844815+00:00',role='teacher',formClosed=0,renders=0;
    let responseOverride=options.response;
    let actual=options.cloud||{...catalog(),studentControls:{kept:true},otherField:'preserve'};
    let loadError=options.loadError||null,mainReads=0;
    const localStorage={
      getItem:k=>storage.get(k)||null,
      setItem:(k,v)=>{if(options.quota)throw Error('Quota');storage.set(k,v);},
      removeItem:k=>storage.delete(k)
    };
    const sbClient={from(table){
      if(table!=='app_content')throw Error('Unexpected table '+table);
      let payload=null,filters={},columns='';
      const query={
        select(value){columns=value;return query;},
        eq(key,value){filters[key]=value;return query;},
        update(value){payload=value;return query;},
        async single(){mainReads++;return loadError?{data:null,error:loadError}:{data:{data:JSON.parse(JSON.stringify(actual)),updated_at:revision},error:null};},
        async maybeSingle(){
          if(!payload)return {data:null,error:null};
          requests.push({payload,filters:{...filters},columns});
          if(options.delay)await options.delay();
          if(responseOverride){if(responseOverride.throw)throw Error('Network');return responseOverride;}
          if(filters.id!=='main'||filters.updated_at!==revision||payload.updated_at!==revision)return {data:null,error:null};
          actual=JSON.parse(JSON.stringify(payload.data));
          revision='revision-'+requests.length;
          return {data:{updated_at:revision},error:null};
        }
      };
      return query;
    }};
    const document={getElementById(id){
      return elements[id]||(elements[id]={value:'',disabled:false});
    }};
    const factory=new Function('DATABASE','localStorage','sbClient','isTeacherAdmin','alert','console','withTimeout','document','renderAdminSemanas','adminCancelEditSemana',
      'publishAtFromInput','adminSelectedBookAudioIds','bookAudioItem',
      helpers+'\nfunction saveLocalDB(){localStorage.setItem("english_hub_db",JSON.stringify(DATABASE));return true;}\n'+save+'\n'+load+'\n'+form+
      '\nreturn {saveCloudDB,loadCloudDB,adminSaveSemana,validCloudCatalog,ready(rev,base){catalogCloudRevision=rev;catalogCloudBase=base;},state(){return {revision:catalogCloudRevision,blocked:catalogWriteBlocked};}};');
    const api=factory(DATABASE,localStorage,sbClient,()=>role==='teacher',m=>alerts.push(m),{warn(){},log(){}},p=>p,document,()=>renders++,()=>formClosed++,()=>'',new Set(),()=>null);
    if(options.ready!==false)api.ready(revision,JSON.parse(JSON.stringify(actual)));
    return {api,DATABASE,alerts,requests,storage,elements,actual:()=>actual,role:v=>role=v,revision:v=>revision=v,mainReads:()=>mainReads,formClosed:()=>formClosed,renders:()=>renders};
  }

  {
    const h=harness({ready:false});check(await h.api.saveCloudDB()===false&&h.requests.length===0,'refuses writes before official cloud load');
  }
  {
    const h=harness();h.role('student');check(await h.api.saveCloudDB()===false&&h.requests.length===0,'students cannot write catalog');
  }
  {
    const h=harness();h.DATABASE.semanas.r.push({title:'New lesson'});
    check(await h.api.saveCloudDB()===true,'teacher save confirms successful update');
    check(h.actual().semanas.r.length===2&&h.actual().trilhas.r[0].teoria[0].exp==='Original','new lesson preserves existing lesson and trail content');
    check(h.actual().studentControls.kept&&h.actual().otherField==='preserve','save preserves noncatalog fields');
    check(h.requests[0].filters.updated_at===h.requests[0].payload.updated_at,'save filters and echoes loaded revision');
    check(!h.storage.has('english_hub_catalog_draft_v1'),'confirmed save clears its own draft');
  }
  {
    const h=harness();h.revision('changed-on-another-device');
    check(await h.api.saveCloudDB()===false&&h.api.state().blocked,'stale revision is refused');
    check(h.storage.has('english_hub_catalog_draft_v1'),'conflict preserves pending draft');
    check(!('catalog' in JSON.parse(h.storage.get('english_hub_catalog_draft_v1'))),'draft does not duplicate entire catalog');
    check(await h.api.saveCloudDB()===false&&h.requests.length===1,'conflict blocks unsafe retry');
  }
  {
    const h=harness({response:{throw:true}});
    check(await h.api.saveCloudDB()===false&&h.api.state().blocked&&h.storage.has('english_hub_catalog_draft_v1'),'network failure preserves draft and blocks ambiguous retry');
  }
  {
    const h=harness({response:{data:null,error:{message:'denied'}}});
    check(await h.api.saveCloudDB()===false&&h.requests.length===1,'server error never becomes success');
  }
  {
    const h=harness({quota:true});
    check(await h.api.saveCloudDB()===false&&h.requests.length===0,'storage failure prevents unsafeguarded write');
  }
  {
    const h=harness();h.DATABASE.semanas.r.push({title:'One'});
    const one=h.api.saveCloudDB();h.DATABASE.semanas.r.push({title:'Two'});
    const two=h.api.saveCloudDB();
    check((await one)&&(await two),'concurrent saves serialize successfully');
    check(h.requests[0].payload.data.semanas.r.length===2&&h.requests[1].payload.data.semanas.r.length===3,'queued saves retain independent snapshots');
    check(h.requests[1].filters.updated_at==='revision-1','queued save uses revision from previous confirmation');
  }
  {
    const h=harness({ready:false});h.DATABASE.turmas.stale={name:'Deleted'};
    h.DATABASE.trilhas.r.push({id:'stale'});
    await h.api.loadCloudDB();
    check(!h.DATABASE.turmas.stale&&h.DATABASE.trilhas.r.length===1,'official load replaces stale cache instead of merging deleted content');
    check(Boolean(h.api.state().revision)&&h.mainReads()===1,'official load enables revision-based editing');
    check(!h.api.validCloudCatalog({turmas:{}}),'incomplete cloud catalog is rejected');
  }
  {
    const h=harness({ready:false,loadError:{message:'Offline'}});await h.api.loadCloudDB();
    check(await h.api.saveCloudDB()===false&&h.requests.length===0,'failed main load leaves editing disabled');
  }
  {
    const cloud=catalog();cloud.trilhas.r=[];cloud.semanas.r=[];
    const h=harness({ready:false,cloud});await h.api.loadCloudDB();
    check(h.DATABASE.trilhas.r.length===0&&h.DATABASE.semanas.r.length===0,'official empty arrays remain empty');
  }
  {
    const h=harness({ready:false,cloud:{turmas:{}}});await h.api.loadCloudDB();
    check(await h.api.saveCloudDB()===false&&h.requests.length===0,'incomplete cloud load cannot enable writes');
  }
  {
    const h=harness({response:{data:{updated_at:'2026-10-28T15:50:16.844815+00:00'},error:null}});
    check(await h.api.saveCloudDB()===false&&h.api.state().blocked,'server must advance revision to confirm save');
  }
  function fill(h){
    Object.entries({'admin-semana-idx':'','admin-semana-room':'r','admin-semana-modulo':'Module','admin-semana-fase':'1','admin-semana-title':'New lesson','admin-semana-book-level':'','admin-semana-vocab':'hello|olá','admin-semana-chunks':'How are you?|Como vai?','admin-semana-erros':'','admin-semana-ditado':'Hello'}).forEach(([id,value])=>h.elements[id]={value,disabled:false});
  }
  {
    let release;const gate=new Promise(r=>release=r);const h=harness({delay:()=>gate});fill(h);
    const saving=h.api.adminSaveSemana();await Promise.resolve();
    check(h.alerts.length===0&&h.formClosed()===0,'lesson form does not announce success or close before cloud confirmation');
    await h.api.adminSaveSemana();
    release();await saving;
    check(h.requests.length===1&&h.actual().semanas.r.length===2,'double click creates only one lesson');
    check(h.formClosed()===1&&h.alerts.some(m=>m.includes('confirmada na nuvem'))&&!h.elements['btn-save-semana'].disabled,'successful lesson closes form after confirmation');
  }
  {
    const h=harness({response:{data:null,error:{message:'Offline'}}});fill(h);await h.api.adminSaveSemana();
    check(h.formClosed()===0&&h.DATABASE.semanas.r.length===1&&!h.elements['btn-save-semana'].disabled,'failed lesson keeps form open and restores original lesson list');
    check(h.elements['admin-semana-title'].value==='New lesson'&&h.storage.has('english_hub_catalog_draft_v1'),'failed lesson retains text and recoverable draft');
  }
  return checks;
}

if(typeof module!=='undefined'){
  module.exports={runCatalogSaveTests};
  if(require.main===module){
    const fs=require('node:fs'),path=require('node:path');
    runCatalogSaveTests(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'))
      .then(checks=>console.log(checks.length+' catalog checks passed'))
      .catch(error=>{console.error(error);process.exitCode=1;});
  }
}
