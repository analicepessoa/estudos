/* Reader isolated from the archived Metamorphosis progress and exercises. */
(() => {
  'use strict';
  const BASE='livros/1984/app/';
  const WEEKS=[1,2,3];
  const END=Date.parse('2026-12-02T00:00:00-03:00');
  const START=Date.parse('2026-10-21T00:00:00-03:00');
  const STAGES=['Quick Check','Words from the Chapter','Language Check',"Orwell’s Question",'Second Reflection','Optional Classroom Mission'];
  // Confirmed by the teacher's dashboard screenshots and explicit correction.
  const HONOURS={'IQ19/0013':['Carlos','Emiliana'],'IS08/0008':['Kauã Vitor','Maria Eduarda']};
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const marker=(week,suffix='complete')=>`reading__1984_w${week}_${suffix}`;
  const identity=()=>`${currentUser?.id||''}|${currentUser?.turma||''}|${currentUser?.role||''}|${isTeacherPreview()}`;
  const preview=()=>isTeacherPreview()||currentUser?.role==='teacher';
  const eligible=()=>Boolean(currentUser&&(currentUser.role==='student'||preview()));
  const available=()=>preview()||(Date.now()>=START&&Date.now()<END);
  const complete=week=>(currentUser?.unlockedFases||[]).includes(marker(week));
  const unlocked=week=>WEEKS.includes(week)&&(preview()||WEEKS.filter(n=>n<week).every(complete));
  let loaded=null,loading=null,session=null,renderId=0,wordTrigger=null;
  const page=()=>document.getElementById('reading-content');
  const overlay=()=>document.getElementById('reading-overlay');
  const oldClose=closeReadingBook,oldBack=readingBack,oldHome=renderStudentHome;
  let dictionaryDialog;
  window.Portal1984={studentLabel(markers){
    const values=Array.isArray(markers)?markers:[];
    if(!values.some(value=>String(value).startsWith('reading__1984_')))return '';
    const done=WEEKS.filter(n=>values.includes(marker(n))).length;
    return done===3?'1984 · semanas 1–3 concluídas':`1984 · ${done} de 3 capítulos concluídos`;
  }};

  async function load(){
    if(loaded)return loaded;
    if(!loading)loading=Promise.all([...WEEKS.map(n=>fetch(BASE+`week${n}_app_content.json`).then(readJson)),fetch(BASE+'dictionary.json').then(readJson)])
      .then(items=>{loaded={weeks:items.slice(0,3),dictionary:items[3]};return loaded;}).finally(()=>{loading=null;});
    return loading;
  }
  function readJson(response){if(!response.ok)throw Error('Conteúdo indisponível');return response.json();}
  function roomCode(){
    const room=currentUser?.turma;
    const label=DATABASE.turmas?.[room]?.name||'';
    const code=label.match(/(?:IQ|IS)\d+\/\d+/i)?.[0]?.toUpperCase();
    // Stable room IDs already used by the production classroom releases.
    return code||({room_1781212946093:'IQ19/0013',is08:'IS08/0008'})[room]||'';
  }
  function honoursHtml(){
    const names=HONOURS[roomCode()];
    if(!names?.length)return '';
    return `<aside class="n84-honours"><small>Leitura da turma · encerrada</small><h3>A Metamorfose: uma jornada concluída</h3><p>Parabéns a quem chegou ao fim das seis semanas!</p><ul>${names.map(name=>`<li><strong>${safe(name)}</strong> concluiu a leitura.</li>`).join('')}</ul></aside>`;
  }
  renderReadingLibrary=async function(){
    const container=document.getElementById('reading-library');
    if(!container||!eligible())return;
    if(readingDeadlineTimer){clearInterval(readingDeadlineTimer);readingDeadlineTimer=null;}
    const request=++renderId,owner=identity();
    container.innerHTML='<p class="text-muted">Carregando sua biblioteca…</p>';
    try{
      const {weeks}=await load();
      if(request!==renderId||identity()!==owner)return;
      const done=WEEKS.filter(complete).length,next=WEEKS.find(n=>!complete(n))||3;
      const action=available()?`<button class="btn" type="button" data-n84-open="${next}">${done===3?'Revisar leitura':'Abrir o livro'}</button>`:'<p>O período de leitura terminou. Seu progresso continua salvo.</p>';
      container.innerHTML=`<article class="n84-book"><img src="${BASE}assets/cover_nineteen_eighty_four_a2.webp" alt="Capa de Nineteen Eighty-Four, 1984"><div><small>Leitura atual · CEFR A2 · George Orwell</small><h3>NINETEEN EIGHTY-FOUR <span>1984</span></h3><p>Uma adaptação em inglês para ler, compreender e refletir.</p><p>Jornada de 6 semanas · até 01/12/2026<br>Semanas 1–3 disponíveis · ${done} de 3 concluídas</p>${action}</div></article><div class="reading-weeks">${weeks.map(({week:w})=>`<button class="reading-week-row" type="button" data-n84-open="${w.number}" ${!unlocked(w.number)||!available()?'disabled':''}><div class="reading-week-number">0${w.number}</div><div class="reading-week-copy"><strong>${safe(w.title)}</strong><span>${complete(w.number)?'Capítulo concluído':unlocked(w.number)?'Disponível para leitura':`Conclua a Semana ${w.number-1} para desbloquear`} · ${safe(w.main_language_focus)}</span></div><span aria-hidden="true">${complete(w.number)?'✓':unlocked(w.number)?'›':'🔒'}</span></button>`).join('')}<div class="n84-coming">Semanas 4–6: em breve. Suas conclusões desbloqueiam a continuação.</div></div>${honoursHtml()}`;
    }catch(error){if(request===renderId&&identity()===owner)container.innerHTML='<p>Não foi possível carregar a leitura. Confira sua conexão.</p><button class="btn" data-n84-retry type="button">Tentar novamente</button>';}
  };
  function updateHome(){
    if(!eligible())return;
    const next=WEEKS.find(n=>!complete(n));
    const title=document.getElementById('home-reading-title'),detail=document.getElementById('home-reading-detail');
    if(title)title.textContent=next?`1984 · Semana ${next} disponível`:'1984 · semanas 1–3 concluídas';
    if(detail)detail.textContent=next?'Leia no seu ritmo. Toque nas palavras para ver o significado.':'Sua leitura continua nas próximas semanas. Progresso preservado.';
    if(!available()){
      if(title)title.textContent='1984 · período encerrado';
      if(detail)detail.textContent='Seu progresso de leitura continua salvo.';
    }
    setHomeStatus('home-reading-status',next?'todo':'done',available()?(next?'Continuar leitura':'Próximas semanas em breve'):'Prazo encerrado');
  }
  renderStudentHome=function(){oldHome();updateHome();};
  closeReadingBook=function(){if(!session)return oldClose();close();};
  readingBack=function(){if(!session)return oldBack();if(session.mode==='story'||session.mode==='done')close();else read();};
  function valid(){return session&&eligible()&&identity()===session.owner&&unlocked(session.week)&&available();}
  function view(html,mode){
    if(!valid())return close();
    session.mode=mode;
    page().classList.add('n84-page');
    page().innerHTML=html;
    overlay().scrollTo({top:0});
  }
  function close(){
    stopChapterAudio();
    if(valid()&&session.mode==='story'){session.answers._scroll=overlay().scrollTop;saveAnswers();}
    session=null;
    dictionaryDialog?.close();
    page()?.classList.remove('n84-page');
    overlay()?.classList.add('hidden');
    document.getElementById('reading-overlay-title').textContent='Leitura guiada';
    renderReadingLibrary();updateHome();
  }
  async function open(week){
    if(!eligible()||!unlocked(week)||!available())return;
    const owner=identity();
    try{
      const contents=await load();
      if(owner!==identity()||!unlocked(week)||!available())return;
      stopReadingAudio(false);
      if(readingGateTimer){clearInterval(readingGateTimer);readingGateTimer=null;}
      session={owner,week,mode:'story',stage:0,data:contents.weeks[week-1],answers:readAnswers(week),previewMarkers:new Set(),busy:false};
      document.getElementById('reading-overlay-title').textContent='Nineteen Eighty-Four · 1984';
      document.getElementById('reading-overlay-subtitle').textContent=`Week ${week} · ${session.data.week.title}`;
      overlay().classList.remove('hidden');
      if(has('story')&&!complete(week)){
        session.stage=Number.isInteger(session.answers._stage)?Math.max(0,Math.min(5,session.answers._stage)):0;
        activities();
      }else read();
    }catch(error){alert('Não foi possível abrir o capítulo. Confira sua conexão e tente novamente.');}
  }
  function has(suffix){return preview()?session.previewMarkers.has(suffix):(currentUser.unlockedFases||[]).includes(marker(session.week,suffix));}
  function noteKey(week){return `ap_reading_1984_${currentUser?.id||'preview'}_w${week}_answers_v1`;}
  function readAnswers(week){if(preview())return {};try{return JSON.parse(localStorage.getItem(noteKey(week))||'{}')}catch{return {}}}
  function saveAnswers(){if(preview())return;try{localStorage.setItem(noteKey(session.week),JSON.stringify(session.answers));}catch(error){/* Progress markers still use the existing portal persistence. */}}
  function persist(suffix,xp=0){
    if(!valid())return;
    if(preview()){session.previewMarkers.add(suffix);return;}
    currentUser.unlockedFases=currentUser.unlockedFases||[];
    const key=marker(session.week,suffix);
    if(!currentUser.unlockedFases.includes(key))currentUser.unlockedFases.push(key);
    if(xp>0)currentUser.xp=Math.max(0,Number(currentUser.xp)||0)+xp;
    // The existing save path preserves local pending progress before sending it.
    Promise.resolve(saveStudentProgress({silent:true})).catch(()=>{});
  }
  function chapterAudioText(){
    if(!session)return '';
    const w=session.data.week;
    return [w.chapter_opening.intro,...w.story.paragraphs,...w.end_of_chapter].join(' ');
  }
  function stopChapterAudio(){
    if(!session?.audioPlaying)return;
    window.speechSynthesis?.cancel();
    session.audioPlaying=false;
    const button=page()?.querySelector('[data-n84-audio]');
    if(button)button.textContent='Ouvir capítulo';
    const status=page()?.querySelector('#n84-audio-status');
    if(status)status.textContent='Áudio pausado.';
  }
  async function playChapterAudio(){
    if(!valid())return close();
    if(session.audioPlaying)return stopChapterAudio();
    const status=page()?.querySelector('#n84-audio-status');
    if(typeof playTTS!=='function'){
      if(status)status.textContent='O áudio não está disponível neste navegador.';
      return;
    }
    session.audioPlaying=true;
    const button=page()?.querySelector('[data-n84-audio]');
    if(button)button.textContent='Parar áudio';
    if(status)status.textContent='Lendo o capítulo em inglês…';
    try{
      const last=await playTTS(chapterAudioText(),.82,'en-US');
      if(last)last.onend=()=>{
        if(session?.audioPlaying){
          session.audioPlaying=false;
          const activeButton=page()?.querySelector('[data-n84-audio]');
          if(activeButton)activeButton.textContent='Ouvir capítulo';
          const activeStatus=page()?.querySelector('#n84-audio-status');
          if(activeStatus)activeStatus.textContent='Fim do áudio do capítulo.';
        }
      };
    }catch(error){
      session.audioPlaying=false;
      if(button)button.textContent='Ouvir capítulo';
      if(status)status.textContent='Não foi possível iniciar o áudio. Tente novamente.';
    }
  }
  function words(text){return String(text).split(/([A-Za-z]+(?:['’][A-Za-z]+)*)/g).map((part,i)=>i%2?`<button type="button" class="n84-word" data-n84-word="${safe(part.toLowerCase().replace(/’/g,"'"))}" aria-label="Significado de ${safe(part)}">${safe(part)}</button>`:safe(part)).join('');}
  function read(){
    if(!valid())return close();
    const w=session.data.week;
    const insertAt={1:115,2:174,3:160}[session.week];
    view(`<article class="n84-reader"><small>Week ${w.number} of 6 · Chapter ${w.chapter_number}</small><h1>${safe(w.title)}</h1><div class="n84-audio"><button type="button" data-n84-audio><i class="fa-solid fa-volume-high"></i> Ouvir capítulo</button><span id="n84-audio-status" aria-live="polite">Áudio em inglês, com a voz disponível no seu aparelho.</span></div><p class="n84-hint">Toque em qualquer palavra em inglês para ver uma explicação em português, sem sair da leitura.</p><p>${words(w.chapter_opening.intro)}</p><img class="n84-illustration" src="${BASE+w.chapter_opening.asset}" alt="${safe(w.chapter_opening.alt_text)}"><hr>${w.story.paragraphs.map((p,i)=>`${i===insertAt?`<img class="n84-illustration ${w.number===3?'n84-warm':''}" src="${BASE+w.story.secondary_illustration.asset}" alt="${safe(w.story.secondary_illustration.alt_text)}">`:''}<p class="n84-story">${words(p)}</p>`).join('')}<section class="n84-end"><small>End of Chapter</small>${w.end_of_chapter.map(p=>`<p>${words(p)}</p>`).join('')}<button type="button" class="n84-primary" data-n84-story-done>Concluir leitura e ir para as atividades</button></section></article>`,'story');
    const owner=session.owner;
    requestAnimationFrame(()=>{if(valid()&&session.owner===owner&&session.mode==='story')overlay().scrollTo({top:Number(session.answers._scroll)||0});});
  }
  function languageQuestions(){
    const result=[];
    for(const [name,group] of Object.entries(session.data.week.language_check)){
      for(const [i,q] of (group.questions||[]).entries()){
        const choices=q.options||q.question.match(/([A-Za-z]+) \/ ([A-Za-z]+)/)?.slice(1);
        if(!choices)throw Error('Questão sem opções');
        result.push({...q,options:choices,id:`${name}_${i}`});
      }
      if(group.order_items)group.order_items.forEach((item,i)=>result.push({id:`${name}_order_${i}`,question:`${i+1}. Qual evento vem nesta posição da história?`,options:group.order_items.map(x=>x.event),answer:group.order_items.find(x=>x.id===group.answer[i]).event}));
    }
    return result;
  }
  function questions(stage=session.stage){
    const w=session.data.week;
    if(stage===0)return w.quick_check.map((q,i)=>({...q,id:`quick_${i}`,options:q.options||[true,false]}));
    if(stage===2)return languageQuestions();
    if(stage===3||stage===4)return [{...(stage===3?w.orwells_question:w.second_reflection),id:stage===3?'orwell':'reflection',reflect:true}];
    return [];
  }
  function stageResult(stage=session.stage){
    const items=questions(stage);
    const answered=items.every(q=>{
      const index=session.answers[q.id];
      return Number.isInteger(index)&&index>=0&&index<q.options.length;
    });
    const scored=items.filter(q=>!q.reflect);
    const correct=scored.filter(q=>q.options[session.answers[q.id]]===q.answer).length;
    return {answered,correct,total:scored.length,passed:answered&&(!scored.length||correct/scored.length>.5)};
  }
  function questionHtml(q){
    return `<section class="n84-question" data-question="${q.id}"><h3>${safe(q.question)}</h3><div class="n84-choices">${q.options.map((o,i)=>`<button type="button" data-n84-answer="${q.id}" data-index="${i}" aria-pressed="false">${safe(o===true?'True':o===false?'False':o)}</button>`).join('')}</div><p class="n84-answer-note">Depois de escolher, sua resposta fica registrada nesta tentativa.</p><div class="n84-feedback" aria-live="polite"></div></section>`;
  }
  function activities(){
    if(!valid())return close();
    if(!has('story'))return read();
    const stage=session.stage,w=session.data.week;
    if(stage>0&&!has(`stage_${stage-1}`)){session.stage=0;return activities();}
    session.answers._stage=stage;saveAnswers();
    let html='';
    if(stage===1)html=`<p>Toque nas palavras para revelar os significados.</p><div class="n84-vocabulary">${w.vocabulary.map(v=>`<details><summary>${safe(v.word)}</summary>${safe(v.pt)}</details>`).join('')}</div>`;
    if(stage===2)html=Object.entries(w.language_check).map(([key,g])=>`<h3>${safe(key.replaceAll('_',' '))}</h3>${g.explanation?`<p>${safe(g.explanation)}</p>`:''}${g.words?`<p>${g.words.map(safe).join(' · ')}</p>`:''}${(g.examples||g.example||[]).map(e=>`<p>${safe(e)}</p>`).join('')}`).join('');
    if(stage===5)html=`<p>Opcional: propostas para aula ou tarefa complementar. Não é preciso escrever para liberar a próxima semana.</p><details><summary>Speaking</summary><p>${safe(w.optional_classroom_mission.speaking.question)}</p>${w.optional_classroom_mission.speaking.sentence_starters.map(p=>`<p>${safe(p)}</p>`).join('')}</details><section class="n84-thoughts"><h3>Writing · ${safe(w.optional_classroom_mission.writing.word_target)}</h3><p>${safe(w.optional_classroom_mission.writing.prompt)}</p><label for="n84-optional-thoughts">Se quiser, escreva seus pensamentos</label><textarea id="n84-optional-thoughts" maxlength="1500" placeholder="Write here…">${safe(session.answers.optionalThoughts||'')}</textarea><small>Seu texto fica salvo somente neste aparelho e não é necessário para continuar.</small></section>`;
    html+=questions().map(questionHtml).join('');
    view(`<section class="n84-reader"><small>Week ${w.number} · After reading · ${stage+1}/6</small><h2>${STAGES[stage]}</h2>${html}<div class="n84-navigation">${stage>0?'<button type="button" data-n84-previous>Voltar</button>':''}<button type="button" class="n84-primary" data-n84-next>${stage===5?'Concluir semana '+w.number:'Continuar'}</button></div><p id="n84-gate" aria-live="polite"></p></section>`,'activities');
    questions().forEach(paintAnswer);
  }
  function paintAnswer(q){
    const i=session.answers[q.id];
    if(!Number.isInteger(i)||i<0||i>=q.options.length)return;
    const selected=q.options[i],el=page().querySelector(`[data-question="${q.id}"]`);
    if(!el)return;
    el.querySelectorAll('[data-n84-answer]').forEach((b,n)=>{b.setAttribute('aria-pressed',String(n===i));b.disabled=true;});
    const feedback=q.reflect?(typeof q.feedback==='string'?q.feedback:q.feedback[selected===q.preferred_answer?'preferred':'other']):selected===q.answer?'Correto.':'Resposta registrada. Revise o capítulo antes de fazer uma nova tentativa.';
    el.querySelector('.n84-feedback').textContent=feedback;
  }
  function finish(){
    if(!valid()||session.busy||!has('story')||![0,1,2,3,4].every(n=>has(`stage_${n}`)))return;
    session.busy=true;
    const already=complete(session.week);
    if(!already){
      let xp=0;
      if(!preview()){
        xp=claimXpReward(marker(session.week),200).amount;
        recordStudentUsageEvent('activity',`1984 · Semana ${session.week}`,'completed','Capítulo e atividades concluídos',false);
      }
      persist('complete',xp);
    }
    const w=session.data.week,next=session.week+1;
    view(`<section class="n84-reader n84-end"><small>Week ${w.number} completed</small><h1>Capítulo concluído</h1><p>${preview()?'Prévia da professora: nenhum progresso de aluno foi alterado.':'Sua conclusão foi registrada neste aparelho. O portal sincroniza o progresso com a nuvem.'}</p><h2>${safe(w.next_week.chapter)}</h2><p>${safe(w.next_week.teaser)}</p>${next<=3?`<button type="button" class="n84-primary" data-n84-open="${next}">Continuar para a Semana ${next}</button>`:'<p>Semana 4 em breve. Sua conclusão já deixa a continuação preparada.</p>'}<div class="n84-navigation"><button type="button" data-n84-close>Voltar à biblioteca</button></div></section>`,'done');
    updateHome();
  }
  function dictionary(word){
    if(!valid())return;
    wordTrigger=word;
    if(!dictionaryDialog){
      dictionaryDialog=document.createElement('dialog');dictionaryDialog.className='n84-dictionary';dictionaryDialog.setAttribute('aria-labelledby','n84-dictionary-word');
      dictionaryDialog.innerHTML='<div class="n84-dictionary-top"><small>Dicionário do capítulo</small><button type="button" data-n84-dictionary-close>Fechar</button></div><h2 id="n84-dictionary-word"></h2><p id="n84-dictionary-meaning"></p><small>Inglês → português · apoio à leitura</small>';
      dictionaryDialog.addEventListener('close',()=>wordTrigger?.isConnected&&wordTrigger.focus({preventScroll:true}));
      dictionaryDialog.addEventListener('click',e=>{if(e.target===dictionaryDialog){const r=dictionaryDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dictionaryDialog.close();}});
      document.body.append(dictionaryDialog);
    }
    document.getElementById('n84-dictionary-word').textContent=word.textContent;
    document.getElementById('n84-dictionary-meaning').textContent=loaded.dictionary[word.dataset.n84Word]||'Significado ainda não disponível.';
    dictionaryDialog.showModal();
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.hasAttribute('data-n84-open'))return void open(Number(target.dataset.n84Open));
    if(target.hasAttribute('data-n84-retry'))return void renderReadingLibrary();
    if(target.hasAttribute('data-n84-dictionary-close'))return dictionaryDialog?.close();
    if(!target.closest('#reading-content')||!session)return;
    if(!valid())return close();
    if(target.hasAttribute('data-n84-word'))return dictionary(target);
    if(target.hasAttribute('data-n84-audio'))return void playChapterAudio();
    if(target.hasAttribute('data-n84-close'))return close();
    if(target.hasAttribute('data-n84-story-done')){
      persist('story');
      session.stage=Number.isInteger(session.answers._retryStage)?session.answers._retryStage:0;
      delete session.answers._retryStage;saveAnswers();
      return activities();
    }
    if(session.mode!=='activities')return;
    if(target.hasAttribute('data-n84-answer')){
      const q=questions().find(q=>q.id===target.dataset.n84Answer),i=Number(target.dataset.index);
      if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;
      if(Number.isInteger(session.answers[q.id]))return;
      session.answers[q.id]=i;saveAnswers();paintAnswer(q);return;
    }
    if(target.hasAttribute('data-n84-review-retry')){
      const stage=session.stage;
      questions(stage).forEach(q=>delete session.answers[q.id]);
      session.answers._retryStage=stage;saveAnswers();
      return read();
    }
    if(target.hasAttribute('data-n84-previous')){session.stage=Math.max(0,session.stage-1);return activities();}
    if(target.hasAttribute('data-n84-next')){
      const result=stageResult();
      if(!result.answered){document.getElementById('n84-gate').textContent='Responda a todas as questões. Cada resposta só pode ser escolhida uma vez nesta tentativa.';return;}
      if(!result.passed){
        document.getElementById('n84-gate').innerHTML=`Você acertou ${result.correct} de ${result.total}. É preciso acertar mais da metade para continuar.<br><button type="button" data-n84-review-retry>Revisar o capítulo e tentar novamente</button>`;
        return;
      }
      persist(`stage_${session.stage}`);
      if(session.stage===5)return finish();
      session.stage++;activities();
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id!=='n84-optional-thoughts'||!valid()||session.mode!=='activities'||session.stage!==5)return;
    session.answers.optionalThoughts=event.target.value.slice(0,1500);
    saveAnswers();
  });
  let scrollSaveTimer;
  overlay()?.addEventListener('scroll',()=>{
    if(!valid()||session.mode!=='story')return;
    clearTimeout(scrollSaveTimer);
    const owner=session.owner,week=session.week;
    scrollSaveTimer=setTimeout(()=>{if(valid()&&session.owner===owner&&session.week===week&&session.mode==='story'){session.answers._scroll=overlay().scrollTop;saveAnswers();}},200);
  },{passive:true});
  // A restored login can render home before this external script has loaded.
  updateHome();
  if(eligible()&&!document.getElementById('stab-leitura')?.classList.contains('hidden'))renderReadingLibrary();
})();
