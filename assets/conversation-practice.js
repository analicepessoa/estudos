(function conversationPracticeModule(){
  'use strict';

  const MAX_MESSAGE_LENGTH=1500;
  const MAX_HISTORY_MESSAGES=18;
  const VALID_LEVELS=new Set(['A1','A2','B1','B2']);
  const state={
    ownerId:'',
    level:'A1',
    messages:[],
    pending:false,
    started:false,
    selectedMode:'text',
    liveConfig:null,
    livePending:false,
    liveStarted:false,
    liveTranscripts:[],
    liveReport:null,
    liveEnding:false,
    liveReconnectAttempts:0,
    liveEndsAt:0,
    liveTimer:null,
    sessionId:'',
    sessionCreation:null,
    persistenceChain:Promise.resolve(),
    sessionMode:'text',
    startedAt:0,
    sheetReportSent:false
  };

  function element(id){return document.getElementById(id);}

  function teacherPreviewActive(){
    return typeof isTeacherPreview==='function'&&isTeacherPreview();
  }

  function canPersistConversation(){
    return Boolean(currentUser?.id&&currentUser?.role==='student'&&sbClient&&!teacherPreviewActive());
  }

  // A session pointer lives only for this browser tab. It lets a service-worker
  // update restore an interrupted text conversation without reopening an old
  // conversation the student deliberately left on another day.
  function activeTextSessionStorageKey(){
    return currentUser?.id?`ap_active_text_conversation_${currentUser.id}`:'';
  }

  function saveActiveTextSession(sessionId){
    const key=activeTextSessionStorageKey();
    if(!key||!sessionId)return;
    try{sessionStorage.setItem(key,String(sessionId));}catch(error){
      console.warn('Não foi possível guardar a conversa em andamento:',error);
    }
  }

  function readActiveTextSession(){
    const key=activeTextSessionStorageKey();
    if(!key)return '';
    try{return String(sessionStorage.getItem(key)||'').trim();}catch(error){
      return '';
    }
  }

  function clearActiveTextSession(){
    const key=activeTextSessionStorageKey();
    if(!key)return;
    try{sessionStorage.removeItem(key);}catch(error){
      console.warn('Não foi possível limpar a conversa finalizada:',error);
    }
  }

  function levelStorageKey(){
    if(teacherPreviewActive())return 'ap_conversation_preview_level';
    return currentUser?.id?`ap_conversation_level_${currentUser.id}`:'ap_conversation_level';
  }

  function readSavedLevel(){
    try{
      const saved=localStorage.getItem(levelStorageKey());
      return VALID_LEVELS.has(saved)?saved:'A1';
    }catch(error){
      return 'A1';
    }
  }

  function saveLevel(){
    try{localStorage.setItem(levelStorageKey(),state.level);}catch(error){
      console.warn('Não foi possível salvar a preferência de nível:',error);
    }
  }

  function resetForCurrentStudent(){
    const ownerId=teacherPreviewActive()
      ? `teacher-preview:${currentUser?.turma||''}:${currentUser?.inspectAll!==false?'review':'student'}`
      : currentUser?.id||'';
    if(state.ownerId===ownerId)return;
    state.ownerId=ownerId;
    state.level=readSavedLevel();
    state.messages=[];
    state.pending=false;
    state.started=false;
    state.selectedMode='text';
    state.liveConfig=null;
    state.livePending=false;
    state.liveStarted=false;
    state.liveTranscripts=[];
    state.liveReport=null;
    state.liveEnding=false;
    state.liveReconnectAttempts=0;
    clearLiveTimer();
    state.sessionId='';
    state.sessionCreation=null;
    state.persistenceChain=Promise.resolve();
    state.sessionMode='text';
    state.startedAt=0;
    state.sheetReportSent=false;
  }

  function canTrackConversation(){
    return Boolean(currentUser?.id&&currentUser?.role==='student'&&!teacherPreviewActive());
  }

  function compactText(value,limit=140){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(text.length<=limit)return text;
    return `${text.slice(0,Math.max(0,limit-1)).trimEnd()}…`;
  }

  function conversationDuration(){
    const elapsed=Math.max(0,Date.now()-(state.startedAt||Date.now()));
    const totalSeconds=Math.max(1,Math.round(elapsed/1000));
    const minutes=Math.floor(totalSeconds/60);
    const seconds=totalSeconds%60;
    return minutes?`${minutes} min ${String(seconds).padStart(2,'0')} s`:`${seconds} s`;
  }

  function reportConversationStudy({mode=state.sessionMode,report=null,keepalive=false}={}){
    if(state.sheetReportSent||!canTrackConversation())return;
    const turns=mode==='live_voice'?state.liveTranscripts:state.messages;
    const studentTurns=turns.filter(item=>item?.role==='user'&&item.content);
    const tutorTurns=turns.filter(item=>item?.role==='assistant'&&item.content);
    if(!studentTurns.length)return;

    const excerpts=studentTurns.slice(0,3).map(item=>compactText(item.content,110)).filter(Boolean);
    const details=[
      `Nível: ${state.level}`,
      `Duração: ${conversationDuration()}`,
      `Participação: ${studentTurns.length} fala${studentTurns.length===1?'':'s'} do aluno e ${tutorTurns.length} resposta${tutorTurns.length===1?'':'s'} do tutor`
    ];
    if(excerpts.length)details.push(`Falas do aluno: ${excerpts.join(' | ')}`);
    if(report?.suggestedPractice)details.push(`Próxima prática: ${compactText(report.suggestedPractice,150)}`);

    const activity=mode==='live_voice'
      ? `🎧 Live Conversation · ${state.level}`
      : `💬 Conversation Practice · Texto · ${state.level}`;
    const reporter=typeof dispatchReport==='function'?dispatchReport:window.dispatchReport;
    if(typeof reporter!=='function')return;

    state.sheetReportSent=true;
    Promise.resolve(reporter(activity,compactText(details.join(' · '),850),{keepalive}))
      .then(sent=>{
        if(!sent)state.sheetReportSent=false;
      })
      .catch(error=>{
        state.sheetReportSent=false;
        console.warn('Não foi possível enviar o resumo da conversa para a planilha:',error);
      });
  }

  async function ensureConversationSession(){
    if(!canPersistConversation())return '';
    if(state.sessionId)return state.sessionId;
    if(state.sessionCreation)return state.sessionCreation;

    state.sessionCreation=(async()=>{
      const {data,error}=await sbClient
        .from('conversation_sessions')
        .insert({user_id:currentUser.id,level:state.level,mode:state.sessionMode})
        .select('id')
        .single();
      if(error)throw error;
      const sessionId=String(data?.id||'');
      if(!sessionId)throw new Error('A sessão não recebeu uma identificação.');
      state.sessionId=sessionId;
      if(state.sessionMode==='text')saveActiveTextSession(sessionId);
      return sessionId;
    })();

    try{
      return await state.sessionCreation;
    }finally{
      state.sessionCreation=null;
    }
  }

  async function persistConversationMessage(message){
    const sessionId=await ensureConversationSession();
    if(!sessionId)return;
    const {data,error}=await sbClient.from('conversation_messages').insert({
      session_id:sessionId,
      role:message.role,
      content:message.content,
      corrections:Array.isArray(message.corrections)?message.corrections:[],
      vocabulary:Array.isArray(message.vocabulary)?message.vocabulary:[]
    }).select('id').single();
    if(error)throw error;
    message.dbId=String(data?.id||'');
  }

  function persistMessageSilently(message){
    if(!canPersistConversation())return;
    state.persistenceChain=state.persistenceChain
      .then(()=>persistConversationMessage(message))
      .catch(error=>console.warn('Não foi possível salvar esta mensagem da conversa:',error));
  }

  function updateMessageCorrectionsSilently(message){
    if(!canPersistConversation()||!message)return;
    state.persistenceChain=state.persistenceChain
      .then(async()=>{
        if(!message.dbId)return;
        const {error}=await sbClient.from('conversation_messages').update({
          corrections:Array.isArray(message.corrections)?message.corrections:[]
        }).eq('id',message.dbId);
        if(error)throw error;
      })
      .catch(error=>console.warn('Não foi possível salvar as correções desta fala:',error));
  }

  function finishConversationSessionSilently(){
    if(!canPersistConversation())return;
    state.persistenceChain=state.persistenceChain
      .then(async()=>{
        const sessionId=await ensureConversationSession();
        if(!sessionId)return;
        const {error}=await sbClient.from('conversation_sessions')
          .update({finished_at:new Date().toISOString()})
          .eq('id',sessionId);
        if(error)throw error;
      })
      .catch(error=>console.warn('Não foi possível finalizar esta sessão de conversa:',error));
  }

  async function restoreInterruptedTextConversation(){
    const sessionId=readActiveTextSession();
    if(!sessionId||!canPersistConversation())return false;

    const {data:session,error:sessionError}=await sbClient
      .from('conversation_sessions')
      .select('id,level,mode,started_at')
      .eq('id',sessionId)
      .eq('user_id',currentUser.id)
      .eq('mode','text')
      .is('finished_at',null)
      .maybeSingle();
    if(sessionError)throw sessionError;
    if(!session){
      clearActiveTextSession();
      return false;
    }

    const {data:storedMessages,error:messagesError}=await sbClient
      .from('conversation_messages')
      .select('id,role,content,corrections,vocabulary,created_at')
      .eq('session_id',sessionId)
      .order('created_at',{ascending:true});
    if(messagesError)throw messagesError;

    const messages=(storedMessages||[]).map(message=>({
      dbId:String(message?.id||''),
      role:message?.role==='assistant'?'assistant':'user',
      content:String(message?.content||'').trim(),
      corrections:Array.isArray(message?.corrections)?message.corrections:[],
      vocabulary:Array.isArray(message?.vocabulary)?message.vocabulary:[]
    })).filter(message=>message.content);
    // Do not reopen an empty greeting if an update happened before the student
    // had started to participate.
    if(!messages.some(message=>message.role==='user'))return false;

    state.sessionId=String(session.id);
    state.sessionCreation=null;
    state.persistenceChain=Promise.resolve();
    state.sessionMode='text';
    state.started=true;
    state.startedAt=Date.parse(session.started_at)||Date.now();
    state.messages=messages;
    state.level=VALID_LEVELS.has(session.level)?session.level:state.level;
    saveLevel();
    return true;
  }

  function saveLiveReportSilently(report){
    if(!canPersistConversation()||!report)return;
    state.persistenceChain=state.persistenceChain
      .then(async()=>{
        const sessionId=await ensureConversationSession();
        if(!sessionId)return;
        const {error}=await sbClient.from('conversation_sessions')
          .update({report})
          .eq('id',sessionId);
        if(error)throw error;
      })
      .catch(error=>console.warn('Não foi possível salvar o relatório desta conversa:',error));
  }

  function syncLevelButtons(){
    document.querySelectorAll('[data-conversation-level]').forEach(button=>{
      const active=button.dataset.conversationLevel===state.level;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    const badge=element('conversation-level-badge');
    if(badge)badge.textContent=state.level;
  }

  function syncModeButtons(){
    document.querySelectorAll('[data-conversation-mode]').forEach(button=>{
      const active=button.dataset.conversationMode===state.selectedMode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    const start=element('conversation-start');
    if(start){
      start.innerHTML=state.selectedMode==='live'
        ? 'Start Live Conversation <i class="fa-solid fa-headphones"></i>'
        : 'Start conversation <i class="fa-solid fa-arrow-right"></i>';
    }
  }

  function setConversationMode(mode){
    if(state.started||state.livePending||state.liveStarted)return;
    if(mode==='live'&&!state.liveConfig?.enabled)return;
    if(mode!=='text'&&mode!=='live')return;
    state.selectedMode=mode;
    syncModeButtons();
  }

  async function refreshLiveAvailability(){
    const liveButton=element('conversation-live-mode');
    if(!liveButton)return;
    if(teacherPreviewActive()||!canPersistConversation()||!window.ConversationLiveClient){
      liveButton.classList.add('hidden');
      return;
    }
    const config=await window.ConversationLiveClient.availability();
    state.liveConfig=config;
    liveButton.classList.toggle('hidden',!config.enabled);
    if(!config.enabled&&state.selectedMode==='live')state.selectedMode='text';
    syncModeButtons();
  }

  function setConversationLevel(level){
    if(!VALID_LEVELS.has(level)||state.started)return;
    state.level=level;
    saveLevel();
    syncLevelButtons();
  }

  function setConversationError(message=''){
    const errorBox=element('conversation-error');
    if(!errorBox)return;
    errorBox.textContent=message;
    errorBox.classList.toggle('hidden',!message);
  }

  function messageNode(message,index){
    const wrapper=document.createElement('article');
    wrapper.className=`conversation-message ${message.role}`;
    wrapper.dataset.messageIndex=String(index);

    const bubble=document.createElement('div');
    bubble.className='conversation-bubble';
    bubble.textContent=message.content;
    wrapper.appendChild(bubble);

    if(message.role==='assistant'&&Array.isArray(message.corrections)&&message.corrections.length){
      const correctionBox=document.createElement('div');
      correctionBox.className='conversation-feedback conversation-corrections';

      const title=document.createElement('div');
      title.className='conversation-feedback-title';
      title.innerHTML='<i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Small correction';
      correctionBox.appendChild(title);

      message.corrections.forEach(correction=>{
        const item=document.createElement('div');
        item.className='conversation-correction-item';

        const original=document.createElement('div');
        original.className='conversation-correction-line original';
        original.textContent=`✕ ${correction.original}`;
        const corrected=document.createElement('div');
        corrected.className='conversation-correction-line corrected';
        corrected.textContent=`✓ ${correction.corrected}`;
        item.append(original,corrected);

        if(correction.explanation){
          const explanation=document.createElement('div');
          explanation.className='conversation-correction-explanation';
          explanation.textContent=correction.explanation;
          item.appendChild(explanation);
        }
        correctionBox.appendChild(item);
      });
      wrapper.appendChild(correctionBox);
    }

    if(message.role==='assistant'&&Array.isArray(message.vocabulary)&&message.vocabulary.length){
      const vocabularyBox=document.createElement('div');
      vocabularyBox.className='conversation-feedback conversation-vocabulary';
      const title=document.createElement('div');
      title.className='conversation-feedback-title';
      title.innerHTML='<i class="fa-solid fa-book-open" aria-hidden="true"></i> New vocabulary';
      vocabularyBox.appendChild(title);
      message.vocabulary.forEach(word=>{
        const item=document.createElement('div');
        item.className='conversation-vocabulary-item';
        const original=document.createElement('span');
        original.textContent=word.original;
        const arrow=document.createElement('i');
        arrow.className='fa-solid fa-arrow-right';
        arrow.setAttribute('aria-hidden','true');
        const english=document.createElement('strong');
        english.textContent=word.english;
        item.append(original,arrow,english);
        vocabularyBox.appendChild(item);
      });
      wrapper.appendChild(vocabularyBox);
    }
    return wrapper;
  }

  function renderMessages(){
    const list=element('conversation-messages');
    if(!list)return;
    list.replaceChildren(...state.messages.map(messageNode));
    list.scrollTop=list.scrollHeight;
  }

  function showThinking(){
    const list=element('conversation-messages');
    if(!list)return;
    element('conversation-thinking')?.remove();
    const thinking=document.createElement('article');
    thinking.id='conversation-thinking';
    thinking.className='conversation-message assistant conversation-thinking';
    thinking.setAttribute('aria-label','Thinking');
    thinking.innerHTML='<div class="conversation-bubble"><span>Thinking</span><span class="conversation-thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
    list.appendChild(thinking);
    list.scrollTop=list.scrollHeight;
  }

  function hideThinking(){element('conversation-thinking')?.remove();}

  function updateComposer(){
    const input=element('conversation-input');
    const send=element('conversation-send');
    const count=element('conversation-count');
    if(!input||!send)return;
    const length=input.value.length;
    input.disabled=state.pending;
    send.disabled=state.pending||!input.value.trim();
    if(count)count.textContent=`${length}/${MAX_MESSAGE_LENGTH}`;
  }

  function resizeComposer(){
    const input=element('conversation-input');
    if(!input)return;
    input.style.height='auto';
    input.style.height=`${Math.min(input.scrollHeight,132)}px`;
  }

  function greeting(){
    if(teacherPreviewActive()){
      return "Hi! This is the Conversation Practice preview. What would you like to talk about?";
    }
    const firstName=String(currentUser?.name||'').trim().split(/\s+/)[0];
    return firstName
      ? `Hi, ${firstName}! I'm happy to practice English with you. How was your day?`
      : "Hi! I'm happy to practice English with you. How was your day?";
  }

  function startConversation(){
    if(state.started)return;
    if(state.selectedMode==='live'){
      startLiveConversation();
      return;
    }
    state.started=true;
    const greetingMessage={role:'assistant',content:greeting()};
    state.messages=[greetingMessage];
    state.sessionMode='text';
    state.startedAt=Date.now();
    state.sheetReportSent=false;
    saveLevel();
    element('conversation-setup')?.classList.add('hidden');
    element('conversation-chat')?.classList.remove('hidden');
    syncLevelButtons();
    renderMessages();
    setConversationError('');
    persistMessageSilently(greetingMessage);
    setTimeout(()=>element('conversation-input')?.focus(),60);
  }

  function changeConversationLevel(){
    if(state.pending||state.livePending)return;
    if(state.sessionMode==='live_voice'){
      reportConversationStudy({mode:'live_voice',report:state.liveReport});
    }else if(state.started){
      finishConversationSessionSilently();
      reportConversationStudy({mode:'text'});
      clearActiveTextSession();
    }
    state.liveEnding=true;
    clearLiveTimer();
    window.ConversationLiveClient?.disconnect();
    state.started=false;
    state.liveStarted=false;
    state.messages=[];
    state.sessionId='';
    state.sessionCreation=null;
    state.persistenceChain=Promise.resolve();
    state.sessionMode='text';
    state.liveReport=null;
    state.startedAt=0;
    state.sheetReportSent=false;
    setConversationError('');
    element('conversation-chat')?.classList.add('hidden');
    element('conversation-live')?.classList.add('hidden');
    element('conversation-setup')?.classList.remove('hidden');
    syncLevelButtons();
    syncModeButtons();
  }

  function setLiveStatus(status,message=''){
    const label=element('conversation-live-status');
    const note=element('conversation-live-note');
    const connect=element('conversation-live-connect');
    const end=element('conversation-live-end');
    const mute=element('conversation-live-mute');
    const states={
      connecting:'Connecting...',
      connected:'Preparing microphone...',
      'requesting-microphone':'Allow microphone access...',
      listening:'● Listening',
      'student-speaking':'● Student speaking',
      'ai-speaking':'● Tutor speaking',
      'audio-error':'Audio needs attention',
      reconnecting:'Reconnecting...',
      disconnected:'Disconnected',
      error:'Could not connect',
      'microphone-error':'Microphone unavailable'
    };
    if(label)label.textContent=states[status]||'Ready to connect';
    if(note)note.textContent=message||(
      status==='listening'
        ? 'Speak naturally. You can pause whenever you need.'
        : status==='ai-speaking'
          ? 'You can interrupt the tutor at any time.'
        : 'Your microphone will be requested when you start.'
    );
    if(connect){
      connect.disabled=status==='connecting'||status==='connected'||status==='requesting-microphone'||status==='reconnecting';
      connect.classList.toggle('hidden',status==='listening'||status==='student-speaking'||status==='ai-speaking');
    }
    if(end)end.classList.toggle('hidden',status!=='listening'&&status!=='student-speaking'&&status!=='ai-speaking'&&status!=='audio-error');
    if(mute){
      mute.classList.toggle('hidden',status!=='listening'&&status!=='student-speaking'&&status!=='ai-speaking'&&status!=='audio-error');
      mute.textContent='Mute';
      mute.setAttribute('aria-pressed','false');
    }
  }

  function clearLiveTimer(){
    if(state.liveTimer)clearInterval(state.liveTimer);
    state.liveTimer=null;
    state.liveEndsAt=0;
    const timer=element('conversation-live-time');
    if(timer)timer.textContent='';
  }

  function formatRemainingTime(milliseconds){
    const total=Math.max(0,Math.ceil(milliseconds/1000));
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  }

  function startLiveTimer(){
    if(state.liveEndsAt)return;
    const minutes=Math.max(1,Number(state.liveConfig?.maxSessionMinutes)||10);
    state.liveEndsAt=Date.now()+minutes*60*1000;
    const tick=()=>{
      const remaining=state.liveEndsAt-Date.now();
      const timer=element('conversation-live-time');
      if(timer)timer.textContent=`${formatRemainingTime(remaining)} remaining`;
      if(remaining<=0){
        clearLiveTimer();
        endLiveConversation({timeExpired:true});
      }else if(remaining<=2*60*1000&&remaining>2*60*1000-1100){
        const note=element('conversation-live-note');
        if(note)note.textContent='Your practice session is almost finished.';
      }
    };
    tick();
    state.liveTimer=setInterval(tick,1000);
  }

  function handleLiveConnectionState(status,message){
    if(status==='listening'){
      state.liveStarted=true;
      startLiveTimer();
    }
    if(status==='disconnected'){
      state.liveStarted=false;
      if(!state.liveEnding)attemptLiveReconnect();
    }
    if(status==='error'||status==='microphone-error')state.liveStarted=false;
    setLiveStatus(status,message);
  }

  async function openLiveConnection(){
    const session=await window.ConversationLiveClient.connect({
      model:state.liveConfig.model,
      level:state.level,
      onState:handleLiveConnectionState,
      onTranscript:receiveLiveTranscript
    });
    await window.ConversationLiveClient.startMicrophone(session,{
      onState:handleLiveConnectionState
    });
  }

  async function attemptLiveReconnect(){
    if(state.liveEnding||state.livePending)return;
    if(state.liveReconnectAttempts>=2){
      setLiveStatus('disconnected','The connection was lost. Please end this conversation and try again later.');
      return;
    }
    state.liveReconnectAttempts+=1;
    state.livePending=true;
    setLiveStatus('reconnecting',`Reconnecting (${state.liveReconnectAttempts}/2)...`);
    try{
      await new Promise(resolve=>setTimeout(resolve,900*state.liveReconnectAttempts));
      if(!state.liveEnding)await openLiveConnection();
    }catch(error){
      if(state.liveReconnectAttempts>=2){
        setLiveStatus('disconnected','The connection was lost. Please end this conversation and try again later.');
      }
    }finally{
      state.livePending=false;
    }
  }

  async function startLiveConversation(){
    if(state.livePending||state.liveStarted)return;
    const config=state.liveConfig;
    if(!config?.enabled||!config.model){
      setConversationError('A conversa ao vivo ainda não está disponível.');
      return;
    }
    state.livePending=true;
    state.liveEnding=false;
    state.liveReconnectAttempts=0;
    clearLiveTimer();
    state.sessionMode='live_voice';
    state.startedAt=Date.now();
    state.sheetReportSent=false;
    setConversationError('');
    element('conversation-setup')?.classList.add('hidden');
    element('conversation-live')?.classList.remove('hidden');
    state.liveTranscripts=[];
    state.liveReport=null;
    state.sessionId='';
    state.sessionCreation=null;
    state.persistenceChain=Promise.resolve();
    renderLiveTranscripts();
    renderLiveReport();
    ensureConversationSession().catch(error=>console.warn('A sessão Live será salva quando houver uma transcrição:',error));
    setLiveStatus('connecting');
    try{
      await window.ConversationLiveClient.preparePlayback();
      await openLiveConnection();
    }catch(error){
      state.liveStarted=false;
    }finally{
      state.livePending=false;
    }
  }

  async function endLiveConversation({timeExpired=false}={}){
    if(state.liveEnding)return;
    state.liveEnding=true;
    clearLiveTimer();
    await window.ConversationLiveClient?.disconnect();
    state.liveStarted=false;
    state.livePending=false;
    setLiveStatus('disconnected',timeExpired?'Your practice session has finished.':'Conversation ended.');
    finishConversationSessionSilently();
    generateLiveReport().finally(()=>reportConversationStudy({mode:'live_voice',report:state.liveReport}));
  }

  function toggleLiveMute(){
    const isMuted=window.ConversationLiveClient?.toggleMute();
    const mute=element('conversation-live-mute');
    if(!mute)return;
    mute.textContent=isMuted?'Unmute':'Mute';
    mute.setAttribute('aria-pressed',String(Boolean(isMuted)));
  }

  function receiveLiveTranscript(transcript){
    const role=transcript?.role==='assistant'?'assistant':'user';
    const content=String(transcript?.content||'').trim();
    if(!content)return;
    const latest=state.liveTranscripts.at(-1);
    if(latest&&latest.role===role&&!latest.final){
      latest.content=content;
      latest.final=Boolean(transcript.final);
    }else{
      state.liveTranscripts.push({role,content,final:Boolean(transcript.final)});
    }
    renderLiveTranscripts();
    const saved=state.liveTranscripts.at(-1);
    if(saved?.final&&!saved.persisted){
      saved.persisted=true;
      persistMessageSilently(saved);
    }
    if(saved?.final&&saved.role==='user'&&!saved.correctionRequested){
      saved.correctionRequested=true;
      requestLiveCorrections(saved);
    }
    if(saved?.final&&saved.role==='user'&&state.liveTranscripts.filter(item=>item.role==='user'&&item.final).length===1){
      reportConversationStudy({mode:'live_voice'});
    }
  }

  function correctionContextFor(item){
    const index=state.liveTranscripts.indexOf(item);
    return state.liveTranscripts.slice(Math.max(0,index-3),index)
      .filter(turn=>turn.final)
      .map(turn=>`${turn.role==='assistant'?'Tutor':'Student'}: ${turn.content}`)
      .join('\n')
      .slice(-1200);
  }

  async function requestLiveCorrections(item){
    if(!sbClient||!item?.content)return;
    try{
      const {data,error}=await sbClient.functions.invoke('conversation-ai',{
        body:{
          action:'analyze_utterance',
          level:state.level,
          text:item.content.slice(0,MAX_MESSAGE_LENGTH),
          previousTurnContext:correctionContextFor(item)
        }
      });
      if(error)throw error;
      const corrections=Array.isArray(data?.corrections)
        ? data.corrections.slice(0,5).map(correction=>({
          original:String(correction?.original||'').trim(),
          corrected:String(correction?.corrected||'').trim(),
          explanation:String(correction?.explanation||'').trim()
        })).filter(correction=>correction.original&&correction.corrected)
        : [];
      if(!data?.hasImportantCorrection||!corrections.length)return;
      item.corrections=corrections;
      renderLiveTranscripts();
      updateMessageCorrectionsSilently(item);
    }catch(error){
      console.warn('A correção em segundo plano não pôde ser mostrada:',error);
    }
  }

  function renderLiveTranscripts(){
    const list=element('conversation-live-transcript');
    if(!list)return;
    list.replaceChildren(...state.liveTranscripts.map(item=>{
      const row=document.createElement('div');
      row.className=`conversation-live-transcript-row ${item.role}${item.final?'':' partial'}`;
      const label=document.createElement('strong');
      label.textContent=item.role==='assistant'?'TUTOR':'YOU';
      const text=document.createElement('span');
      text.textContent=item.content;
      row.append(label,text);
      if(Array.isArray(item.corrections)&&item.corrections.length){
        const feedback=document.createElement('div');
        feedback.className='conversation-live-correction';
        const title=document.createElement('strong');
        title.textContent='💡 Small correction';
        feedback.appendChild(title);
        item.corrections.forEach(correction=>{
          const original=document.createElement('span');
          original.className='original';
          original.textContent=`✕ ${correction.original}`;
          const corrected=document.createElement('span');
          corrected.className='corrected';
          corrected.textContent=`✓ ${correction.corrected}`;
          feedback.append(original,corrected);
          if(correction.explanation){
            const explanation=document.createElement('small');
            explanation.textContent=correction.explanation;
            feedback.appendChild(explanation);
          }
        });
        row.appendChild(feedback);
      }
      return row;
    }));
    list.scrollTop=list.scrollHeight;
  }

  function normalizedLiveReport(value){
    if(!value||typeof value!=='object')return null;
    const textList=(items,maximum=3)=>Array.isArray(items)
      ? items.slice(0,maximum).map(item=>String(item||'').trim()).filter(Boolean)
      : [];
    const corrections=Array.isArray(value.importantCorrections)
      ? value.importantCorrections.slice(0,5).map(item=>({
        original:String(item?.original||'').trim(),
        corrected:String(item?.corrected||'').trim(),
        explanation:String(item?.explanation||'').trim()
      })).filter(item=>item.original&&item.corrected)
      : [];
    const suggestedPractice=String(value.suggestedPractice||'').trim();
    return {grammar:textList(value.grammar),vocabulary:textList(value.vocabulary),communication:textList(value.communication),importantCorrections:corrections,newUsefulExpressions:textList(value.newUsefulExpressions),suggestedPractice};
  }

  function reportList(title,items){
    if(!items.length)return null;
    const section=document.createElement('section');
    const heading=document.createElement('strong');
    heading.textContent=title;
    const list=document.createElement('ul');
    items.forEach(item=>{
      const row=document.createElement('li');
      row.textContent=item;
      list.appendChild(row);
    });
    section.append(heading,list);
    return section;
  }

  function renderLiveReport(){
    const container=element('conversation-live-report');
    if(!container)return;
    const report=state.liveReport;
    container.replaceChildren();
    container.classList.toggle('hidden',!report);
    if(!report)return;
    const title=document.createElement('h2');
    title.textContent='Conversation Report';
    container.appendChild(title);
    [
      reportList('Grammar',report.grammar),
      reportList('Vocabulary',report.vocabulary),
      reportList('Communication',report.communication),
      reportList('New useful expressions',report.newUsefulExpressions)
    ].filter(Boolean).forEach(section=>container.appendChild(section));
    if(report.importantCorrections.length){
      const corrections=document.createElement('section');
      const heading=document.createElement('strong');
      heading.textContent='Important corrections';
      corrections.appendChild(heading);
      report.importantCorrections.forEach(correction=>{
        const row=document.createElement('p');
        row.textContent=`${correction.original} → ${correction.corrected}`;
        corrections.appendChild(row);
      });
      container.appendChild(corrections);
    }
    if(report.suggestedPractice){
      const practice=document.createElement('p');
      practice.className='conversation-live-report-practice';
      practice.textContent=`Next practice: ${report.suggestedPractice}`;
      container.appendChild(practice);
    }
  }

  async function generateLiveReport(){
    if(state.liveReport||!sbClient)return;
    const messages=state.liveTranscripts
      .filter(item=>item.final&&item.content)
      .slice(-MAX_HISTORY_MESSAGES)
      .map(item=>({role:item.role,content:item.content.slice(0,MAX_MESSAGE_LENGTH)}));
    if(!messages.length)return;
    const note=element('conversation-live-note');
    if(note)note.textContent='Preparing your conversation report...';
    try{
      const {data,error}=await sbClient.functions.invoke('conversation-ai',{
        body:{action:'generate_report',level:state.level,messages}
      });
      if(error)throw error;
      const report=normalizedLiveReport(data);
      if(!report)throw new Error('Relatório inválido.');
      state.liveReport=report;
      renderLiveReport();
      saveLiveReportSilently(report);
      if(note)note.textContent='Your report is ready.';
    }catch(error){
      console.warn('O relatório da conversa não pôde ser criado:',error);
      if(note)note.textContent='Your conversation was saved. The report could not be created right now.';
    }
  }

  async function friendlyFunctionError(error){
    let message='Não consegui falar com o tutor agora. Tente novamente em alguns instantes.';
    try{
      const response=error?.context;
      if(response&&typeof response.json==='function'){
        const payload=await response.json();
        if(payload?.error?.message)message=payload.error.message;
      }
    }catch(parseError){
      console.warn('Resposta de erro da conversa não pôde ser lida:',parseError);
    }
    return message;
  }

  function normalizedPreviewText(value){
    return String(value||'')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function previewCorrection(original,corrected,explanation){
    return {original,corrected,explanation};
  }

  function teacherPreviewCorrections(message){
    const text=String(message||'');
    const normalized=normalizedPreviewText(text);
    const corrections=[];
    if(/\bdocumentaries who talk about true crimes\b/i.test(text)){
      corrections.push(previewCorrection(
        'documentaries who talk about true crimes',
        'documentaries about true crime',
        "Use 'about' to describe the subject of a documentary."
      ));
    }
    if(/\bat my home\b/i.test(text)){
      corrections.push(previewCorrection('at my home','at home',"We normally say 'at home'."));
    }
    if(/\balot(?:\s+of)?\b/i.test(text)){
      corrections.push(previewCorrection('alot games','a lot of games',"Write 'a lot' as two words and use 'of' before a noun."));
    }
    if(/\bwith survival theme\b/i.test(text)){
      corrections.push(previewCorrection('with survival theme','with a survival theme',"Use 'a' before a singular countable noun."));
    }
    if(/\bstarted play\b/i.test(text)){
      corrections.push(previewCorrection('started play','started playing',"Use the -ing form after 'started'."));
    }
    if(/\bhobbie\b/i.test(text)){
      corrections.push(previewCorrection('hobbie','hobby',"The singular spelling is 'hobby'."));
    }
    if(/\blik\b/i.test(text)){
      corrections.push(previewCorrection('lik','like',"The correct spelling is 'like'."));
    }
    if(/\bfrien\b/i.test(text)){
      corrections.push(previewCorrection('frien','friend',"The correct spelling is 'friend'."));
    }
    if(/\bthe aspect of surviving\b/i.test(text)&&/\bbuild\b/i.test(text)){
      corrections.push(previewCorrection(
        'the aspect of surviving in the game, build, and make progress',
        'surviving in the game, building, and making progress',
        'Use the same -ing form for each item in the list.'
      ));
    }
    if(!corrections.length&&/\bi play\s+(?:a lot of\s+)?games? with (?:a )?survival theme\b/i.test(normalized)){
      corrections.push(previewCorrection('games with survival theme','games with a survival theme',"Use 'a' before a singular countable noun."));
    }
    return corrections.slice(0,5);
  }

  function teacherPreviewReply(){
    const userMessages=state.messages.filter(message=>message.role==='user');
    const currentMessage=userMessages.at(-1)?.content||'';
    const current=normalizedPreviewText(currentMessage);
    const conversation=normalizedPreviewText(userMessages.map(message=>message.content).join(' '));
    const gamePattern=/\b(games?|video games?|jogos?)\b/;
    let reply='I understand. What specific part would you like to describe in English?';

    if(/\b(hi|hello|hey|how are you)\b/.test(current)){
      reply="I'm doing well, thank you! What topic would you enjoy practicing today?";
    }else if(/\b(movie|movies|film|films|cinema)\b/.test(current)){
      reply='Movies are a great topic. Which genre gives you the strongest emotions?';
    }else if(/\b(documentaries?|drama)\b/.test(current)&&!/\btrue crime/.test(current)){
      reply='Documentaries and dramas can both tell powerful stories. Which one do you watch more often?';
    }else if(/\btrue crimes?\b/.test(current)){
      reply='True-crime documentaries can be fascinating. Do you prefer solved or unsolved cases?';
    }else if(/\b(at my home|at home)\b/.test(current)&&/\b(alone|watch)\b/.test(current)){
      reply='Watching alone can help you focus on every detail. What was the last documentary you watched?';
    }else if(/^alone$/.test(current)){
      reply='Watching alone can make an intense story feel even stronger. Do true-crime documentaries ever scare you?';
    }else if(/\b(last of us)\b/.test(current)){
      reply='The Last of Us combines survival with a powerful story. Which character do you find most memorable?';
    }else if(gamePattern.test(current)&&!/\bsurvival\b/.test(current)){
      reply='Games are a fun new topic. Do you prefer games with strong stories or challenging gameplay?';
    }else if(/\bsurvival\b/.test(current)&&/\b(favorite|dont have|do not have|play alot|play a lot)\b/.test(current)){
      reply='You enjoy the survival style more than one specific title. Which matters more to you: exploration or collecting resources?';
    }else if(/\bsurvival\b/.test(current)){
      reply='Survival games make every resource feel important. What do you usually try to find first?';
    }else if(/\b(aspect|surviving|build|progress)\b/.test(current)){
      reply='Building something step by step makes progress feel rewarding. What kind of base do you like to build?';
    }else if(/\b(thabata|friend|frien)\b/.test(current)){
      reply=conversation.includes('thabata')
        ? 'Playing with Thabata must make difficult moments more fun. How do you divide the tasks in the game?'
        : 'Playing with a friend can make survival easier. How do you help each other?';
    }else if(/\b(hobby|hobbie)\b/.test(current)){
      reply='A good hobby helps you relax, and games can also tell memorable stories. What feeling do you look for when you play?';
    }else if(/\b(music|song|songs|musica|musicas)\b/.test(current)){
      reply='Music can change your mood quickly. Which song always makes you feel better?';
    }

    return {
      reply,
      corrections:teacherPreviewCorrections(currentMessage),
      vocabulary:/\bfolga\b/i.test(currentMessage)?[{original:'folga',english:'day off'}]:[]
    };
  }

  function normalizedTutorPayload(data){
    const reply=String(data?.reply||'').trim();
    if(!reply)throw new Error('O tutor respondeu sem texto. Tente novamente.');
    const corrections=Array.isArray(data?.corrections)
      ? data.corrections.slice(0,5).map(item=>({
        original:String(item?.original||'').trim(),
        corrected:String(item?.corrected||'').trim(),
        explanation:String(item?.explanation||'').trim()
      })).filter(item=>item.original&&item.corrected)
      : [];
    const vocabulary=Array.isArray(data?.vocabulary)
      ? data.vocabulary.slice(0,5).map(item=>({
        original:String(item?.original||'').trim(),
        english:String(item?.english||'').trim()
      })).filter(item=>item.original&&item.english)
      : [];
    return {reply,corrections,vocabulary};
  }

  async function requestTutorReply(){
    if(teacherPreviewActive()){
      await new Promise(resolve=>setTimeout(resolve,450));
      return teacherPreviewReply();
    }
    if(!sbClient)throw new Error('Supabase indisponível. Entre novamente no portal.');
    const history=state.messages
      .filter(message=>message.role==='user'||message.role==='assistant')
      .slice(-MAX_HISTORY_MESSAGES)
      .map(message=>({role:message.role,content:message.content}));
    const {data,error}=await sbClient.functions.invoke('conversation-ai',{
      body:{action:'chat',level:state.level,messages:history}
    });
    if(error)throw error;
    return normalizedTutorPayload(data);
  }

  async function sendConversationMessage(){
    const input=element('conversation-input');
    if(!input||state.pending||!state.started)return;
    const content=input.value.trim();
    if(!content)return;
    if(content.length>MAX_MESSAGE_LENGTH){
      setConversationError(`Sua mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    const studentMessage={role:'user',content};
    state.messages.push(studentMessage);
    persistMessageSilently(studentMessage);
    input.value='';
    resizeComposer();
    state.pending=true;
    setConversationError('');
    renderMessages();
    showThinking();
    updateComposer();

    try{
      const result=await requestTutorReply();
      const tutorMessage={
        role:'assistant',
        content:result.reply,
        corrections:result.corrections,
        vocabulary:result.vocabulary
      };
      state.messages.push(tutorMessage);
      persistMessageSilently(tutorMessage);
      if(state.messages.filter(message=>message.role==='user').length===1){
        reportConversationStudy({mode:'text'});
      }
    }catch(error){
      console.warn('Conversation Practice aguardando nova tentativa:',error);
      setConversationError(error?.message?.startsWith('Supabase')?error.message:await friendlyFunctionError(error));
    }finally{
      state.pending=false;
      hideThinking();
      renderMessages();
      updateComposer();
      input.focus();
    }
  }

  async function openConversationPractice(){
    const realStudent=currentUser?.role==='student'&&Boolean(currentUser?.id);
    if(!realStudent&&!teacherPreviewActive()){
      alert('A conversa com IA está disponível para alunos conectados. Entre com uma conta de aluno para testar.');
      return;
    }
    resetForCurrentStudent();
    if(!state.started&&!teacherPreviewActive()){
      try{
        await restoreInterruptedTextConversation();
      }catch(error){
        console.warn('Não foi possível recuperar a conversa interrompida:',error);
      }
    }
    showView('conversation');
    element('conversation-teacher-preview')?.classList.toggle('hidden',!teacherPreviewActive());
    element('conversation-setup')?.classList.toggle('hidden',state.started);
    element('conversation-chat')?.classList.toggle('hidden',!state.started);
    element('conversation-live')?.classList.add('hidden');
    syncLevelButtons();
    syncModeButtons();
    renderMessages();
    updateComposer();
    refreshLiveAvailability();
  }

  function closeConversationPractice(){
    if(state.sessionMode==='live_voice'){
      if(!state.liveEnding){
        state.liveEnding=true;
        clearLiveTimer();
        window.ConversationLiveClient?.disconnect();
        finishConversationSessionSilently();
        generateLiveReport().finally(()=>reportConversationStudy({mode:'live_voice',report:state.liveReport}));
      }
    }else if(state.started){
      finishConversationSessionSilently();
      reportConversationStudy({mode:'text'});
      clearActiveTextSession();
    }
    state.liveEnding=true;
    clearLiveTimer();
    window.ConversationLiveClient?.disconnect();
    state.liveStarted=false;
    state.livePending=false;
    element('conversation-teacher-preview')?.classList.add('hidden');
    showView('student');
    switchStudentTab('inicio');
  }

  async function finishTextConversation(){
    if(!state.started||state.pending)return;
    finishConversationSessionSilently();
    reportConversationStudy({mode:'text'});
    clearActiveTextSession();
    await state.persistenceChain;
    state.started=false;
    state.messages=[];
    state.sessionId='';
    state.sessionCreation=null;
    state.startedAt=0;
    state.sheetReportSent=false;
    element('conversation-chat')?.classList.add('hidden');
    showView('student');
    switchStudentTab('inicio');
  }

  function handleComposerKeydown(event){
    if(event.key==='Enter'&&!event.shiftKey){
      event.preventDefault();
      sendConversationMessage();
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const input=element('conversation-input');
    input?.addEventListener('input',()=>{
      resizeComposer();
      updateComposer();
      setConversationError('');
    });
    input?.addEventListener('keydown',handleComposerKeydown);
    updateComposer();
    window.addEventListener('pagehide',()=>{
      if(state.sessionMode==='live_voice'){
        reportConversationStudy({mode:'live_voice',report:state.liveReport,keepalive:true});
      }else if(state.started){
        reportConversationStudy({mode:'text',keepalive:true});
      }
    });
  });

  window.openConversationPractice=openConversationPractice;
  window.isConversationInProgress=()=>Boolean(
    (state.sessionMode==='text'&&state.started)||state.livePending||state.liveStarted
  );
  window.closeConversationPractice=closeConversationPractice;
  window.finishTextConversation=finishTextConversation;
  window.setConversationLevel=setConversationLevel;
  window.setConversationMode=setConversationMode;
  window.changeConversationLevel=changeConversationLevel;
  window.startConversation=startConversation;
  window.startLiveConversation=startLiveConversation;
  window.endLiveConversation=endLiveConversation;
  window.toggleLiveMute=toggleLiveMute;
  window.sendConversationMessage=sendConversationMessage;
})();
