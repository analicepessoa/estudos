/* First playable chapter: head and face. Scores stay separate from class XP. */
(()=>{
  'use strict';
  const C=BodyPartsCore, image='./assets/body-parts/character.png', SET_VERSION=2;
  let host,owner=null,screen='home',mode='learn',format='visual',zoom=false,selected=null;
  let order=[],index=0,round=null,results=[],sessionId='',saved=false,saveError=false,scoreFormat='visual';
  let review=false,reviewQueue=[],reviewTeaching=false,lock=false,sound=true,audioReady=false,audioToken=0;
  let message='',voice=null;
  const word=id=>C.words.find(w=>w.id===id);
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
    order=C.rounds();scoreFormat=format;sessionId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
    zoom=mode!=='learn';message='';newRound();
  }
  function newRound(){
    lock=false;selected=null;round={target:review?reviewQueue[0]:order[index],errors:0,done:false,points:0};
    message=reviewTeaching?'Observe a palavra e a região. Depois, tente sem ajuda.':mode==='learn'?'Toque no rosto para explorar.':'Escolha a região correspondente.';
    render(true);if(mode==='listen'&&!reviewTeaching){message='Toque em Ouvir novamente se a pronúncia não começar.';speak(round.target);}
  }
  function choose(id,fromList=false){
    if(screen!=='play'||lock||!word(id))return;
    if(mode==='learn'){selected=id;zoom=true;message=`${word(id).en} — ${word(id).pt}`;render();if(sound)speak(id);return;}
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
    const record={id:sessionId,version:SET_VERSION,game:'body-parts',chapter:'head-face',mode,format:scoreFormat,date:new Date().toISOString(),total:order.length,points:results.reduce((s,r)=>s+r.points,0),first:results.filter(r=>r.errors===0).length,assisted:results.filter(r=>r.errors===2).length,words:C.words.map(w=>({id:w.id,appearances:2,errors:results.filter(r=>r.target===w.id).reduce((s,r)=>s+r.errors,0),independent:results.filter(r=>r.target===w.id&&r.errors<2).length}))};
    try{const rows=records().filter(r=>r.id!==sessionId);localStorage.setItem(key(),JSON.stringify([...rows,record].slice(-100)));saved=true;saveError=false;}catch{saveError=true;}
  }
  function art(){
    const highlight=reviewTeaching?round.target:selected;
    const regions=C.words.flatMap(w=>w.regions.map(([x,y,rx,ry])=>`<ellipse class="bp-region${highlight===w.id?' selected':''}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" data-word="${w.id}"/>`)).join('');
    return `<div class="bp-art"><svg viewBox="${zoom?'405 15 195 205':'0 0 1024 1536'}" role="img" aria-label="${zoom?'Rosto ampliado do personagem. Use também os botões abaixo para selecionar.':'Personagem de corpo inteiro.'}"><image href="${image}" width="1024" height="1536"/>${zoom?regions:'<rect class="bp-body-link" x="410" y="20" width="185" height="205" rx="45" data-action="zoom"/>'}</svg></div>`;
  }
  function render(focus=false){
    if(!host)return;
    const focused=document.activeElement;
    const focusWord=host.contains(focused)?focused?.dataset?.word:null;
    const focusAction=host.contains(focused)?focused?.dataset?.action:null;
    if(screen==='home'){
      const best=records().filter(record=>record.version===SET_VERSION),total=C.words.length*2;
      host.innerHTML=`<div class="section-header"><h2>Jogos</h2><p>Pratique inglês com desafios curtos. Escolha um jogo para começar.</p></div><div class="bp-card bp-hero"><div><span class="bp-kicker">Touch & Learn</span><h2>Body Parts</h2><p>Conheça o corpo, explore cada região e pratique com palavras e sons.</p><div class="bp-map"><span class="active">Fase 1 · Corpo</span><span>Depois · Detalhes</span><span>Depois · Órgãos</span></div><p><strong>Primeira etapa disponível: cabeça e rosto.</strong><br>${C.words.length} palavras · partidas de ${total} rodadas · sem cronômetro</p>${button('Explorar e jogar','open',true)}</div><img class="bp-portrait" src="${image}" alt="Personagem ilustrado do jogo"/></div><p class="bp-muted">Nesta primeira entrega, as outras regiões e fases ainda estão em preparação.</p>${best.length?`<div class="bp-card"><h3>Seus recordes nesta versão</h3>${['practice','listen'].flatMap(m=>['visual','list'].map(f=>{const rs=best.filter(r=>r.mode===m&&r.format===f);return rs.length?`<p>${m==='practice'?'Praticar':'Ouvir'} · ${f==='visual'?'personagem':'lista'}: <strong>${Math.max(...rs.map(r=>r.points))} de ${total*10}</strong></p>`:'';})).join('')}</div>`:''}`;
    }else if(screen==='setup'){
      host.innerHTML=`${button('← Voltar aos jogos','home')}<div class="bp-card"><span class="bp-kicker">Fase 1 · Etapa 1</span><h2>Cabeça e rosto</h2><p class="bp-muted">Comece explorando. Depois, encontre no personagem a palavra escrita ou ouvida em inglês.</p><div class="bp-actions">${button('Aprender','learn',true)}${button('Praticar','practice')}${button('Ouvir','listen')}</div><div class="bp-actions">${button('No personagem','visual',false,`aria-pressed="${format==='visual'}"`)}${button('Atividade em lista','list',false,`aria-pressed="${format==='list'}"`)}</div><p class="bp-muted">${C.words.length} palavras em ${C.words.length*2} rodadas. A lista associa inglês às alternativas em português. Seus recordes ficam separados por formato.</p><p class="bp-muted">Ouvir precisa de som. A pronúncia usa a voz em inglês disponível no navegador. Não é necessário microfone.</p></div>`;
    }else if(screen==='result'){
      const errors=[...new Set(results.filter(r=>r.errors>0).map(r=>r.target))];
      const total=order.length||C.words.length*2;
      host.innerHTML=`<div class="bp-card"><span class="bp-kicker">Cabeça e rosto · Resultado</span><h2>Etapa praticada!</h2><div class="bp-stats"><div><strong>${results.reduce((s,r)=>s+r.points,0)} / ${total*10}</strong>pontos</div><div><strong>${results.filter(r=>!r.errors).length} / ${total}</strong>de primeira</div><div><strong>${results.filter(r=>r.errors<2).length} / ${total}</strong>sem revelar a resposta</div></div><p>${errors.length?'Vamos revisar: '+errors.map(id=>word(id).en).join(', '):'Você acertou todas na primeira tentativa!'}</p><p role="status">${message}</p><div class="bp-actions">${button(errors.length?'Revisar palavras':'Explorar as palavras',errors.length?'review':'learn',true)}${button('Jogar novamente',mode)}${button('Voltar aos jogos','home')}</div><p class="bp-muted">${saveError?'Não foi possível salvar. Seu resultado continua aqui.':saved?'Resultado salvo para sua conta neste dispositivo. Não sincronizado com a professora.':'Resultado disponível nesta tela.'}</p>${saveError?button('Tentar salvar novamente','save'):''}</div>`;
    }else{
      const learning=mode==='learn',reveal=learning||round.done||round.errors===2||reviewTeaching;
      const target=learning?selected:round.target;
      const title=learning?(selected?word(selected).en:'Explore o rosto'):reviewTeaching?word(round.target).en:mode==='listen'&&!reveal?'Ouça a palavra':word(round.target).en;
      const total=order.length||C.words.length*2;
      const example=learning&&selected?`<div class="bp-example"><span>Use em uma frase</span><strong>${word(target).example}</strong><small>${word(target).examplePt}</small></div>`:'';
      host.innerHTML=`<div class="bp-actions">${button(review?'Continuar depois':'← Sair','exit')}${button(sound?'Som ligado':'Som desligado','sound',false,`aria-pressed="${sound}"`)}${learning&&format==='visual'?button(zoom?'Ver corpo inteiro':'Explorar o rosto','zoom'):''}</div><div class="bp-card"><span class="bp-kicker">${learning?'Aprender · sem pontuação':review?'Revisão · sem alterar seus pontos':`${mode==='listen'?'Ouvir':'Praticar'} · Rodada ${index+1} de ${total} · ${results.reduce((s,r)=>s+r.points,0)} pontos`}</span>${!learning&&!review?`<progress class="bp-progress" value="${index}" max="${total}" aria-label="Rodadas concluídas"></progress>`:''}<div class="bp-stage">${format==='visual'?art():''}<div><h2 class="bp-word" tabindex="-1">${title}</h2>${learning&&selected||reviewTeaching?`<p>${word(target).pt}</p>`:''}${example}<p class="bp-muted">${learning?'Toque em uma região ou escolha abaixo.':mode==='listen'&&!sound?'Exercício pausado. Ligue o som para continuar.':'Selecione no desenho ou nos botões abaixo.'}</p>${target?button('Ouvir novamente','audio'):''}<div class="bp-options" aria-label="Partes do corpo">${C.words.map(w=>`<button type="button" data-word="${w.id}" class="${(reviewTeaching?round.target:selected)===w.id?'selected':''}" ${!learning&&(round.done||reviewTeaching||mode==='listen'&&(!sound||!audioReady))?'disabled':''}>${learning?w.en+' · ':''}${w.pt}</button>`).join('')}</div><div class="bp-status" role="status" aria-live="polite">${message}</div>${reviewTeaching?button('Tentar sem ajuda','try',true):!learning&&round.done?button(review?'Próxima palavra':index===total-1?'Ver resultado':'Próxima','next',true):''}${learning?`<div class="bp-actions">${button('Vamos praticar','practice',true)}</div>`:''}<p class="bp-muted">${format==='visual'?'Os botões ajudam nas regiões pequenas. Ao usá-los na prática, o recorde conta como atividade em lista.':''}</p></div></div></div>`;
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
    if(a==='open')screen='setup';
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
