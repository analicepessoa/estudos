const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const usageSource = html.slice(html.indexOf('function usageIso('), html.indexOf('function scheduleStudentUsageSave('));
const syncSource = html.slice(html.indexOf('function progressPendingKey('), html.indexOf('function retryPendingStudentProgress('));

function harness({readError=null,writeError=null,hold=false}={}) {
  const stored = new Map();
  const writes = [];
  const signals = [];
  const remote = {xp:30071,notas:{old:9,shared:10},unlocked:['old'],usage:{},updated_at:'2026-09-10T22:23:47Z'};
  const query = result => ({abortSignal(signal){signals.push(signal);return hold?new Promise(()=>{}):Promise.resolve(result);}});
  const context = vm.createContext({
    console:{warn(){}},setTimeout,clearTimeout,AbortController,Intl,Date,URL,Blob,
    navigator:{onLine:true},document:{getElementById(){return null;}},
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},
    currentUser:{id:'test-student',name:'Aluno de teste',role:'student',turma:'test-room',xp:35000,notas:{shared:8,new:10},unlockedFases:['new'],xpAwards:{reward:{count:1,lastAt:100}},usage:{}},
    progressSyncDiagnostic:{phase:'idle',serverXp:null,serverAt:'',confirmedAt:''},
    progressSyncWorkerVersion:'ap-english-v122',PROGRESS_SYNC_RELEASE:'20261021.1',
    progressSyncState:'saved',progressRetryTimer:null,progressRetryAttempts:0,
    studentUsageSessionApplied:false,progressSaveChain:Promise.resolve(),
    updateXpLevel(){},alert(){},
    withTimeout:(p)=>p,
    sbClient:{
      from(){return {
        select(){return {eq(){return {maybeSingle(){return query({data:readError?null:remote,error:readError});}};}};},
        upsert(payload){writes.push(payload);return query({data:null,error:writeError});}
      };},
      auth:{updateUser:async()=>({error:null}),refreshSession:async()=>({error:new Error('session unavailable')})}
    }
  });
  vm.runInContext(usageSource+'\n'+syncSource,context);
  // No background retries in these deterministic tests.
  vm.runInContext('scheduleProgressRetry=()=>{progressRetryAttempts++;}',context);
  return {context,stored,writes,signals};
}

test('preserves higher XP, best marks, awards and both progress histories when the panel receives a save',async()=>{
  const {context,stored,writes}=harness();
  assert.equal(await context.saveStudentProgress({silent:true}),true);
  assert.equal(writes.length,1);
  assert.equal(writes[0].xp,35000);
  assert.equal(writes[0].notas.shared,10);
  assert.equal(writes[0].notas.new,10);
  assert.equal(writes[0].notas.old,9);
  assert.deepEqual(Array.from(writes[0].unlocked).sort(),['new','old']);
  assert.equal(context.currentUser.xpAwards.reward.count,1);
  assert.equal(writes[0].usage.sessionCount,1);
  assert.ok(writes[0].usage.lastActiveAt);
  assert.equal(stored.has('ap_student_progress_test-student'),false);
  assert.equal(context.progressSyncDiagnostic.phase,'saved');
  assert.equal(context.progressSyncDiagnostic.serverXp,35000);
});

test('failed cloud read retains the local backup and identifies the reading step',async()=>{
  const {context,stored,writes}=harness({readError:{code:'FETCH_ERROR',message:'Load failed'}});
  assert.equal(await context.saveStudentProgress({silent:true}),false);
  assert.equal(writes.length,0);
  assert.equal(JSON.parse(stored.get('ap_student_progress_test-student')).xp,35000);
  assert.equal(context.progressSyncDiagnostic.failedPhase,'reading');
  assert.match(context.progressSyncDiagnostic.error,/Load failed/);
  assert.equal(context.progressSyncState,'pending');
});

test('failed table write retains the merged backup and identifies the writing step',async()=>{
  const {context,stored}=harness({writeError:{code:'42501',message:'policy denied'}});
  assert.equal(await context.saveStudentProgress({silent:true}),false);
  assert.equal(JSON.parse(stored.get('ap_student_progress_test-student')).notas.shared,10);
  assert.equal(context.progressSyncDiagnostic.failedPhase,'writing');
  assert.match(context.progressSyncDetailsText(),/42501: policy denied/);
  assert.match(context.progressSyncDetailsText(),/35000 XP/);
});

test('a stalled request is cancelled and terminates with an actionable timeout',async()=>{
  const {context,signals}=harness({hold:true});
  const query={abortSignal(signal){signals.push(signal);return new Promise(()=>{});}};
  await assert.rejects(context.runProgressQuery(query,15),error=>error.code==='PROGRESS_TIMEOUT');
  assert.equal(signals[0].aborted,true);
});

test('diagnostics persist the failure locally without including URLs or session tokens',()=>{
  const {context,stored}=harness();
  context.recordProgressSyncPhase('reading');
  context.recordProgressSyncPhase('failed',{error:{message:'https://example.com/private?token=secret eyJhbGc.eyJzdWI.signature'}});
  const info=JSON.parse(stored.get('ap_progress_sync_diagnostic_test-student'));
  assert.equal(info.failedPhase,'reading');
  assert.doesNotMatch(info.error,/secret|eyJ/);
});

test('downloaded backup includes the complete merged progress and no login credentials',async()=>{
  const {context}=harness();
  let downloaded;
  context.URL={createObjectURL(blob){downloaded=blob;return 'blob:test';},revokeObjectURL(){}};
  context.document={getElementById(){return null;},createElement(){return {click(){},remove(){}};},body:{appendChild(){}}};
  const realTimeout=context.setTimeout;
  context.setTimeout=(fn)=>{fn();return 0;};
  context.downloadStudentProgressBackup();
  context.setTimeout=realTimeout;
  const data=JSON.parse(await downloaded.text());
  assert.equal(data.format,'ap-english-student-progress');
  assert.equal(data.progress.xp,35000);
  assert.equal(data.progress.xpAwards.reward.count,1);
  assert.equal(data.student.id,'test-student');
  assert.doesNotMatch(await downloaded.text(),/access_token|refresh_token|password/);
});
