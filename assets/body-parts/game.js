/* First playable chapter: head and face. Scores stay separate from class XP. */
(()=>{
  'use strict';
  const C=BodyPartsCore, image='./assets/body-parts/character.png', SET_VERSION=7;
  let host,owner=null,screen='home',mode='learn',format='visual',zoom=false,selected=null,chapter='basic-body',detailArea=null;
  let order=[],index=0,round=null,results=[],sessionId='',saved=false,saveError=false,scoreFormat='visual';
  let review=false,reviewQueue=[],reviewTeaching=false,lock=false,sound=true,audioReady=false,audioToken=0;
  let message='',voice=null,selectionTimer=0,wrongSelected=null;
  const current=()=>C.chapters[chapter];
  const chapterWords=()=>current().words;
  const word=id=>chapterWords().find(w=>w.id===id);
  const sessionPoints=()=>results.reduce((s,r)=>s+r.points,0);
  const adminPreview=()=>typeof window.isTeacherPreview==='function'&&window.isTeacherPreview();
  const phaseOnePassed=()=>records().some(r=>[4,5,6,SET_VERSION].includes(r.version)&&r.chapter==='basic-body'&&r.mode==='practice'&&r.points>=C.chapters['basic-body'].passPoints);
  const sessionPassed=()=>chapter==='basic-body'&&mode==='practice'&&sessionPoints()>=current().passPoints;
  const button=(label,action,primary=false,extra='')=>`<button type="button" class="bp-btn${primary?' primary':''}" data-action="${action}" ${extra}>${label}</button>`;
  function key(){return owner?`ap_body_parts_v1_${encodeURIComponent(owner)}`:null;}
  function records(){try{const r=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(r)?r.filter(C.validRecord).slice(-100):[];}catch{return [];}}
  function clearSelectionTimer(){if(selectionTimer){clearTimeout(selectionTimer);selectionTimer=0;}}
  function cancelAudio(){audioToken++;window.speechSynthesis?.cancel();audioReady=false;}
  function speak(id,{preserveFeedback=false}={}){
    cancelAudio();
    if(!sound){message='Som desligado. Ligue o som para ouvir.';render();return;}
    voice=window.speechSynthesis?.getVoices().find(v=>/^en[-_]/i.test(v.lang));
    if(!voice){message='A voz em inglês não está disponível. Use Aprender ou Praticar, ou tente ouvir novamente.';render();return;}
    const token=audioToken,utterance=new SpeechSynthesisUtterance(word(id).say||word(id).en);
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
    if(nextMode==='learn'&&chapter==='body-details'){
      cancelAudio();mode='learn';screen='detail-map';selected=null;detailArea=null;message='';render(true);return;
    }
    cancelAudio();mode=nextMode;screen='play';review=false;selected=null;index=0;results=[];saved=false;saveError=false;
    order=C.rounds(chapterWords()).slice(0,current().total);scoreFormat=format;sessionId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
    zoom=false;message='';newRound();
  }
  function newRound(){
    lock=false;selected=null;wrongSelected=null;round={target:review?reviewQueue[0]:order[index],errors:0,done:false,points:0};
    message=reviewTeaching?'Observe a palavra e a região. Depois, tente sem ajuda.':mode==='learn'?`Toque livremente no personagem para explorar ${current().short.toLowerCase()}.`:'Escolha a região correspondente.';
    render(true);if(mode==='listen'&&!reviewTeaching){message='Toque em Ouvir novamente se a pronúncia não começar.';speak(round.target);}
  }
  function choose(id,fromList=false){
    if(screen!=='play'||lock||!word(id))return;
    if(mode==='learn'){
      clearSelectionTimer();selected=id;message=`${word(id).en} — ${word(id).pt}`;render();if(sound)speak(id);
      selectionTimer=setTimeout(()=>{selectionTimer=0;if(screen==='play'&&mode==='learn'&&selected===id){selected=null;message='';render();}},2600);
      return;
    }
    if(reviewTeaching||round.done||(mode==='listen'&&(!sound||!audioReady)))return;
    if(fromList&&!review)scoreFormat='list';
    round=C.answer(round,id);
    if(round.done){
      selected=id;message=`✓ Correct! ${word(id).en}${round.errors===2?' — resposta com ajuda.':' — muito bem!'} Ouça a pronúncia.`;
      if(!review)results.push({...round});
      cancelAudio();render();if(sound)speak(id,{preserveFeedback:true});host.querySelector('.bp-art')?.classList.add('bp-good');
    }else{
      message=round.errors===2?'Esta é a resposta. Ouça a pronúncia e selecione a região destacada para continuar.':'Try again! Tente outra parte do corpo.';
      selected=round.errors===2?round.target:null;wrongSelected=round.errors===2?null:id;lock=true;render();
      if(round.errors===2&&sound)speak(round.target,{preserveFeedback:true});
      setTimeout(()=>{lock=false;wrongSelected=null;if(screen==='play')render();},520);
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
  const basicOutlines={
    head:['M445 79 Q462 30 518 24 Q574 31 592 82 L590 150 Q579 205 519 226 Q458 207 446 151 Z'],
    hair:['M451 89 Q445 36 483 20 Q529 -1 570 27 Q593 46 589 92 Q570 59 548 54 Q511 40 475 61 Q462 69 451 89 Z'],
    eye:['M459 111 Q481 98 504 112 Q483 126 459 111 Z','M523 118 Q545 105 568 120 Q546 133 523 118 Z'],
    ear:['M430 124 Q416 130 420 158 Q424 178 440 180 Q449 165 446 139 Q442 125 430 124 Z','M578 140 Q593 142 594 165 Q592 188 578 191 Q569 174 570 153 Q571 142 578 140 Z'],
    nose:['M518 119 Q509 140 507 151 Q518 158 530 151 Q526 135 518 119 Z'],
    mouth:['M489 168 Q503 158 518 164 Q532 159 547 171 Q532 184 518 184 Q502 183 489 168 Z'],
    neck:['M481 205 Q489 242 477 274 L558 276 Q546 244 553 210 Q520 229 481 205 Z'],
    shoulder:['M353 315 Q380 277 447 265 Q475 269 488 292','M549 293 Q568 270 603 270 Q663 281 694 320'],
    arm:['M354 316 Q321 349 314 427 Q307 501 331 544 Q355 536 374 486 Q392 421 403 344','M692 321 Q727 351 736 426 Q744 500 719 545 Q696 535 676 486 Q657 418 647 344'],
    elbow:['M314 519 Q334 507 355 522 Q366 544 350 567 Q326 574 309 553 Z','M682 524 Q703 508 724 523 Q739 546 722 568 Q698 575 680 554 Z'],
    forearm:['M316 553 Q298 584 268 680 Q254 728 270 760 Q293 750 310 713 L348 574','M718 554 Q738 587 767 681 Q781 730 764 760 Q742 750 725 713 L684 574'],
    hand:['M269 744 Q245 754 218 787 Q196 815 205 844 Q226 862 253 843 L292 795 Q300 765 269 744 Z','M764 744 Q790 752 816 786 Q839 815 830 845 Q808 862 782 842 L744 795 Q736 765 764 744 Z'],
    finger:['M204 807 Q177 829 179 861 Q183 884 202 881 L236 848 Q246 831 233 814','M832 807 Q859 829 857 861 Q853 884 834 881 L800 848 Q790 831 803 814'],
    chest:['M404 326 Q449 303 512 326 Q516 348 512 411 Q473 447 410 432 Q387 397 404 326 Z','M524 326 Q586 303 632 327 Q649 397 625 432 Q562 447 524 411 Q520 350 524 326 Z'],
    waist:['M431 587 Q470 605 518 606 Q567 605 607 587 Q596 636 563 652 Q518 663 473 651 Q441 635 431 587 Z'],
    thigh:['M397 762 Q430 741 479 758 L493 967 Q473 1000 434 975 Q406 912 397 762 Z','M543 758 Q592 741 625 763 Q616 913 589 976 Q550 1000 530 967 Z'],
    knee:['M420 981 Q455 964 489 988 Q497 1025 480 1053 Q448 1067 419 1047 Q405 1017 420 981 Z','M546 988 Q580 964 614 982 Q629 1018 614 1048 Q585 1067 553 1053 Q536 1025 546 988 Z'],
    leg:['M421 1050 Q455 1035 485 1055 Q481 1198 458 1332 Q432 1350 409 1328 Q410 1178 421 1050 Z','M550 1055 Q580 1035 614 1050 Q625 1178 626 1328 Q603 1350 577 1332 Q554 1198 550 1055 Z'],
    foot:['M389 1320 Q429 1305 461 1331 L477 1408 Q441 1435 384 1423 Q362 1391 389 1320 Z','M575 1331 Q607 1305 647 1320 Q674 1391 652 1423 Q595 1435 559 1408 Z'],
    toe:['M350 1418 Q389 1397 430 1412 Q425 1468 371 1488 Q340 1479 350 1418 Z','M606 1412 Q647 1397 686 1418 Q696 1479 665 1488 Q611 1468 606 1412 Z']
  };
  function outlineMarkup(w){
    if(chapter!=='basic-body')return w.regions.map(([x,y,rx,ry])=>`<ellipse class="bp-body-outline" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('');
    const paths=basicOutlines[w.id];
    return paths?paths.map(d=>`<path class="bp-body-outline" d="${d}"/>`).join(''):'';
  }
  function art(){
    const highlight=reviewTeaching?round.target:selected;
    const visibleWords=chapter==='body-details'&&detailArea?chapterWords().filter(w=>w.area===detailArea):chapterWords();
    const regions=visibleWords.map(w=>{const hits=w.regions.map(([x,y,rx,ry])=>{const hitRx=Math.max(rx,chapter==='basic-body'?30:22),hitRy=Math.max(ry,chapter==='basic-body'?22:18);return `<ellipse class="bp-region" cx="${x}" cy="${y}" rx="${hitRx}" ry="${hitRy}" data-word="${w.id}" role="button" tabindex="0" aria-label="${w.en}: ${w.pt}"><title>${w.en} · ${w.pt}</title></ellipse>`;}).join('');const state=highlight===w.id?' selected':wrongSelected===w.id?' wrong':'';return `<g class="bp-zone${state}" data-zone="${w.id}">${outlineMarkup(w)}${hits}</g>`;}).join('');
    const area=C.detailAreas?.[detailArea],viewBox=area?.viewBox||'0 0 1024 1536';
    const clickLabel=mode==='learn'&&selected?`<div class="bp-hit-label" role="status"><strong>${word(selected).en}</strong><span>${word(selected).pt}</span></div>`:'';
    return `<div class="bp-art${area?' detail-zoom':''}"><svg viewBox="${viewBox}" role="img" aria-label="${area?`Detalhes de ${area.label}.`: 'Personagem de corpo inteiro. Passe o mouse ou toque em uma região para ouvir a palavra.'}"><image href="${image}" width="1024" height="1536"/>${regions}</svg>${clickLabel}</div>`;
  }
  function detailMapArt(){
    const regions=Object.values(C.detailAreas).filter(area=>area.primary!==false).flatMap(area=>area.regions.map(([x,y,rx,ry])=>`<ellipse class="bp-region bp-detail-region" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" data-detail-area="${area.id}" role="button" tabindex="0" aria-label="${area.label}"><title>${area.label}</title></ellipse>`)).join('');
    return `<div class="bp-art bp-detail-map"><svg viewBox="0 0 1024 1536" role="img" aria-label="Corpo inteiro. Escolha uma região para ver os detalhes."><image href="${image}" width="1024" height="1536"/>${regions}</svg></div>`;
  }
  function compactChoices(targetId){
    const items=chapterWords(),targetIndex=items.findIndex(item=>item.id===targetId);
    if(targetIndex<0)return items;
    const indexes=[targetIndex,(targetIndex+3)%items.length,(targetIndex+7)%items.length,(targetIndex+11)%items.length];
    return [...new Map(indexes.map(index=>[items[index].id,items[index]])).values()];
  }
  function render(focus=false){
    if(!host)return;
    const focused=document.activeElement;
    const focusWord=host.contains(focused)?focused?.dataset?.word:null;
    const focusAction=host.contains(focused)?focused?.dataset?.action:null;
    if(screen==='home'){
      const reviewing=adminPreview(),unlocked=reviewing||phaseOnePassed(),phaseOne=C.chapters['basic-body'],phaseTwo=C.chapters['body-details'];
      host.innerHTML=`<div class="section-header"><h2>Jogos</h2><p>Pratique inglês com desafios curtos. Explore primeiro; o teste abre a próxima etapa.</p></div><div class="bp-card bp-hero"><div><span class="bp-kicker">Touch & Learn</span><h2>Body Parts</h2><p>Conheça o corpo inteiro tocando diretamente no personagem e avance por fases.</p><p><strong>Comece pelo vocabulário básico do corpo.</strong><br>Depois, faça o teste para abrir os detalhes de cada região.</p>${button('Explorar a Fase 1','open-basic',true)}</div><img class="bp-portrait" src="${image}" alt="Personagem ilustrado do jogo"/></div><div class="bp-phases"><button type="button" class="bp-phase active" data-action="open-basic"><span class="bp-kicker">Fase 1</span><strong>${phaseOne.title}</strong><small>${reviewing?'Prévia administrativa: conteúdo liberado para revisão.':unlocked?'Teste concluído. Você pode revisar quando quiser.':`${phaseOne.words.length} palavras · corpo inteiro, exploração e teste`}</small><em>${unlocked?'✓ Disponível':'Disponível'}</em></button><button type="button" class="bp-phase${unlocked?' active':''}" data-action="${unlocked?'open-details':'locked-regions'}" ${unlocked?'':'disabled'}><span class="bp-kicker">Fase 2</span><strong>${phaseTwo.title}</strong><small>${unlocked?`${phaseTwo.words.length} detalhes para explorar e praticar.`:`Faça o teste da Fase 1 com ${phaseOne.passPoints} de ${phaseOne.total*10} pontos.`}</small><em>${unlocked?'Disponível para revisão':'🔒 Bloqueada'}</em></button><div class="bp-phase locked"><span class="bp-kicker">Fase 3</span><strong>Órgãos internos</strong><small>Os órgãos internos serão a próxima etapa de exploração.</small><em>Em preparação</em></div></div>`;
    }else if(screen==='setup'){
      const chapterInfo=current(),isPhaseOne=chapter==='basic-body';
      host.innerHTML=`${button('← Voltar aos jogos','home')}<div class="bp-card"><span class="bp-kicker">Fase ${chapterInfo.phase}</span><h2>${chapterInfo.title}</h2><p class="bp-muted">${chapterInfo.description}</p><div class="bp-actions">${button('Explorar livremente','learn',true)}${button(isPhaseOne?'Fazer o teste da Fase 1':'Praticar','practice')}${button('Ouvir','listen')}</div><div class="bp-actions">${button('No personagem','visual',false,`aria-pressed="${format==='visual'}"`)}${button('Atividade em lista','list',false,`aria-pressed="${format==='list'}"`)}</div><p class="bp-muted">${chapterInfo.words.length} palavras em ${chapterInfo.total} rodadas. ${isPhaseOne?`Conclua o teste com pelo menos ${chapterInfo.passPoints} de ${chapterInfo.total*10} pontos para liberar a Fase 2.`:'A lista associa inglês às alternativas em português. Seus recordes ficam separados por formato.'}</p><p class="bp-muted">Ouvir precisa de som. A pronúncia usa a voz em inglês disponível no navegador. Não é necessário microfone.</p></div>`;
    }else if(screen==='detail-map'){
      const areas=Object.values(C.detailAreas).filter(area=>area.primary!==false);
      host.innerHTML=`${button('← Voltar aos jogos','home')}<div class="bp-card"><span class="bp-kicker">Fase 2 · Detalhes por região</span><h2>Escolha uma região</h2><p class="bp-muted">Toque em uma área verde no corpo ou escolha uma região abaixo. A imagem aproxima a região escolhida e mostra somente seus detalhes.</p><div class="bp-detail-options">${areas.map(area=>`<button type="button" data-detail-area="${area.id}" class="bp-detail-choice"><strong>${area.label}</strong><small>${area.hint}</small></button>`).join('')}</div><div class="bp-detail-map-wrap">${detailMapArt()}</div></div>`;
    }else if(screen==='result'){
      const errors=[...new Set(results.filter(r=>r.errors>0).map(r=>r.target))];
      const total=order.length||current().total,passed=sessionPassed();
      host.innerHTML=`<div class="bp-card"><span class="bp-kicker">${current().title} · Resultado</span><h2>${passed?'Fase 2 liberada!':'Etapa praticada!'}</h2><div class="bp-stats"><div><strong>${sessionPoints()} / ${total*10}</strong>pontos</div><div><strong>${results.filter(r=>!r.errors).length} / ${total}</strong>de primeira</div><div><strong>${results.filter(r=>r.errors<2).length} / ${total}</strong>sem revelar a resposta</div></div><p>${passed?`Você alcançou os ${current().passPoints} pontos necessários. Agora pode explorar os detalhes por região.`:errors.length?'Vamos revisar: '+errors.map(id=>word(id).en).join(', '):'Você acertou todas na primeira tentativa!'}</p><p role="status">${message}</p><div class="bp-actions">${passed?button('Ir para a Fase 2','open-details',true):button(errors.length?'Revisar palavras':'Explorar as palavras',errors.length?'review':'learn',true)}${button('Jogar novamente',mode)}${button('Voltar aos jogos','home')}</div><p class="bp-muted">${saveError?'Não foi possível salvar. Seu resultado continua aqui.':saved?'Resultado salvo para sua conta neste dispositivo. Não sincronizado com a professora.':'Resultado disponível nesta tela.'}</p>${saveError?button('Tentar salvar novamente','save'):''}</div>`;
    }else{
      const learning=mode==='learn',reveal=learning||round.done||round.errors===2||reviewTeaching;
      const target=learning?selected:round.target;
      const title=learning?(selected?word(selected).en:`Explore ${C.detailAreas?.[detailArea]?.label||current().short}`):reviewTeaching?word(round.target).en:mode==='listen'&&!reveal?'Ouça a palavra':word(round.target).en;
      const total=order.length||current().total;
      const example=learning&&selected?`<div class="bp-example"><span>Use em uma frase</span><strong>${word(target).example}</strong><small>${word(target).examplePt}</small></div>`:'';
      const modeLabel=learning?'Exploração livre · sem pontuação':review?'Revisão · sem alterar seus pontos':`${mode==='listen'?'Ouvir':'Teste'} · Rodada ${index+1} de ${total} · ${sessionPoints()} pontos`;
      const options=learning&&chapter==='body-details'&&detailArea?chapterWords().filter(w=>w.area===detailArea):!learning&&format==='visual'?compactChoices(round.target):chapterWords();
      const detailBack=detailArea==='fingers'?button('← Braços e mãos','open-hands'):button('← Regiões','detail-map');
      const fingerShortcut=learning&&detailArea==='hands'?button('Dedos da mão','open-fingers',true):'';
      host.innerHTML=`<div class="bp-actions">${learning&&chapter==='body-details'?detailBack:button(review?'Continuar depois':'← Sair','exit')}${fingerShortcut}${button(sound?'Som ligado':'Som desligado','sound',false,`aria-pressed="${sound}"`)}</div><div class="bp-card"><span class="bp-kicker">${modeLabel}</span>${!learning&&!review?`<progress class="bp-progress" value="${index}" max="${total}" aria-label="Rodadas concluídas"></progress>`:''}<div class="bp-stage${format==='visual'&&learning?' bp-study-stage':''}${format==='visual'&&!learning?' bp-test-stage':''}">${format==='visual'?art():''}<div><h2 class="bp-word" tabindex="-1">${title}</h2>${learning&&selected||reviewTeaching?`<p>${word(target).pt}</p>`:''}${example}<p class="bp-muted">${learning?'Passe o mouse para destacar uma região e clique para ouvir a palavra. Você também pode escolher abaixo.':mode==='listen'&&!sound?'Exercício pausado. Ligue o som para continuar.':'Clique na parte no desenho ou escolha uma das quatro opções.'}</p>${target?button('Ouvir novamente','audio'):''}<div class="bp-options" aria-label="Partes do corpo">${options.map(w=>`<button type="button" data-word="${w.id}" class="${(reviewTeaching?round.target:selected)===w.id?'selected':''}" ${!learning&&(round.done||reviewTeaching||mode==='listen'&&(!sound||!audioReady))?'disabled':''}>${learning?w.en+' · ':''}${w.pt}</button>`).join('')}</div><div class="bp-status" role="status" aria-live="polite">${message}</div>${reviewTeaching?button('Tentar sem ajuda','try',true):!learning&&round.done?button(review?'Próxima palavra':index===total-1?'Ver resultado':'Próxima','next',true):''}${learning?`<div class="bp-actions">${button(chapter==='basic-body'?'Fazer o teste da Fase 1':'Praticar detalhes','practice',true)}</div>`:''}<p class="bp-muted">${format==='visual'?'Os botões oferecem uma alternativa rápida para regiões pequenas.':''}</p></div></div></div>`;
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
  function openDetailArea(id){
    if(!C.detailAreas?.[id])return;
    detailArea=id;screen='play';mode='learn';selected=null;message=`Explore os detalhes de ${C.detailAreas[id].label.toLowerCase()}.`;render(true);
  }
  function action(a){
    if(['learn','practice','listen'].includes(a)){start(a);return;}
    if(a==='open'||a==='open-basic'){chapter='basic-body';screen='setup';}
    if(a==='open-details'){if(!adminPreview()&&!phaseOnePassed()&&!sessionPassed()){screen='home';message='Conclua o teste da Fase 1 antes de abrir os detalhes.';}else{chapter='body-details';detailArea=null;screen='detail-map';}}
    if(a==='locked-regions'){message='Conclua o teste da Fase 1 para liberar os detalhes por região.';screen='home';}
    if(a==='home'){cancelAudio();screen='home';}
    if(a==='exit'){if(!leave())return;}
    if(a==='detail-map'){cancelAudio();detailArea=null;screen='detail-map';}
    if(a==='open-fingers'){openDetailArea('fingers');return;}
    if(a==='open-hands'){openDetailArea('hands');return;}
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
      if(!host.dataset.bound){host.dataset.bound='true';const activate=el=>{if(!el)return;if(el.dataset.detailArea)openDetailArea(el.dataset.detailArea);else if(el.dataset.word)choose(el.dataset.word,el.tagName==='BUTTON');else action(el.dataset.action);};host.addEventListener('click',e=>activate(e.target.closest('[data-action],[data-word],[data-detail-area]')));host.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const el=e.target.closest?.('[data-word],[data-detail-area]');if(el){e.preventDefault();activate(el);}}});}
      render();
    },leave,reset(){cancelAudio();screen='home';results=[];owner=null;if(host)host.replaceChildren();},
    active(){return screen==='play'&&mode!=='learn';}
  };
  window.addEventListener('beforeunload',e=>{if(BodyParts.active()){e.preventDefault();e.returnValue='';}});
})();
