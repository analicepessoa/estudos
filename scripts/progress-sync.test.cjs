const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const usageSource = html.slice(html.indexOf('function usageIso('), html.indexOf('function scheduleStudentUsageSave('));
const syncSource = html.slice(html.indexOf('function progressPendingKey('), html.indexOf('function retryPendingStudentProgress('));

function response(status, body=''){
  return {ok:status>=200&&status<300,status,text:async()=>body};
}

function harness({remote,readStatus=200,writeStatus=201,hold=false}={}) {
  const stored = new Map();
  const writes = [];
  const signals = [];
  const server = remote || {xp:30071,notas:{old:9,shared:10},unlocked:['old'],usage:{},updated_at:'2026-09-10T22:23:47Z'};
  const fetch = async (url,options={}) => {
    signals.push(options.signal);
    if(hold)return new Promise(()=>{});
    if(options.method==='POST'){
      writes.push({url,payload:JSON.parse(options.body)});
      return response(writeStatus,writeStatus>=400?JSON.stringify({code:'500',message:'write failed'}):'');
    }
    return response(readStatus,readStatus>=400?JSON.stringify({code:'500',message:'read failed'}):JSON.stringify([server]));
  };
  const context = vm.createContext({
    console:{warn(){}},setTimeout,clearTimeout,AbortController,Intl,Date,URL,Blob,fetch,
    SUPABASE_URL:'https://example.supabase.co',SUPABASE_KEY:'anon-test-key',
    navigator:{onLine:true},document:{getElementById(){return null;}},
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},
    currentUser:{id:'test-student',name:'Aluno de teste',role:'student',turma:'test-room',xp:35000,notas:{shared:8,new:10},unlockedFases:['new'],xpAwards:{reward:{count:1,lastAt:100}},usage:{}},
    progressSyncDiagnostic:{phase:'idle',serverXp:null,serverAt:'',confirmedAt:''},
    progressSyncWorkerVersion:'ap-english-v122',PROGRESS_SYNC_RELEASE:'20261021.1',
    progressSyncState:'saved',progressRetryTimer:null,progressRetryAttempts:0,progressAttemptSequence:0,
    studentUsageSessionApplied:false,progressSaveChain:Promise.resolve(),
    updateXpLevel(){},alert(){},
    withTimeout:p=>p,
    sbClient:{auth:{updateUser:async()=>({error:null}),refreshSession:async()=>({error:new Error('session unavailable')})}}
  });
  vm.runInContext(usageSource+'\n'+syncSource,context);
  vm.runInContext('scheduleProgressRetry=()=>{progressRetryAttempts++;}',context);
  return {context,stored,writes,signals};
}

test('sincroniza um registro normal e encerra o indicador de salvamento',async()=>{
  const {context,stored,writes}=harness();
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  assert.equal(writes.length,1);
  assert.equal(context.progressSyncState,'saved');
  assert.equal(context.progressSyncDiagnostic.phase,'saved');
  assert.equal(stored.has('ap_student_progress_test-student'),false);
});

test('combina registros acumulados offline sem apagar XP, notas, conquistas ou histórico remoto',async()=>{
  const {context,writes}=harness();
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  const payload=writes[0].payload;
  assert.equal(payload.xp,35000);
  assert.equal(payload.notas.shared,10);
  assert.equal(payload.notas.new,10);
  assert.deepEqual(Array.from(payload.unlocked).sort(),['new','old']);
  assert.equal(context.currentUser.xpAwards.reward.count,1);
});

test('um erro do servidor preserva a cópia pendente e encerra o estado Salvando',async()=>{
  const {context,stored,writes}=harness({readStatus:500});
  assert.equal(await context.saveStudentProgress({silent:true}),false);
  assert.equal(writes.length,0);
  assert.equal(JSON.parse(stored.get('ap_student_progress_test-student')).xp,35000);
  assert.equal(context.progressSyncDiagnostic.failedPhase,'reading');
  assert.equal(context.progressSyncState,'pending');
});

test('uma requisição pendente é abortada no prazo e não deixa a fila travada',async()=>{
  const {context,signals}=harness({hold:true});
  const directAttempt=context.createProgressAttempt('test-student');
  await assert.rejects(context.requestProgressRest('student_progress?select=xp',{},15,directAttempt),error=>error.code==='PROGRESS_TIMEOUT');
  assert.equal(signals.at(-1).aborted,true);
  assert.equal(directAttempt.controllers.size,0);
});

test('um registro local ilegível é preservado à parte e não bloqueia o próximo envio válido',async()=>{
  const {context,stored,writes}=harness();
  stored.set('ap_student_progress_test-student','{registro quebrado');
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  assert.equal(stored.get('ap_student_progress_unreadable_test-student'),'{registro quebrado');
  assert.equal(writes.length,1);
});

test('falha de gravação mantém a versão mais nova no aparelho',async()=>{
  const {context,stored}=harness({writeStatus:500});
  assert.equal(await context.saveStudentProgress({silent:true}),false);
  const pending=JSON.parse(stored.get('ap_student_progress_test-student'));
  assert.equal(pending.xp,35000);
  assert.equal(pending.notas.shared,10);
  assert.equal(context.progressSyncDiagnostic.failedPhase,'writing');
});

test('reenvio seguro usa upsert pela identidade do aluno, sem criar duplicatas',async()=>{
  const {context,writes}=harness();
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  assert.equal(writes.length,2);
  assert.ok(writes.every(write=>write.url.includes('on_conflict=id')&&write.payload.id==='test-student'));
});

test('uma gravação antiga não pode apagar uma cópia pendente que mudou durante o envio',async()=>{
  const {context,stored}=harness();
  const revision=context.storePendingProgress({xp:35000,notas:{},xpAwards:{},usage:{},unlockedFases:[]},'test-student');
  context.storePendingProgress({xp:36000,notas:{},xpAwards:{},usage:{},unlockedFases:[]},'test-student');
  assert.equal(context.clearPendingProgress('test-student',revision),false);
  assert.equal(JSON.parse(stored.get('ap_student_progress_test-student')).xp,36000);
});
