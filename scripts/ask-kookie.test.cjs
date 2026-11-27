/* Browser tests use a simulated transport. They do not certify database RLS or live storage. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function fakeBackend(){
  window.calls=[];window.failWrites=false;window.holdWrites=false;window.releaseWrite=null;
  let currentOwner='11111111-1111-4111-8111-111111111111';
  window.fixtureDB={
    ask_kookie_questions:[],ask_kookie_episode_questions:[],ask_kookie_question_votes:[],ask_kookie_episode_views:[],
    ask_kookie_public_questions:[{id:'public-one',question:'Quando usar DO e DOES?',category:'Gramática',published:true,interest_count:0}],
    ask_kookie_episodes:[{id:'episode-one',episode_number:1,title:'DO ou DOES? Qual é a diferença?',category:'Gramática',description:'Explicação do Simple Present',status:'draft',level:'Básico',keywords:'simple present',video_url:'',thumbnail_url:''},{id:'episode-two',episode_number:2,title:'DO e DOES na prática',category:'Gramática',description:'Episódio de teste',status:'published',level:'Básico',keywords:'simple present',video_url:'https://media.invalid/test.mp4',thumbnail_url:''}],student_progress:[]
  };
  window.sbClient={
    auth:{getUser:async()=>({data:{user:{id:currentOwner}}}),getSession:async()=>({data:{session:null}})},
    from(table){let op='select',payload=null,filters=[],range=[0,99999],single=false;
      const q={select(){return q;},insert(v){op='insert';payload=v;return q;},update(v){op='update';payload=v;return q;},delete(){op='delete';return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},in(k,v){filters.push(r=>v.includes(r[k]));return q;},order(){return q;},range(a,b){range=[a,b];return q;},single(){single=true;return q;},abortSignal(){return q;},then(resolve,reject){return (async()=>{
        window.calls.push({table,op,payload:structuredClone(payload)});
        if(op!=='select'&&window.holdWrites)await new Promise(r=>window.releaseWrite=r);
        if(op!=='select'&&window.failWrites)return {data:null,error:{message:'offline'}};
        let list=fixtureDB[table]||[],found=list.filter(r=>filters.every(f=>f(r)));
        if(op==='insert'){
          if(table==='ask_kookie_questions'&&list.some(x=>x.question===payload.question&&x.category===payload.category&&x.user_id===currentOwner))return {error:{code:'23505'}};
          const record={id:crypto.randomUUID(),user_id:currentOwner,created_at:new Date().toISOString(),status:'received',archived:false,group_key:'',...payload};list.push(record);fixtureDB[table]=list;found=[record];
          if(table==='ask_kookie_question_votes')fixtureDB.ask_kookie_public_questions[0].interest_count++;
        }
        if(op==='update')found.forEach(r=>Object.assign(r,payload));
        if(op==='delete'){fixtureDB[table]=list.filter(r=>!found.includes(r));if(table==='ask_kookie_question_votes')fixtureDB.ask_kookie_public_questions[0].interest_count--;}
        return {data:single?found[0]:found.slice(range[0],range[1]+1),error:null};
      })().then(resolve,reject);}};return q;
    },
    rpc(name,args){const q={abortSignal(){return q;},then(resolve,reject){calls.push({rpc:name,args});if(name==='ask_kookie_admin_notes')return Promise.resolve({data:[],error:null}).then(resolve,reject);const e={...args.p_episode};let prev=fixtureDB.ask_kookie_episodes.find(x=>x.id===e.id);if(prev)Object.assign(prev,e);else fixtureDB.ask_kookie_episodes.push(e);return Promise.resolve({data:e.id,error:null}).then(resolve,reject);}};return q;},
    storage:{from(){return {createSignedUrl:async name=>({data:{signedUrl:'https://media.invalid/'+name}})}}}
  };
  window.setFixtureOwner=id=>{currentOwner=id;};
}
const fixture=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/ask-kookie/ask-kookie.css"><style>body{margin:0;font:16px Arial}.hidden{display:none}</style><div id="ask-kookie-student"></div><div id="ask-kookie-admin"></div><script>let currentUser={id:'11111111-1111-4111-8111-111111111111',role:'student'};let isPreview=false;function isTeacherPreview(){return isPreview}function isTeacherAdmin(){return currentUser.role==='teacher'&&!isPreview}function recordStudentUsageEvent(){};(${fakeBackend.toString()})();</script><script src="/assets/ask-kookie/ask-kookie.js"></script></html>`;
test('module, worker and inline portal scripts parse',()=>{
  new vm.Script(fs.readFileSync(path.join(root,'assets/ask-kookie/ask-kookie.js'),'utf8'));
  new vm.Script(fs.readFileSync(path.join(root,'sw.js'),'utf8'));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);
  assert.match(html,/stab-ask-kookie/);assert.match(html,/ttab-ask-kookie/);assert.match(html,/AskKookie\?\.hasPendingWork/);
});
test('PWA leaves private responses and videos to network; no bulk video precache',()=>{
  const events={};let intercepted=0;
  const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const c=vm.createContext({URL,self:{location:{origin:'https://portal.invalid'},addEventListener:(n,f)=>events[n]=f}});new vm.Script(source).runInContext(c);
  for(const [url,destination] of [['https://project.supabase.co/rest/v1/ask_kookie_questions',''],['https://portal.invalid/video.mp4','video'],['https://portal.invalid/captions.vtt','track']])events.fetch({request:{method:'GET',url,destination},respondWith(){intercepted++;}});
  assert.equal(intercepted,0);assert.ok(!source.split('const APP_SHELL = [')[1].split('];')[0].match(/\.mp4|\.webm/));
});
test('student/admin browser flows, mobile, failures, account switch (simulated server)',{timeout:90000},async()=>{
  const server=http.createServer((req,res)=>{
    if(req.url==='/fixture'){res.setHeader('content-type','text/html;charset=utf-8');return res.end(fixture);}
    if(req.url==='/portal-fixture'){res.setHeader('content-type','text/html;charset=utf-8');const portal=fs.readFileSync(path.join(root,'index.html'),'utf8');return res.end(portal.replace('</body>',`<script>window.onload=()=>{};(${fakeBackend.toString()})();sbClient=window.sbClient;currentUser={id:'11111111-1111-4111-8111-111111111111',role:'teacher',previewMode:true,turma:'is08'};showView('student');switchStudentTab('ask-kookie');</script></body>`));}
    const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end();}
    res.setHeader('content-type',({'.css':'text/css','.js':'text/javascript','.html':'text/html','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);await page.evaluate(()=>AskKookie.openStudent());
    assert.match(await page.locator('#ak-mine').innerText(),/ainda não enviou/);
    assert.equal(await page.locator('#ak-episodes article').count(),1,'student query must request only published episodes; real RLS is tested separately');
    assert.ok(await page.evaluate(()=>Boolean(document.querySelector('#ak-library').compareDocumentPosition(document.querySelector('#ak-question-form'))&Node.DOCUMENT_POSITION_FOLLOWING)),'episodes precede the question box');
    assert.ok(await page.locator('#ak-episodes article').first().evaluate(e=>e.getBoundingClientRect().top<innerHeight),'first episode is visible on mobile entry');
    await page.waitForFunction(()=>document.querySelector('.ak-hero-art img')?.naturalWidth>0);assert.match(await page.locator('.ak-hero-art img').getAttribute('src'),/kookie-hero.webp/);
    // Failure must preserve text and must not confirm success.
    await page.locator('#ak-send textarea').fill('Quando eu devo usar does?');await page.evaluate(()=>failWrites=true);await page.locator('#ak-send button').click();
    await page.waitForFunction(()=>document.querySelector('#ak-message').dataset.error==='true');
    assert.equal(await page.locator('#ak-send textarea').inputValue(),'Quando eu devo usar does?');assert.equal(await page.locator('#ak-confirm').isVisible(),false);
    await page.evaluate(()=>{failWrites=false;holdWrites=true;});await page.locator('#ak-send button').click();
    await page.waitForFunction(()=>Boolean(releaseWrite));assert.equal(await page.locator('#ak-send button').isDisabled(),true);assert.equal(await page.locator('#ak-confirm').isVisible(),false);
    await page.evaluate(()=>{holdWrites=false;releaseWrite();});await page.waitForFunction(()=>!document.querySelector('#ak-confirm').hidden);
    assert.match(await page.locator('#ak-mine').innerText(),/Quando eu devo usar does/);
    const insert=await page.evaluate(()=>calls.find(c=>c.table==='ask_kookie_questions'&&c.op==='insert'));assert.equal('user_id' in insert.payload,false,'identity must be assigned on server');
    await page.locator('#ak-send textarea').fill('Quando eu devo usar does?');await page.locator('#ak-send button').click();await page.waitForFunction(()=>document.querySelector('#ak-send textarea').value==='');assert.equal(await page.evaluate(()=>fixtureDB.ask_kookie_questions.length),1,'retry of same question does not create a second row');
    await page.locator('[data-ak-vote]').click();await page.waitForFunction(()=>document.querySelector('[data-ak-vote]').getAttribute('aria-pressed')==='true');await page.locator('[data-ak-vote]').click();await page.waitForFunction(()=>document.querySelector('[data-ak-vote]').getAttribute('aria-pressed')==='false');
    await page.locator('#ak-search').fill('PRONUNCIA');assert.equal(await page.locator('#ak-episodes article').count(),0);await page.locator('#ak-search').fill('gramatica');assert.equal(await page.locator('#ak-episodes article').count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile layout must not overflow');
    // Reopening must not accumulate duplicate event listeners.
    await page.evaluate(()=>AskKookie.openStudent());await page.locator('#ak-send textarea').fill('Uma segunda pergunta sobre inglês?');const before=await page.evaluate(()=>calls.filter(c=>c.table==='ask_kookie_questions'&&c.op==='insert').length);await page.locator('#ak-send button').click();await page.waitForFunction(()=>fixtureDB.ask_kookie_questions.length===2);assert.equal(await page.evaluate(()=>calls.filter(c=>c.table==='ask_kookie_questions'&&c.op==='insert').length),before+1);
    await page.evaluate(()=>{AskKookie.reset();currentUser={id:'22222222-2222-4222-8222-222222222222',role:'student'};setFixtureOwner(currentUser.id);return AskKookie.openStudent();});assert.equal(await page.locator('#ak-mine article').count(),0,'account switch clears private content');
    await page.evaluate(()=>{AskKookie.reset();currentUser.role='teacher';return AskKookie.openAdmin();});assert.equal(await page.locator('#ak-questions details').count(),2);assert.match(await page.locator('#ak-stats').innerText(),/Dúvidas recebidas/);
    const firstCover=page.locator('[data-ak-play="episode-one"] img');await firstCover.waitFor();await page.waitForFunction(()=>document.querySelector('[data-ak-play="episode-one"] img')?.naturalWidth>0);assert.match(await firstCover.getAttribute('src'),/episode-01-do-does.webp/);
    await page.locator('#ak-questions details summary').first().click();await page.locator('#ak-questions form [name=status]').first().selectOption('production');await page.locator('#ak-questions form [name=group_key]').first().fill('Simple Present');await page.locator('#ak-questions form [name=internal_notes]').first().fill('Preparar explicação.');await page.locator('#ak-questions form button').first().click();await page.waitForFunction(()=>fixtureDB.ask_kookie_questions.some(q=>q.status==='production'));await page.locator('#ak-q-status').selectOption('production');assert.equal(await page.locator('#ak-questions details').count(),1);await page.locator('#ak-q-status').selectOption('');
    await page.locator('[data-ak-edit="episode-one"]').click();assert.equal(await page.locator('#ak-editor [name=title]').inputValue(),'DO ou DOES? Qual é a diferença?');assert.equal(await page.locator('#ak-editor [name=status]').inputValue(),'draft');
    await page.locator('#ak-editor [name=questions]').first().check();await page.locator('#ak-editor button').click();await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>calls.some(c=>c.rpc==='ask_kookie_save_episode')),await page.locator('#ak-message').innerText()+' invalid: '+await page.locator('#ak-editor :invalid').evaluateAll(x=>x.map(e=>e.name+' '+e.validationMessage).join(', ')));assert.equal(await page.evaluate(()=>calls.find(c=>c.rpc==='ask_kookie_save_episode').args.p_questions.length),1);
    await page.locator('#ak-questions details summary').first().click();await page.locator('[data-ak-anonymize]').first().click();assert.equal(await page.locator('#ak-public-editor [name=published]').isChecked(),false);
    await page.locator('#ak-public-editor [name=question]').fill('Como escolher DO ou DOES em perguntas?');await page.locator('#ak-public-editor [name=published]').check();await page.locator('#ak-public-editor button').first().click();await page.waitForFunction(()=>fixtureDB.ask_kookie_public_questions.length===2);const publicInsert=await page.evaluate(()=>calls.find(c=>c.table==='ask_kookie_public_questions'&&c.op==='insert'));assert.equal('user_id' in publicInsert.payload,false);
    await page.setViewportSize({width:1280,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>{AskKookie.reset();isPreview=true;return AskKookie.openStudent();});assert.equal(await page.locator('#ak-send button').isDisabled(),true);assert.equal(await page.locator('#ak-mine article').count(),0);
    assert.equal(await page.locator('#ak-episodes article').count(),2,'teacher review includes explicitly labelled drafts while ordinary students request published episodes only');assert.match(await page.locator('#ak-episodes').innerText(),/Rascunho/);
    await page.locator('#ak-episodes [data-ak-play="episode-two"]').click();assert.equal(await page.locator('#ak-player').isVisible(),true,'teacher student-preview can open published episodes without enabling writes');
    await page.evaluate(()=>AskKookie.authChanged('SIGNED_OUT'));assert.equal(await page.locator('#ask-kookie-student').innerText(),'');
    assert.deepEqual(errors,[]);
    await page.route('https://**/*',route=>route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/portal-fixture`);
    await page.waitForFunction(()=>document.querySelector('#ak-episodes article'));
    assert.equal(await page.locator('#stab-ask-kookie').isVisible(),true);
    assert.equal(await page.locator('#stab-inicio').isVisible(),false);
    await page.setViewportSize({width:390,height:844});
    fs.mkdirSync(path.join(root,'scratch/ask-kookie-qa'),{recursive:true});
    await page.screenshot({path:path.join(root,'scratch/ask-kookie-qa/mobile.png'),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'complete portal mobile layout '+await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(e=>[e.id,e.className,Math.round(e.getBoundingClientRect().width)]))));
    await page.locator('#snav-audios').click();assert.equal(await page.locator('#stab-ask-kookie').isVisible(),false);assert.equal(await page.locator('#stab-audios').isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
