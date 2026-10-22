const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fixture=`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/reading/reader-1984.css"><style>*{box-sizing:border-box}.hidden{display:none!important}body{margin:0;font:16px Arial}.reading-library{padding:16px;display:grid;gap:18px}.reading-week-row{display:flex;gap:14px;padding:16px;text-align:left}.reading-week-copy{display:grid;gap:8px}#reading-overlay{position:fixed;inset:0;overflow:auto;background:#131515;z-index:20}.reading-topbar{position:sticky;top:0;padding:12px;display:flex;justify-content:space-between}.reading-topbar-copy{display:grid}</style><div id="home-reading-title"></div><div id="home-reading-detail"></div><div id="home-reading-status"></div><div id="stab-leitura"><div id="reading-library"></div></div><div id="reading-overlay" class="hidden"><div class="reading-topbar"><button onclick="readingBack()">Voltar</button><div class="reading-topbar-copy"><strong id="reading-overlay-title"></strong><span id="reading-overlay-subtitle"></span></div><button onclick="closeReadingBook()">Fechar livro</button></div><div id="reading-content"></div></div><script>
Date.now=()=>Date.parse('2026-10-22T15:00:00-03:00');
let currentUser=JSON.parse(localStorage.getItem('_reading_fixture')||'null')||{id:'fixture-one',role:'student',name:'Aluno fictício',turma:'is08',xp:0,unlockedFases:Array.from({length:6},(_,i)=>'reading__metamorphosis_w'+(i+1)+'_complete')};
let DATABASE={turmas:{is08:{name:'Turma IS08/0008'},room_1781212946093:{name:'Turma IQ19/0013'},other:{name:'Outra turma'}}};
let readingDeadlineTimer=null,readingGateTimer=null;window.saves=0;window.events=[];window.audioPlayed=[];window.audioStopped=0;
function isTeacherPreview(){return Boolean(currentUser._preview)}function renderReadingLibrary(){}function closeReadingBook(){}function readingBack(){}function renderStudentHome(){}function setHomeStatus(id,state,label){document.getElementById(id).textContent=label}function stopReadingAudio(){}function claimXpReward(){return {amount:200}}function recordStudentUsageEvent(...args){window.events.push(args)}function saveStudentProgress(){window.saves++;localStorage.setItem('_reading_fixture',JSON.stringify(currentUser));return Promise.resolve(true)}window.speechSynthesis={cancel(){window.audioStopped++}};async function playTTS(text){window.audioPlayed.push(text);return {}}
</script><script src="/assets/reading/reader-1984.js"></script></html>`;
async function main(){
 const server=http.createServer((req,res)=>{
  if(req.url==='/fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture);}
  let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',({'.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  await page.locator('.n84-book').waitFor();
  assert.ok((await page.locator('.n84-book').innerText()).includes('Você teria coragem de pensar diferente?'));
  assert.equal(await page.locator('[data-n84-open="2"]').isDisabled(),true,'old book markers must not unlock new book');
  assert.equal(await page.locator('.n84-honours').innerText().then(t=>t.includes('Emiliana')),false);
  assert.ok((await page.locator('.n84-honours').innerText()).includes('Maria Eduarda'));
  await page.evaluate(()=>{const b=document.createElement('button');b.dataset.n84Open='2';document.body.append(b);b.click();b.remove()});
  assert.equal(await page.locator('#reading-overlay').isVisible(),false,'direct locked entry rejected');
  async function openWeek(n){await page.locator('#reading-library .reading-week-row[data-n84-open="'+n+'"]').click();await page.locator('.n84-story').first().waitFor();}
  await openWeek(1);
  assert.equal(await page.locator('.n84-question').count(),0);
  const book=JSON.parse(fs.readFileSync(path.join(root,'livros/1984/app/week1_app_content.json')));
  assert.deepEqual(await page.locator('.n84-story').allTextContents(),book.week.story.paragraphs);
  await page.getByRole('button',{name:/Ouvir capítulo/}).click();
  assert.ok((await page.evaluate(()=>audioPlayed[0])).includes('It is a cold day in April.'));
  await page.getByRole('button',{name:'Parar áudio',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:/Ouvir capítulo/}).count(),1,'audio control returns to its initial state after stopping');
  await page.locator('[data-n84-word="thoughtcrime"]').first().click();
  assert.ok((await page.locator('#n84-dictionary-meaning').innerText()).includes('crime de pensamento'));
  await page.screenshot({path:path.join(root,'outputs/1984-app-dictionary-mobile.png')});
  const scroll=await page.locator('#reading-overlay').evaluate(e=>e.scrollTop);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#reading-overlay').evaluate(e=>e.scrollTop),scroll);
  await page.getByRole('button',{name:'Fechar livro',exact:true}).click();
  await openWeek(1);await page.waitForTimeout(100);
  assert.equal(await page.locator('#reading-overlay').evaluate(e=>Math.round(e.scrollTop)),Math.round(scroll),'reading position restored');
  await page.locator('[data-n84-story-done]').click();
  await page.locator('[data-n84-next]').click();
  assert.ok((await page.locator('#n84-gate').innerText()).includes('Responda'));
  const answerLabel=value=>value===true?'True':value===false?'False':value;
  const quick0=page.locator('[data-question="quick_0"] [data-n84-answer]');
  const quick0Texts=await quick0.allTextContents(),quick0Correct=quick0Texts.indexOf(answerLabel(book.week.quick_check[0].answer)),quick0Wrong=quick0Texts.findIndex((text,i)=>i!==quick0Correct);
  await quick0.nth(quick0Wrong).click();
  assert.ok((await page.locator('.n84-feedback').first().innerText()).includes('Resposta registrada'));
  assert.equal(await quick0.nth(quick0Correct).isDisabled(),true,'an answer cannot be changed in the same attempt');
  await page.getByRole('button',{name:'Fechar livro',exact:true}).click();
  await page.locator('#reading-library .reading-week-row[data-n84-open="1"]').click();
  await page.locator('.n84-question').first().waitFor();
  assert.equal(await quick0.nth(quick0Wrong).getAttribute('aria-pressed'),'true','answers restored');
  assert.equal(await quick0.nth(quick0Correct).isDisabled(),true,'restored answer remains locked');
  for(let i=1;i<book.week.quick_check.length;i++){
   const buttons=page.locator(`[data-question="quick_${i}"] [data-n84-answer]`),texts=await buttons.allTextContents(),correct=texts.indexOf(answerLabel(book.week.quick_check[i].answer));
   await buttons.nth(i<4?texts.findIndex((text,index)=>index!==correct):correct).click();
  }
  await page.locator('[data-n84-next]').click();
  assert.ok((await page.locator('#n84-gate').innerText()).includes('Você acertou 4 de 8'));
  await page.getByRole('button',{name:'Revisar o capítulo e tentar novamente',exact:true}).click();
  await page.locator('.n84-story').first().waitFor();
  await page.locator('[data-n84-story-done]').click();
  async function finishStages(n,start=0){
   const w=JSON.parse(fs.readFileSync(path.join(root,`livros/1984/app/week${n}_app_content.json`))).week;
   const answers={};w.quick_check.forEach((q,i)=>answers['quick_'+i]=q.answer===true?'True':q.answer===false?'False':q.answer);
   for(const [key,g] of Object.entries(w.language_check)){
    (g.questions||[]).forEach((q,i)=>answers[key+'_'+i]=q.answer);
    (g.order_items||[]).forEach((item,i)=>answers[key+'_order_'+i]=g.order_items.find(x=>x.id===g.answer[i]).event);
   }
   answers.orwell=w.orwells_question.options[0];answers.reflection=w.second_reflection.options[0];
   for(let stage=start;stage<6;stage++){
    for(const id of await page.locator('[data-question]').evaluateAll(els=>els.map(e=>e.dataset.question))){
     const buttons=page.locator(`[data-question="${id}"] [data-n84-answer]`),texts=await buttons.allTextContents();
     const index=texts.indexOf(answers[id]);assert.ok(index>=0,id);
     if(await buttons.nth(index).isDisabled())assert.equal(await buttons.nth(index).getAttribute('aria-pressed'),'true',`${id} keeps its recorded answer`);
     else await buttons.nth(index).click();
    }
    if(stage===5){
      await page.locator('#n84-optional-thoughts').fill('My thoughts about Winston.');
      assert.ok(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('ap_reading_1984_fixture-one_w1_answers_v1')||'{}')).includes('My thoughts about Winston.')));
    }
    await page.locator('[data-n84-next]').click();
   }
   await page.getByRole('heading',{name:'Capítulo concluído',exact:true}).waitFor();
  }
  await finishStages(1);
  assert.equal(await page.evaluate(()=>currentUser.xp),200);
  assert.ok(await page.evaluate(()=>events.some(event=>event[0]==='activity'&&event[1]==='1984 · Semana 1 · Pensamentos finais e conclusão'&&event[3].includes('My thoughts about Winston.'))),'final thoughts are recorded as a report activity');
  await page.getByRole('button',{name:'Voltar à biblioteca',exact:true}).click();
  await page.reload();await page.locator('.n84-book').waitFor();
  assert.equal(await page.locator('.reading-week-row[data-n84-open="2"]').isDisabled(),false);
  assert.equal(await page.locator('[data-n84-open="3"]').isDisabled(),true);
  await openWeek(1);await page.locator('[data-n84-story-done]').click();await finishStages(1);
  assert.equal(await page.evaluate(()=>currentUser.xp),200,'replay grants no duplicate XP');
  for(const n of [2,3]){
   await page.locator(`[data-n84-open="${n}"]`).last().click();await page.locator('.n84-story').first().waitFor();
   assert.equal(await page.locator('.n84-question').count(),0);
   await page.locator('[data-n84-story-done]').click();await finishStages(n);
  }
  assert.equal(await page.evaluate(()=>currentUser.xp),600);
  assert.equal(await page.evaluate(()=>currentUser.unlockedFases.filter(x=>/^reading__metamorphosis/.test(x)).length),6,'old progress intact');
  assert.ok((await page.locator('.n84-reader').innerText()).includes('Semana 4 em breve'));
  await page.getByRole('button',{name:'Voltar à biblioteca',exact:true}).click();
  await page.evaluate(async()=>{currentUser.turma='room_1781212946093';await renderReadingLibrary()});
  let honour=await page.locator('.n84-honours').innerText();assert.ok(honour.includes('Carlos')&&honour.includes('Emiliana')&&!honour.includes('Maria Eduarda'));
  await page.screenshot({path:path.join(root,'outputs/1984-app-library-mobile.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(async()=>{currentUser.turma='other';await renderReadingLibrary()});
  assert.equal(await page.locator('.n84-honours').count(),0,'no recognition card in unconfirmed classrooms');
  await openWeek(1);
  const before=await page.evaluate(()=>saves);
  await page.evaluate(()=>{currentUser={id:'fixture-two',role:'student',name:'Outro fictício',turma:'other',xp:0,unlockedFases:[]}});
  await page.locator('[data-n84-story-done]').click();
  assert.equal(await page.evaluate(()=>saves),before,'account change cannot save previous reader progress');
  assert.equal(await page.locator('#reading-overlay').isVisible(),false);
  await page.evaluate(async()=>{currentUser={id:'fixture-teacher',role:'teacher',turma:'is08',_preview:true,unlockedFases:[],xp:0};await renderReadingLibrary()});
  const previewSaves=await page.evaluate(()=>saves);await openWeek(3);await page.locator('[data-n84-story-done]').click();await finishStages(3);
  assert.equal(await page.evaluate(()=>saves),previewSaves,'teacher preview has no student writes');
  assert.equal(await page.evaluate(()=>currentUser.xp),0);
  await context.setOffline(true);
  await page.getByRole('button',{name:'Voltar à biblioteca',exact:true}).click();await openWeek(1);
  await page.locator('[data-n84-word="winston"]').first().click();assert.ok((await page.locator('#n84-dictionary-meaning').innerText()).includes('protagonista'));
  assert.deepEqual(errors,[]);
  console.log('PASS: complete weeks 1–3; locked continuation; story first; locked answers; over-half threshold and review retry; chapter audio; optional writing; resume; unique XP; separate book progress; classroom honours; account isolation; teacher preview; offline dictionary; mobile layout.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
