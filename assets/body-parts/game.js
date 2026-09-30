/* First playable chapter: head and face. Scores stay separate from class XP. */
(()=>{
  'use strict';
  const C=BodyPartsCore, image='./assets/body-parts/character.png', SET_VERSION=3;
  let host,owner=null,screen='home',mode='learn',format='visual',zoom=false,selected=null,chapter='head-face';
  let order=[],index=0,round=null,results=[],sessionId='',saved=false,saveError=false,scoreFormat='visual';
  let review=false,reviewQueue=[],reviewTeaching=false,lock=false,sound=true,audioReady=false,audioToken=0;
  let message='',voice=null;
  const current=()=>C.chapters[chapter];
  const chapterWords=()=>current().words;
  const word=id=>chapterWords().find(w=>w.id===id);
  const sessionPoints=()=>results.reduce((s,r)=>s+r.points,0);
  const phaseOnePassed=()=>records().some(r=>r.chapter==='head-face'&&r.mode==='practice'&&r.points>=C.chapters['head-face'].passPoints);
  const sessionPassed=()=>chapter==='head-face'&&mode==='practice'&&sessionPoints()>=current().passPoints;
  const button=(label,action,primary=false,extra='')=>`<button type="button" class="bp-btn${primary?' primary':''}" data-action="${action}" ${extra}>${label}</button>`;
  function key(){return owner?`ap_body_parts_v1_${encodeURIComponent(owner)}`:null;}
  function records(){try{const r=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(r)?r.filter(C.validRecord).slice(-100):[];}catch{return [];}}
  function cancelAudio(){audioToken++;window.speechSynthesis?.cancel();audioReady=false;}
  function speak(id,{preserveFeedback=false}={}){
    cancelAudio();
    if(!sound){message='Som desligado. Ligue o som para ouvir.';render();return;}
    voice=window.speechSynthesis?.getVoices().find(v=>/^en[-_]/i.test(v.lang));
    if(!voice){message='A voz em inglês não está disponível. Use Aprender ou Praticar, ou tente ouvir novamente.';render();return;}
    const token=audioToken,utterance=new SpeechSynthesisUtterance(word(id).en);
    utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.8;
    utterance.onstart=()=>{if(token===audioToken){
      audioReady=true;
      if(!preserveFeedback){
        message='Ouça e escolha a região.';
        if(mode==='listen')render();
      }
    }};
    utterance.onerror=()=>{if(token===audioToken){audioReady=false;message='Não foi possível reproduzir. Toque em Ouvir novamente ou volte aos jogos.';render();}};
    window.speechSynthesis.speak(utterance);
    setTimeout(()=>{if(token===audioToken&&!audioReady&&mode==='listen'&&screen==='play'){message='O áudio não começou. Toque em Ouvir novamente ou volte aos jogos para praticar com texto.';render();}},5000);
  }
  function start(nextMode){
    cancelAudio();mode=nextMode;screen='play';review=false;selected=null;index=0;results=[];saved=false;saveError=false;
    order=C.rounds(chapterWords());scoreFormat=format;sessionId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
    zoom=mode!=='learn'&&chapter==='head-face';message='';newRound();
  }
  function newRound(){
    lock=false;selected=null;round={target:review?reviewQueue[0]:order[index],errors:0,done:false,points:0};
    message=reviewTeaching?'Observe a palavra e a região. Depois, tente sem ajuda.':mode==='learn'?`Toque livremente no personagem para explorar ${current().short.toLowerCase()}.`:'Escolha a região correspondente.';
    render(true);if(mode==='listen'&&!reviewTeaching){message='Toque em Ouvir novamente se a pronúncia não começar.';speak(round.target);}
  }
  function choose(id,fromList=false){
    if(screen!=='play'||lock||!word(id))return;
    if(mode==='learn'){selected=id;if(chapter==='head-face')zoom=true;message=`${word(id).en} — ${word(id).pt}`;render();if(sound)speak(id);return;}
    if(reviewTeaching||round.done||(mode==='listen'&&(!sound||!audioReady)))return;
    if(fromList&&!review)scoreFormat='list';
    round=C.answer(round,id);
    if(round.done){
      selected=id;message=`✓ Correct! ${word(id).en}${round.errors===2?' — resposta com ajuda.':' — muito bem!'} Ouça a pronúncia.`;
      if(!review)results.push({...round});
      cancelAudio();render();if(sound)speak(id,{preserveFeedback:true});host.querySelector('.bp-art')?.classList.add('bp-good');
    }else{
      message=round.errors===2?'Esta é a resposta. Ouça a pronúncia e selecione a região destacada para continuar.':'Try again! Tente outra parte do corpo.';
      selected=round.errors===2?round.target:null;lock=true;render();
      if(round.errors===2&&sound)speak(round.target,{preserveFeedback:true});
      setTimeout(()=>{lock=false;},450);
    }
  }
  function next(){
    if(!round.done)return;
    if(review){const id=reviewQueue.shift();if(round.errors===2)reviewQueue.push(id);if(!reviewQueue.length){screen='result';message='Revisão concluída: você respondeu cada palavra sem a resposta revelada.';render(true);return;}reviewTeaching=true;newRound();return;}
    if(++index===order.length){screen='result';cancelAudio();message='';save();render(true);}else newRound();
  }
  function save(){
    if(saved||results.length!==order.length||!key())return;
    const record={id:sessionId,version:SET_VERSION,game:'body-parts',chapter,mode,format:scoreFormat,date:new Date().toISOString(),total:order.length,points:sessionPoints(),first:results.filter(r=>r.errors===0).length,assisted:results.filter(r=>r.errors===2).length,words:chapterWords().map(w=>({id:w.id,appearances:2,errors:results.filter(r=>r.target===w.id).reduce((s,r)=>s+r.errors,0),independent:results.filter(r=>r.target===w.id&&r.errors<2).length}))};
    try{const rows=records().filter(r=>r.id!==sessionId);localStorage.setItem(key(),JSON.stringify([...rows,record].slice(-100)));saved=true;saveError=false;}catch{saveError=true;}
  }
  function art(){
    const highlight=reviewTeaching?round.target:selected;
    const regions=chapterWords().flatMap(w=>w.regions.map(([x,y,rx,ry])=>`<ellipse class="bp-region${highlight===w.id?' selected':''}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" data-word="${w.id}"/>`)).join('');
    const faceZoom=chapter==='head-face'&&zoom;
    return `<div class="bp-art"><svg viewBox="${faceZoom?'405 15 195 205':'0 0 1024 1536'}" role="img" aria-label="${faceZoom?'Rosto ampliado do personagem.':'Personagem de corpo inteiro.'}"><image href="${image}" width="1024" height="1536"/>${regions}</svg></div>`;
  }
  function render(focus=false){
    if(!host)return;
    const focused=document.activeElement;
    const focusWord=host.contains(focused)?focused?.dataset?.word:null;
    const focusAction=host.contains(focused)?focused?.dataset?.action:null;
    if(screen==='home'){
      const unlocked=phaseOnePassed(),phaseOne=C.chapters['head-face'],phaseTwo=C.chapters['body-regions'];
      host.innerHTML=`<div class="section-header"><h2>Jogos</h2><p>Pratique inglês com desafios curtos. Explore primeiro; o teste abre a próxima etapa.</p></div><div class="bp-card bp-hero"><div><span class="bp-kicker">Touch & Learn</span><h2>Body Parts</h2><p>Conheça o corpo tocando diretamente no personagem e avance por fases.</p><p><strong>Comece livremente pelo rosto.</strong><br>Depois, faça o teste para abrir as regiões do corpo.</p>${button('Explorar a Fase 1','open-face',true)}</div><img class="bp-portrait" src="${image}" alt="Personagem ilustrado do jogo"/></div><div class="bp-phases"><button type="button" class="bp-phase active" data-action="open-face"><span class="bp-kicker">Fase 1</span><strong>${phaseOne.title}</strong><small>${unlocked?'Teste concluído. Você pode revisar quando quiser.':`${phaseOne.words.length} palavras · exploração livre e teste`}</small><em>${unlocked?'✓ Concluída':'Disponível'}</em></button><button type="button" class="bp-phase${unlocked?' active':''}" data-action="${unlocked?'open-regions':'locked-regions'}" ${unlocked?'':'disabled'}><span class="bp-kicker">Fase 2</span><strong>${phaseTwo.title}</strong><small>${unlocked?`${phaseTwo.words.length} regiões para explorar e praticar.`:`Faça o teste da Fase 1 com ${phaseOne.passPoints} de ${phaseOne.total*10} pontos.`}</small><em>${unlocked?'Disponível':'🔒 Bloqueada'}</em></button><div class="bp-phase locked"><span class="bp-kicker">Fase 3</span><strong>Detalhes e órgãos</strong><small>Rosto detalhado, mãos, tronco e órgãos internos virão nas próximas etapas.</small><em>Em preparação</em></div></div>`;
    }else if(screen==='setup'){
      const chapterInfo=current(),isPhaseOne=chapter==='head-face';
      host.innerHTML=`${button('← Voltar aos jogos','home')}<div class="bp-card"><span class="bp-kicker">Fase ${chapterInfo.phase}</span><h2>${chapterInfo.title}</h2><p class="bp-muted">${chapterInfo.description}</p><div class="bp-actions">${button('Explorar livremente','learn',true)}${button(isPhaseOne?'Fazer o teste da Fase 1':'Praticar','practice')}${button('Ouvir','listen')}</div><div class="bp-actions">${button('No personagem','visual',false,`aria-pressed="${format==='visual'}"`)}${button('Atividade em lista','list',false,`aria-pressed="${format==='list'}"`)}</div><p class="bp-muted">${chapterInfo.words.length} palavras em ${chapterInfo.total} rodadas. ${isPhaseOne?`Conclua o teste com pelo menos ${chapterInfo.passPoints} de ${chapterInfo.total*10} pontos para liberar a Fase 2.`:'A lista associa inglês às alternativas em português. Seus recordes ficam separados por formato.'}</p><p class="bp-muted">Ouvir precisa de som. A pronúncia usa a voz em inglês disponível no navegador. Não é necessário microfone.</p></div>`;
    }else if(screen==='result'){
      const errors=[...new Set(results.filter(r=>r.errors>0).map(r=>r.target))];
      const total=order.length||current().total,passed=sessionPassed();
      host.innerHTML=`<div class="bp-card"><span class="bp-kicker">${current().title} · Resultado</span><h2>${passed?'Fase 2 liberada!':'Etapa praticada!'}</h2><div class="bp-stats"><div><strong>${sessionPoints()} / ${total*10}</strong>pontos</div><div><strong>${results.filter(r=>!r.errors).length} / ${total}</strong>de primeira</div><div><strong>${results.filter(r=>r.errors<2).length} / ${total}</strong>sem revelar a resposta</div></div><p>${passed?`Você alcançou os ${current().passPoints} pontos necessários. Agora pode explorar as regiões do corpo.`:errors.length?'Vamos revisar: '+errors.map(id=>word(id).en).join(', '):'Você acertou todas na primeira tentativa!'}</p><p role="status">${message}</p><div class="bp-actions">${passed?button('Ir para a Fase 2','open-regions',true):button(errors.length?'Revisar palavras':'Explorar as palavras',errors.length?'review':'learn',true)}${button('Jogar novamente',mode)}${button('Voltar aos jogos','home')}</div><p class="bp-muted">${saveError?'Não foi possível salvar. Seu resultado continua aqui.':saved?'Resultado salvo para sua conta neste dispositivo. Não sincronizado com a professora.':'Resultado disponível nesta tela.'}</p>${saveError?button('Tentar salvar novamente','save'):''}</div>`;
    }else{
      const learning=mode==='learn',reveal=learning||round.done||round.errors===2||reviewTeaching;
      const target=learning?selected:round.target;
      const title=learning?(selected?word(selected).en:'Explore o rosto'):reviewTeaching?word(round.target).en:mode==='listen'&&!reveal?'Ouça a palavra':word(round.target).en;
      const total=order.length||current().total;
      const example=learning&&selected?`<div class="bp-example"><span>Use em uma frase</span><strong>${word(target).example}</strong><small>${word(target).examplePt}</small></div>`:'';
      const modeLabel=learning?'Exploração livre · sem pontuação':review?'Revisão · sem alterar seus pontos':`${mode==='listen'?'Ouvir':'Teste'} · Rodada ${index+1} de ${total} · ${sessionPoints()} pontos`;
      host.innerHTML=`<div class="bp-actions">${button(review?'Continuar depois':'← Sair','exit')}${button(sound?'Som ligado':'Som desligado','sound',false,`aria-pressed="${sound}"`)}${learning&&format==='visual'&&chapter==='head-face'?button(zoom?'Ver corpo inteiro':'Ampliar o rosto','zoom'):''}</div><div class="bp-card"><span class="bp-kicker">${modeLabel}</span>${!learning&&!review?`<progress class="bp-progress" value="${index}" max="${total}" aria-label="Rodadas concluídas"></progress>`:''}<div class="bp-stage">${format==='visual'?art():''}<div><h2 class="bp-word" tabindex="-1">${title}</h2>${learning&&selected||reviewTeaching?`<p>${word(target).pt}</p>`:''}${example}<p class="bp-muted">${learning?'Toque em qualquer região destacável do personagem ou escolha abaixo.':mode==='listen'&&!sound?'Exercício pausado. Ligue o som para continuar.':'Selecione no desenho ou nos botões abaixo.'}</p>${target?button('Ouvir novamente','audio'):''}<div class="bp-options" aria-label="Partes do corpo">${chapterWords().map(w=>`<button type="button" data-word="${w.id}" class="${(reviewTeaching?round.target:selected)===w.id?'selected':''}" ${!learning&&(round.done||reviewTeaching||mode==='listen'&&(!sound||!audioReady))?'disabled':''}>${learning?w.en+' · ':''}${w.pt}</button>`).join('')}</div><div class="bp-status" role="status" aria-live="polite">${message}</div>${reviewTeaching?button('Tentar sem ajuda','try',true):!learning&&round.done?button(review?'Próxima palavra':index===total-1?'Ver resultado':'Próxima','next',true):''}${learning?`<div class="bp-actions">${button(chapter==='head-face'?'Fazer o teste da Fase 1':'Praticar regiões','practice',true)}</div>`:''}<p class="bp-muted">${format==='visual'?'Os botões ajudam nas regiões pequenas. Ao usá-los no teste, o recorde conta como atividade em lista.':''}</p></div></div></div>`;
    }
    if(focus)host.querySelector('h2')?.setAttribute('tabindex','-1');
    if(focus)host.querySelector('h2')?.focus({preventScroll:true});
    else if(focusWord||focusAction){
      const candidate=host.querySelector(focusWord?`button[data-word="${focusWord}"]`:`button[data-action="${focusAction}"]`);
      if(candidate&&!candidate.disabled)candidate.focus({preventScroll:true});
      else host.querySelector('[data-action="next"]')?.focus({preventScroll:true});
    }
  }
  function leave(){if(screen==='play'&&mode!=='learn'&&!review&&!window.confirm('Sair desta partida? O resultado incompleto não será salvo.'))return false;cancelAudio();screen='home';return true;}
  function action(a){
    if(['learn','practice','listen'].includes(a)){start(a);return;}
    if(a==='open'||a==='open-face'){chapter='head-face';screen='setup';}
    if(a==='open-regions'){if(!phaseOnePassed()&&!sessionPassed()){screen='home';message='Conclua o teste da Fase 1 antes de abrir as regiões do corpo.';}else{chapter='body-regions';screen='setup';}}
    if(a==='locked-regions'){message='Conclua o teste da Fase 1 para liberar as regiões do corpo.';screen='home';}
    if(a==='home'){cancelAudio();screen='home';}
    if(a==='exit'){if(!leave())return;}
    if(a==='visual'||a==='list')format=a;
    if(a==='zoom')zoom=!zoom;
    if(a==='next'){next();return;}
    if(a==='audio'){speak(mode==='learn'?selected:round.target);return;}
    if(a==='sound'){sound=!sound;cancelAudio();if(!sound)message='Som desligado.';else if(mode==='listen')speak(round.target);}
    if(a==='review'){cancelAudio();review=true;reviewQueue=[...new Set(results.filter(r=>r.errors>0).map(r=>r.target))];reviewTeaching=true;screen='play';newRound();return;}
    if(a==='try'){reviewTeaching=false;selected=null;message='Agora encontre a região sem destaque.';if(mode==='listen')speak(round.target);}
    if(a==='save')save();
    render();
  }
  window.BodyParts={
    open(userId){
      host=document.getElementById('body-parts-root');
      if(!host)return;
      if(owner!==String(userId||'')){owner=String(userId||'');cancelAudio();screen='home';results=[];}
      if(!host.dataset.bound){host.dataset.bound='true';host.addEventListener('click',e=>{const el=e.target.closest('[data-action],[data-word]');if(!el)return;if(el.dataset.word)choose(el.dataset.word,el.tagName==='BUTTON');else action(el.dataset.action);});}
      render();
    },leave,reset(){cancelAudio();screen='home';results=[];owner=null;if(host)host.replaceChildren();},
    active(){return screen==='play'&&mode!=='learn';}
  };
  window.addEventListener('beforeunload',e=>{if(BodyParts.active()){e.preventDefault();e.returnValue='';}});
})();
