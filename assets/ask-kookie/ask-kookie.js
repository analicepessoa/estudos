/* Ask Kookie uses the portal's existing Supabase Auth client. No private data is persisted locally. */
(() => {
  'use strict';
  const categories=['Gramática','Vocabulário','Pronúncia','Listening','Speaking','Reading','Writing','Expressões do cotidiano','Outras dúvidas'];
  const statuses={received:'Recebida',review:'Em análise',production:'Em produção',answered:'Respondida'};
  const questionColumns='id,user_id,question,category,status,archived,group_key,public_question_id,created_at';
  const bucket='ask-kookie';
  // Place the original attached asset at this path when a local copy is available.
  const artwork='./assets/ask-kookie/kookie-original.webp';
  const heroArtwork='./assets/ask-kookie/kookie-hero.webp';
  const episodeOneThumbnail='./assets/ask-kookie/episode-01-do-does.webp';
  let host=null,mode='',owner='',epoch=0,controllers=new Set(),busy=new Set(),data={},pending=null,activeEpisode=null,uiEvents=null;
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const date=x=>x?new Date(x).toLocaleDateString('pt-BR'):'—';
  const day=x=>{const d=new Date(x);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const opts=(values,selected='',all='')=>(all?`<option value="">${esc(all)}</option>`:'')+values.map(x=>`<option ${x===selected?'selected':''} value="${esc(x)}">${esc(statuses[x]||x)}</option>`).join('');
  const byId=id=>host?.querySelector('#'+id);
  const field=(name,label,value='',type='text',extra='')=>`<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
  const area=(name,label,value='',max=20000)=>`<label>${esc(label)}<textarea name="${name}" maxlength="${max}">${esc(value)}</textarea></label>`;
  const cat=(value='',name='category',all='')=>`<label>Categoria<select name="${name}">${opts(categories,value,all)}</select></label>`;
  const avatar=()=>`<img class="ak-avatar" src="${artwork}" alt="Professor Kookie" data-ak-art>`;
  function context(){return typeof currentUser==='object'&&currentUser?currentUser:null;}
  function preview(){return typeof isTeacherPreview==='function'&&isTeacherPreview();}
  function admin(){return typeof isTeacherAdmin==='function'&&isTeacherAdmin();}
  function valid(token=epoch){return token===epoch&&context()?.id===owner&&host?.isConnected;}
  function message(text,error=false){const el=byId('ak-message');if(el){el.textContent=text;el.dataset.error=String(error);}}
  async function bounded(promise,limit=15000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('TIMEOUT')),limit);})]);}finally{clearTimeout(timer);}}
  function errorText(error){
    if(error?.message==='INVALID_MEDIA')return 'Use uma URL HTTPS direta para o arquivo, ou envie o arquivo pelo formulário.';
    if(error?.message==='UPLOAD_BUSY')return 'Aguarde o envio do arquivo terminar antes de salvar o episódio.';
    if(error?.code==='23505')return 'Essa dúvida ou registro já existe. Atualize a lista antes de tentar novamente.';
    if(error?.code==='23514')return 'Confira os campos obrigatórios. Para publicar, informe descrição, vídeo e duração.';
    if(error?.code==='42501'||error?.status===403)return 'Sua conta não tem permissão para esta ação. Entre novamente com a conta correta.';
    if(error?.code==='42P01'||error?.code==='PGRST202')return 'O módulo ainda precisa ser configurado no servidor. Avise a professora.';
    return 'Não foi possível confirmar a operação. Verifique sua conexão e tente novamente. O formulário foi preservado.';
  }
  async function request(query){
    const token=epoch,controller=new AbortController();controllers.add(controller);
    const timer=setTimeout(()=>controller.abort(),15000);
    try{const result=await query.abortSignal(controller.signal);if(!valid(token))throw new Error('STALE');if(result.error)throw result.error;return result.data;}
    finally{clearTimeout(timer);controllers.delete(controller);}
  }
  async function rows(table,columns='*',filter=q=>q){
    const all=[];
    for(let offset=0;;offset+=500){let query=filter(sbClient.from(table).select(columns));
      if(table==='ask_kookie_question_votes')query=query.order('public_question_id').order('user_id');
      else if(table==='ask_kookie_episode_views')query=query.order('episode_id').order('user_id');
      else if(table==='ask_kookie_episode_questions')query=query.order('episode_id').order('question_id');
      else query=query.order('id');
      const part=await request(query.range(offset,offset+499));all.push(...part);if(part.length<500)return all;}
  }
  function stopMedia(){host?.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();});}
  function reset(){epoch++;uiEvents?.abort();uiEvents=null;controllers.forEach(c=>c.abort());controllers.clear();stopMedia();if(host)host.replaceChildren();host=null;owner='';mode='';data={};pending=null;activeEpisode=null;busy.clear();}
  async function action(key,element,fn){
    if(busy.has(key)||!valid())return;
    if(preview()&&!['play','refresh'].includes(key)){message('Na prévia da professora, os envios ficam desativados.');return;}
    const token=epoch;busy.add(key);const buttons=element?.matches?.('button')?[element]:Array.from(element?.querySelectorAll('button')||[]);buttons.forEach(b=>b.disabled=true);
    try{await fn();}catch(error){if(valid(token)&&error.message!=='STALE')message(errorText(error),true);}
    finally{if(token===epoch){busy.delete(key);buttons.forEach(b=>b.disabled=false);}}
  }
  async function load(){
    const isAdmin=mode==='admin',isPreview=preview();
    const jobs=[rows('ask_kookie_episodes','*',isAdmin||isPreview?q=>q:q=>q.eq('status','published')),rows('ask_kookie_public_questions','*',isAdmin?q=>q:q=>q.eq('published',true))];
    if(!isPreview)jobs.push(rows('ask_kookie_questions',questionColumns,isAdmin?q=>q:q=>q.eq('user_id',owner)),rows('ask_kookie_question_votes'),rows('ask_kookie_episode_views'),rows('ask_kookie_episode_questions'));
    if(isAdmin)jobs.push(request(sbClient.rpc('ask_kookie_admin_notes')),rows('student_progress','id,name,turma'));
    const values=await Promise.all(jobs);
    data={episodes:values[0],public:values[1],questions:values[2]||[],votes:values[3]||[],views:values[4]||[],links:values[5]||[],notes:values[6]||[],students:values[7]||[]};
    draw();
  }
  async function refresh(){message('Atualizando…');await load();message('Lista atualizada.');}
  async function open(element,nextMode){
    reset();host=element;mode=nextMode;owner=context()?.id||'';epoch++;
    if(!host||!owner||!sbClient||(mode==='admin'&&!admin())){if(host)host.textContent='Entre com sua conta para acessar o Ask Kookie.';return;}
    const token=epoch;
    host.innerHTML=`<div class="ask-kookie ak-${mode}">
      <div class="ak-hero"><div class="ak-hero-copy"><div class="ak-kicker">Seu encontro com o inglês</div><h1>Ask Kookie!</h1><h2>Pequenas dúvidas. Grandes descobertas.</h2><p>Assista às explicações do Professor Kookie e envie o que você quer descobrir.</p><div class="ak-row"><button data-ak-scroll="ak-library">Ver episódios</button><button class="ak-secondary" data-ak-scroll="ak-question-form">${mode==='admin'?'Gerenciar dúvidas':'Enviar uma dúvida'}</button></div></div><div class="ak-hero-art"><img src="${heroArtwork}" alt="Professor Kookie sorrindo na biblioteca, com um balão de dúvidas e um ponto de interrogação" width="1050" height="700" decoding="async" fetchpriority="high"></div></div>
      <div id="ak-message" class="ak-status" role="status" aria-live="polite">Carregando…</div>
      <section id="ak-library" class="ak-panel ak-anchor"><div class="ak-library-heading"><div><h2>${mode==='admin'?'Episódios e rascunhos':'Episódios para você'}</h2><p>Escolha um vídeo e descubra com o Kookie.</p></div><button class="ak-secondary" data-ak-refresh aria-label="Atualizar lista" title="Atualizar lista">↻</button></div><div class="ak-filters"><label>Pesquisar episódios<input id="ak-search" type="search" placeholder="Título, categoria ou palavra-chave"></label><label>Categoria<select id="ak-category">${opts(categories,'','Todas as categorias')}</select></label></div><div id="ak-episodes" class="ak-grid"></div></section>
      <section id="ak-player" class="ak-panel ak-player ak-anchor" hidden aria-label="Episódio selecionado"></section>
      ${mode==='admin'?adminShell():studentShell()}
      <section class="ak-panel"><h2>Também é sua dúvida?</h2><p>Perguntas revisadas e publicadas pela professora, sem identificar quem as enviou.</p><div id="ak-public" class="ak-grid"></div></section>
    </div>`;
    window.scrollTo({top:0,behavior:'instant'});
    bind();
    try{
      const {data:auth,error}=await bounded(sbClient.auth.getUser());
      if(!valid(token))return;
      if(error||auth.user?.id!==owner)throw {code:'42501'};
      await load();if(valid(token))message(preview()?'Revisão da professora: rascunhos aparecem só para sua conferência. Envios e informações pessoais ficam desativados.':'');
      if(valid(token)&&!document.activeElement?.matches('input,textarea,select'))byId('ak-library').scrollIntoView({block:'start',behavior:'instant'});
    }catch(error){if(valid(token))message(errorText(error),true);}
  }
  function studentShell(){return `<section id="ak-question-form" class="ak-panel ak-anchor">${avatar()}<h2>Vamos descobrir juntos?</h2><form id="ak-send" class="ak-form"><label>Qual é a sua dúvida de inglês?<textarea name="question" required minlength="5" maxlength="2000" aria-describedby="ak-help"></textarea></label><small id="ak-help">Não existe pergunta boba! Conte ao Kookie o que você gostaria de entender melhor.</small>${cat()}<button ${preview()?'disabled':''}>Enviar minha dúvida</button><small>Sua pergunta é privada. A professora pode publicar uma versão revisada e anônima.</small></form><div id="ak-confirm" class="ak-confirm" hidden>${avatar()}Sua dúvida chegou ao Kookie! Continue acompanhando para descobrir quando ela será respondida.</div></section><section class="ak-panel"><h2>Minhas dúvidas</h2><div id="ak-mine" class="ak-grid"></div></section>`;}
  function adminShell(){return `<section class="ak-panel"><h2>Acompanhamento</h2><div id="ak-stats" class="ak-grid"></div><div id="ak-rankings" class="ak-split"></div></section>
    <section id="ak-question-form" class="ak-panel ak-anchor"><h2>Caixa de dúvidas</h2><div class="ak-filters"><label>Palavra-chave<input id="ak-q-search" type="search"></label><label>Aluno<select id="ak-q-student"><option value="">Todos os alunos</option></select></label><label>Categoria<select id="ak-q-category">${opts(categories,'','Todas')}</select></label><label>Status<select id="ak-q-status">${opts(Object.keys(statuses),'','Todos')}</select></label><label>De<input id="ak-q-from" type="date"></label><label>Até<input id="ak-q-to" type="date"></label><label>Ordenar<select id="ak-q-order"><option value="recent">Mais recentes</option><option value="interest">Mais interessados</option></select></label><label>Arquivo<select id="ak-q-archive"><option value="active">Ativas</option><option value="all">Todas</option><option value="archived">Arquivadas</option></select></label></div><p><small>Use o mesmo grupo em perguntas semelhantes. A publicação anônima é sempre uma ação manual.</small></p><div id="ak-questions"></div></section>
    <section id="ak-editor-section" class="ak-panel ak-anchor"><h2 id="ak-editor-title">Novo episódio</h2><button class="ak-secondary" data-ak-new>Novo episódio</button><form id="ak-editor" class="ak-form"></form></section>
    <section class="ak-panel"><h2>Publicar uma dúvida anônima</h2><p>Revise o texto e retire nomes e detalhes pessoais antes de publicar. O original permanece privado.</p><form id="ak-public-editor" class="ak-form"><input type="hidden" name="id">${area('question','Versão pública revisada','',2000)}${cat()}<label><span><input type="checkbox" name="published"> Publicar na área dos alunos</span></label><label>Vincular às dúvidas privadas selecionadas<select name="sources" multiple size="5" id="ak-public-sources"></select></label><button>Salvar versão anônima</button><button type="button" class="ak-secondary" data-ak-public-new>Limpar formulário</button></form></section>`;}
  function draw(){drawLibrary();drawPublic();if(mode==='admin'){drawAdmin();if(!byId('ak-editor').children.length)editEpisode();}else drawMine();}
  function drawLibrary(){
    const search=norm(byId('ak-search').value),category=byId('ak-category').value;
    const list=(data.episodes||[]).filter(e=>(!category||e.category===category)&&norm([e.title,e.category,e.keywords,e.description].join(' ')).includes(search)).sort((a,b)=>b.episode_number-a.episode_number);
    byId('ak-episodes').innerHTML=list.length?list.map(e=>`<article class="ak-panel ak-episode">${e.thumbnail_url||e.episode_number===1?`<button type="button" class="ak-episode-cover" data-ak-play="${esc(e.id)}" aria-label="Abrir episódio ${String(e.episode_number).padStart(2,'0')}: ${esc(e.title)}"><img alt="Professor Kookie — ${esc(e.title)}" loading="lazy" ${e.thumbnail_url?`data-ak-thumbnail="${esc(e.id)}"`:`src="${episodeOneThumbnail}"`}><span class="ak-cover-play" aria-hidden="true">▶</span><span class="ak-cover-number">Episódio ${String(e.episode_number).padStart(2,'0')}</span>${e.status==='draft'?'<span class="ak-cover-state">Rascunho</span>':''}${e.duration_seconds?`<span class="ak-cover-duration">${Math.floor(e.duration_seconds/60)}:${String(e.duration_seconds%60).padStart(2,'0')}</span>`:''}</button>`:''}<div class="ak-meta">${esc(e.category)} · ${esc(e.level)}</div><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p><span class="ak-meta">${e.status==='draft'?'Rascunho':date(e.published_at)}${data.views?.some(v=>v.episode_id===e.id&&v.user_id===owner)?' · Assistido':''}</span><button data-ak-play="${esc(e.id)}">${e.video_url?'Assistir episódio':'Ver rascunho'}</button>${mode==='admin'?`<button class="ak-secondary" data-ak-edit="${esc(e.id)}">Editar episódio</button>`:''}</article>`).join(''):`<div class="ak-empty">${search||category?'Nenhum episódio corresponde à pesquisa.':'Os primeiros episódios estão sendo preparados. Volte em breve!'}</div>`;
    const token=epoch;host.querySelectorAll('[data-ak-thumbnail]').forEach(async img=>{try{const e=data.episodes.find(e=>e.id===img.dataset.akThumbnail);const url=await mediaUrl(e.thumbnail_url);if(valid(token)&&img.isConnected)img.src=url;}catch{img.remove();}});
  }
  function drawMine(){
    const mine=byId('ak-mine');if(!mine)return;
    mine.innerHTML=data.questions.length?data.questions.map(q=>`<article class="ak-panel"><span class="ak-badge">${statuses[q.status]}</span><h3 class="ak-text">${esc(q.question)}</h3><div class="ak-meta">${esc(q.category)} · ${date(q.created_at)}</div>${data.links.filter(l=>l.question_id===q.id).map(l=>{const e=data.episodes.find(e=>e.id===l.episode_id&&e.status==='published');return e?`<button data-ak-play="${e.id}">Ver resposta: ${esc(e.title)}</button>`:'';}).join('')}</article>`).join(''):`<div class="ak-empty">${preview()?'As perguntas pessoais ficam disponíveis somente na conta de cada aluno.':'Você ainda não enviou dúvidas. Que tal começar?'}</div>`;
  }
  function drawPublic(){
    byId('ak-public').innerHTML=data.public.length?data.public.map(q=>{const voted=data.votes.some(v=>v.public_question_id===q.id&&v.user_id===owner);return `<article class="ak-panel"><span class="ak-badge">${esc(q.category)}</span><h3>${esc(q.question)}</h3><p>${q.interest_count} interesse(s)${q.published?'':' · Não publicada'}</p>${mode==='admin'?`<button data-ak-public-edit="${q.id}">Revisar / despublicar</button>`:`<button data-ak-vote="${q.id}" aria-pressed="${voted}" ${preview()?'disabled':''}>${voted?'Desfazer interesse':'Também tenho essa dúvida!'}</button>`}</article>`;}).join(''):'<div class="ak-empty">Novas perguntas para descobrir juntos aparecerão aqui.</div>';
  }
  function studentName(id){const s=data.students.find(s=>s.id===id);return s?.name||'Aluno '+id.slice(0,8);}
  function drawAdmin(){
    const q=data.questions,e=data.episodes;
    const stats=[['Dúvidas recebidas',q.length],['Pendentes',q.filter(q=>['received','review'].includes(q.status)&&!q.archived).length],['Em produção',q.filter(q=>q.status==='production'&&!q.archived).length],['Respondidas',q.filter(q=>q.status==='answered').length],['Episódios publicados',e.filter(e=>e.status==='published').length]];
    byId('ak-stats').innerHTML=stats.map(([label,value])=>`<div class="ak-stat"><strong>${value}</strong>${label}</div>`).join('');
    const ranking=items=>items.length?`<ol>${items.slice(0,5).map(([label,value])=>`<li>${esc(label)}: <strong>${value}</strong></li>`).join('')}</ol>`:'<p>Ainda sem registros.</p>';
    byId('ak-rankings').innerHTML=`<div><h3>Mais marcados como assistidos</h3>${ranking(e.map(e=>[e.title,data.views.filter(v=>v.episode_id===e.id).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]))}<small>Contagem de alunos únicos que marcaram o episódio.</small></div><div><h3>Categorias com mais dúvidas</h3>${ranking(categories.map(c=>[c,q.filter(q=>q.category===c).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]))}<h3>Maior interesse</h3>${ranking(data.public.map(p=>[p.question,p.interest_count]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]))}</div>`;
    const student=byId('ak-q-student'),value=student.value;student.innerHTML='<option value="">Todos os alunos</option>'+[...new Set(q.map(q=>q.user_id))].map(id=>`<option value="${id}">${esc(studentName(id))}</option>`).join('');student.value=value;
    const source=byId('ak-public-sources'),selected=Array.from(source.selectedOptions).map(x=>x.value);source.innerHTML=q.map(q=>`<option value="${q.id}" ${selected.includes(q.id)?'selected':''}>${esc(studentName(q.user_id)+': '+q.question)}</option>`).join('');
    drawQuestions();
  }
  function drawQuestions(){
    if(!Array.isArray(data.questions))return;
    const v=id=>byId(id).value,search=norm(v('ak-q-search')),interest=q=>data.public.find(p=>p.id===q.public_question_id)?.interest_count||0;
    const list=data.questions.filter(q=>norm(q.question).includes(search)&&(!v('ak-q-student')||q.user_id===v('ak-q-student'))&&(!v('ak-q-category')||q.category===v('ak-q-category'))&&(!v('ak-q-status')||q.status===v('ak-q-status'))&&(!v('ak-q-from')||day(q.created_at)>=v('ak-q-from'))&&(!v('ak-q-to')||day(q.created_at)<=v('ak-q-to'))&&(v('ak-q-archive')==='all'||q.archived===(v('ak-q-archive')==='archived'))).sort((a,b)=>v('ak-q-order')==='interest'?interest(b)-interest(a):b.created_at.localeCompare(a.created_at));
    byId('ak-questions').innerHTML=list.length?list.map(q=>`<details class="ak-panel ak-admin-question"><summary><span class="ak-badge">${statuses[q.status]}</span> <strong>${esc(q.question)}</strong><div class="ak-meta">${esc(studentName(q.user_id))} · ${esc(q.category)} · ${date(q.created_at)} · ${interest(q)} interesse(s)${q.group_key?' · Grupo: '+esc(q.group_key):''}</div></summary><form data-ak-question="${q.id}" class="ak-form"><label>Status<select name="status">${opts(Object.keys(statuses),q.status)}</select></label>${field('group_key','Agrupar perguntas semelhantes (mesmo nome de grupo)',q.group_key,'text','maxlength="160"')}${area('internal_notes','Observações internas',data.notes.find(n=>n.id===q.id)?.internal_notes||'',10000)}<label><span><input type="checkbox" name="archived" ${q.archived?'checked':''}> Arquivada</span></label><button>Salvar acompanhamento</button><button class="ak-secondary" type="button" data-ak-anonymize="${q.id}">Preparar versão anônima</button></form></details>`).join(''):'<div class="ak-empty">Nenhuma dúvida corresponde aos filtros.</div>';
  }
  function editEpisode(id){
    stopMedia();activeEpisode=null;byId('ak-player').hidden=true;
    const e=data.episodes.find(e=>e.id===id)||{id:crypto.randomUUID(),episode_number:Math.max(0,...data.episodes.map(e=>e.episode_number))+1,category:'Gramática',status:'draft',level:'Básico'};
    byId('ak-editor-title').textContent=id?'Editar episódio '+e.episode_number:'Novo episódio';
    const linked=data.links.filter(l=>l.episode_id===id).map(l=>l.question_id);
    byId('ak-editor').innerHTML=`<input type="hidden" name="id" value="${e.id}"><div class="ak-split">${field('episode_number','Número do episódio',e.episode_number,'number','required min="1" max="99999"')}${field('title','Título',e.title,'text','required minlength="3" maxlength="180"')}</div><div class="ak-split">${cat(e.category)}${field('level','Nível',e.level,'text','maxlength="80"')}</div>${area('description','Descrição',e.description,4000)}${field('keywords','Palavras-chave',e.keywords,'text','maxlength="1000"')}
      ${['video','thumbnail','captions'].map((name,i)=>`${field(name+'_url',['Vídeo — URL HTTPS direta ou arquivo enviado','Miniatura — URL HTTPS ou arquivo enviado','Legenda WebVTT — URL HTTPS ou arquivo enviado'][i],e[name+'_url'])}<label class="ak-file">${['Enviar vídeo MP4/WebM (até 100 MB)','Enviar miniatura (até 5 MB)','Enviar legenda .vtt (até 1 MB)'][i]}<input type="file" data-ak-upload="${name}" accept="${['video/mp4,video/webm','image/png,image/jpeg,image/webp','.vtt,text/vtt'][i]}"></label>`).join('')}
      ${field('duration_seconds','Duração em segundos',e.duration_seconds,'number','min="1" max="7200"')}${area('explanation','Explicação complementar',e.explanation)}${area('examples','Exemplos em inglês',e.examples,10000)}${area('transcript','Transcrição',e.transcript,50000)}${area('challenge','Pequeno desafio (opcional)',e.challenge,4000)}<label>Status<select name="status"><option value="draft" ${e.status==='draft'?'selected':''}>Rascunho</option><option value="published" ${e.status==='published'?'selected':''}>Publicado</option></select></label><fieldset class="ak-linkset"><legend>Vincular dúvidas relacionadas</legend>${data.questions.map(q=>`<label><input type="checkbox" name="questions" value="${q.id}" ${linked.includes(q.id)?'checked':''}>${esc(studentName(q.user_id)+': '+q.question)}</label>`).join('')||'<p>Ainda não há dúvidas recebidas.</p>'}</fieldset><button>Salvar episódio e vínculos</button><small>Publicar exige descrição, vídeo e duração. Para despublicar, escolha Rascunho e salve. Arquivos enviados usam nomes únicos e não substituem vídeos anteriores.</small>`;
  }
  function safeMedia(value){if(!value)return '';if(/^storage:[a-zA-Z0-9/_.-]+$/.test(value)&&!value.includes('..'))return value;try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}throw new Error('INVALID_MEDIA');}
  async function mediaUrl(value){value=safeMedia(value);if(!value.startsWith('storage:'))return value;const token=epoch;const result=await bounded(sbClient.storage.from(bucket).createSignedUrl(value.slice(8),3600));if(!valid(token))throw new Error('STALE');if(result.error)throw result.error;return result.data.signedUrl;}
  async function play(id){
    const e=data.episodes.find(e=>e.id===id);if(!e)return;
    stopMedia();const player=byId('ak-player');activeEpisode=id;player.hidden=false;
    player.innerHTML=`<button class="ak-secondary" data-ak-close>Fechar episódio</button><h2 tabindex="-1">${esc(e.title)}</h2><p>${esc(e.description)}</p>${e.video_url?'<p data-ak-loading>Preparando o vídeo…</p><video controls playsinline preload="none" hidden crossorigin="anonymous"></video>':'<p>Rascunho: o vídeo será adicionado pela professora.</p>'}${[['Explicação complementar',e.explanation],['Exemplos em inglês',e.examples],['Transcrição',e.transcript],['Pequeno desafio',e.challenge]].filter(x=>x[1]).map(([title,text])=>`<section><h3>${title}</h3><p class="ak-text">${esc(text)}</p></section>`).join('')}${mode==='student'&&e.status==='published'?`<button data-ak-watched="${e.id}" ${preview()?'disabled':''}>${data.views.some(v=>v.episode_id===id&&v.user_id===owner)?'Desmarcar assistido':'Marcar como assistido'}</button>`:''}`;
    player.scrollIntoView({behavior:'smooth',block:'start'});player.querySelector('h2').focus({preventScroll:true});
    if(e.video_url){const token=epoch;const [url,caption,poster]=await Promise.all([mediaUrl(e.video_url),e.captions_url?mediaUrl(e.captions_url):'',e.thumbnail_url?mediaUrl(e.thumbnail_url):(e.episode_number===1?episodeOneThumbnail:'')]);if(!valid(token)||activeEpisode!==id)return;const video=player.querySelector('video');if(!e.captions_url&&!e.video_url.startsWith('storage:'))video.removeAttribute('crossorigin');video.src=url;video.hidden=false;if(poster)video.poster=poster;if(caption){const track=document.createElement('track');track.kind='captions';track.srclang='en';track.label='English';track.src=caption;track.default=true;video.append(track);}player.querySelector('[data-ak-loading]')?.remove();video.addEventListener('error',()=>message('O vídeo não pôde ser reproduzido. Verifique sua conexão e a disponibilidade do arquivo.',true));}
  }
  function bind(){
    uiEvents=new AbortController();const signal=uiEvents.signal;
    host.addEventListener('error',event=>{const img=event.target;if(img.matches?.('[data-ak-art]')){img.hidden=true;if(img.nextElementSibling)img.nextElementSibling.hidden=false;}},{capture:true,signal});
    host.addEventListener('input',event=>{if(['ak-search','ak-category'].includes(event.target.id))drawLibrary();if(event.target.id?.startsWith('ak-q-'))drawQuestions();},{signal});
    host.addEventListener('change',event=>{if(event.target.id==='ak-category')drawLibrary();if(event.target.id?.startsWith('ak-q-'))drawQuestions();if(event.target.dataset.akUpload)upload(event.target);},{signal});
    host.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.dataset.akScroll)byId(b.dataset.akScroll)?.scrollIntoView({behavior:'smooth'});
      if(b.hasAttribute('data-ak-refresh'))action('refresh',b,refresh);
      if(b.dataset.akPlay)action('play',b,()=>play(b.dataset.akPlay));
      if(b.hasAttribute('data-ak-close')){stopMedia();activeEpisode=null;byId('ak-player').hidden=true;byId('ak-library').scrollIntoView();}
      if(b.dataset.akEdit){editEpisode(b.dataset.akEdit);byId('ak-editor-section').scrollIntoView();}
      if(b.hasAttribute('data-ak-new'))editEpisode();
      if(b.dataset.akVote)action('vote:'+b.dataset.akVote,b,async()=>{const id=b.dataset.akVote,voted=data.votes.some(v=>v.public_question_id===id&&v.user_id===owner);await request(voted?sbClient.from('ask_kookie_question_votes').delete().eq('public_question_id',id).eq('user_id',owner):sbClient.from('ask_kookie_question_votes').insert({public_question_id:id}));await load();message(voted?'Interesse desfeito.':'Interesse registrado.');});
      if(b.dataset.akWatched)action('watched',b,async()=>{const id=b.dataset.akWatched,watched=data.views.some(v=>v.episode_id===id&&v.user_id===owner);await request(watched?sbClient.from('ask_kookie_episode_views').delete().eq('episode_id',id).eq('user_id',owner):sbClient.from('ask_kookie_episode_views').insert({episode_id:id}));await load();b.textContent=watched?'Marcar como assistido':'Desmarcar assistido';message(watched?'Marcação removida.':'Episódio marcado como assistido.');if(!watched&&typeof recordStudentUsageEvent==='function')recordStudentUsageEvent('ask_kookie',data.episodes.find(e=>e.id===id)?.title||'Ask Kookie','completed','Episódio marcado como assistido');});
      if(b.dataset.akAnonymize){const q=data.questions.find(q=>q.id===b.dataset.akAnonymize),f=byId('ak-public-editor');f.reset();f.elements.id.value='';f.elements.question.value=q.question;f.elements.category.value=q.category;Array.from(f.elements.sources.options).forEach(o=>o.selected=o.value===q.id);f.scrollIntoView();f.elements.question.focus();message('Revise o texto e remova qualquer identificação antes de publicar.');}
      if(b.dataset.akPublicEdit){const q=data.public.find(q=>q.id===b.dataset.akPublicEdit),f=byId('ak-public-editor');f.elements.id.value=q.id;f.elements.question.value=q.question;f.elements.category.value=q.category;f.elements.published.checked=q.published;Array.from(f.elements.sources.options).forEach(o=>o.selected=data.questions.some(s=>s.id===o.value&&s.public_question_id===q.id));f.scrollIntoView();}
      if(b.hasAttribute('data-ak-public-new')){byId('ak-public-editor').reset();byId('ak-public-editor').elements.id.value='';}
    },{signal});
    host.addEventListener('submit',event=>{event.preventDefault();const f=event.target;if(!f.reportValidity())return;
      if(f.getAttribute('id')==='ak-send')action('send',f,()=>send(f));
      if(f.dataset.akQuestion)action('question:'+f.dataset.akQuestion,f,async()=>{const fd=new FormData(f);await request(sbClient.from('ask_kookie_questions').update({status:fd.get('status'),group_key:fd.get('group_key').trim(),internal_notes:fd.get('internal_notes').trim(),archived:fd.has('archived')}).eq('id',f.dataset.akQuestion));await load();message('Acompanhamento salvo.');});
      if(f.getAttribute('id')==='ak-editor')action('saveEpisode',f,async()=>{if(busy.has('upload'))throw new Error('UPLOAD_BUSY');const fd=new FormData(f),e={};for(const key of ['id','title','category','description','level','keywords','video_url','thumbnail_url','captions_url','explanation','examples','transcript','challenge','status'])e[key]=String(fd.get(key)||'').trim();for(const key of ['video_url','thumbnail_url','captions_url'])e[key]=safeMedia(e[key]);e.episode_number=Number(fd.get('episode_number'));e.duration_seconds=fd.get('duration_seconds')?Number(fd.get('duration_seconds')):null;await request(sbClient.rpc('ask_kookie_save_episode',{p_episode:e,p_questions:fd.getAll('questions')}));await load();message(e.status==='published'?'Episódio publicado e dúvidas vinculadas atualizadas.':'Rascunho e vínculos salvos.');});
      if(f.getAttribute('id')==='ak-public-editor')action('publicSave',f,async()=>{const fd=new FormData(f),id=fd.get('id'),value={question:String(fd.get('question')).trim(),category:fd.get('category'),published:fd.has('published')};if(value.question.length<5){message('Escreva uma pergunta revisada com pelo menos 5 caracteres.',true);return;}const saved=await request((id?sbClient.from('ask_kookie_public_questions').update(value).eq('id',id):sbClient.from('ask_kookie_public_questions').insert(value)).select('id').single());f.elements.id.value=saved.id;const selected=Array.from(f.elements.sources.selectedOptions).map(o=>o.value);const old=data.questions.filter(q=>q.public_question_id===saved.id&&!selected.includes(q.id)).map(q=>q.id);if(old.length)await request(sbClient.from('ask_kookie_questions').update({public_question_id:null}).in('id',old));if(selected.length)await request(sbClient.from('ask_kookie_questions').update({public_question_id:saved.id}).in('id',selected));await load();message('Versão anônima salva. O texto original permanece privado.');});
    },{signal});
  }
  async function send(f){
    const fd=new FormData(f),question=String(fd.get('question')).trim(),category=fd.get('category');
    if(question.length<5||question.length>2000||!categories.includes(category)){message('Escreva sua dúvida (5 a 2.000 caracteres) e escolha uma categoria.',true);return;}
    const signature=question+'|'+category;if(pending?.signature!==signature)pending={signature,id:crypto.randomUUID()};
    try{await request(sbClient.from('ask_kookie_questions').insert({id:pending.id,question,category}).select(questionColumns).single());}
    catch(error){if(error.code!=='23505')throw error;const found=await request(sbClient.from('ask_kookie_questions').select(questionColumns).eq('user_id',owner).eq('category',category).eq('question',question));if(!found.length)throw error;}
    f.reset();pending=null;byId('ak-confirm').hidden=false;message('Envio confirmado pelo servidor.');
    try{await load();}catch(error){if(valid())message('Sua dúvida foi salva. Não foi possível atualizar a lista agora; toque em Atualizar lista.',true);}
  }
  async function upload(input){
    const file=input.files?.[0];if(!file)return;
    await action('upload',byId('ak-editor'),async()=>{
      const kind=input.dataset.akUpload,limit=kind==='video'?100:kind==='thumbnail'?5:1;
      const ext=file.name.split('.').pop().toLowerCase(),mimes={mp4:'video/mp4',webm:'video/webm',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',vtt:'text/vtt'};
      if(file.size>limit*1024*1024||!(kind==='video'?['mp4','webm']:kind==='thumbnail'?['png','jpg','jpeg','webp']:['vtt']).includes(ext)){message('Formato ou tamanho não permitido para este arquivo.',true);return;}
      const name=crypto.randomUUID()+'/'+kind+'.'+ext,token=epoch;message('Enviando arquivo… Mantenha esta página aberta.');
      const result=await bounded(sbClient.storage.from(bucket).upload(name,file,{contentType:mimes[ext],upsert:false}),120000);if(!valid(token))return;if(result.error)throw result.error;
      byId('ak-editor').elements[kind+'_url'].value='storage:'+result.data.path;input.value='';message('Arquivo enviado. Salve o episódio para vincular o arquivo.');
    });
  }
  window.AskKookie={openStudent:()=>open(document.getElementById('ask-kookie-student'),'student'),openAdmin:()=>open(document.getElementById('ask-kookie-admin'),'admin'),reset,leave:stopMedia,authChanged:(event,id)=>{if(host&&(event==='SIGNED_OUT'||id&&id!==owner))reset();},hasPendingWork:()=>busy.size>0||Boolean(byId('ak-send')?.elements.question.value.trim())};
})();
