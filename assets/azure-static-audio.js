// MP3 fixos da IS08 Semana 01. Nenhuma chamada de síntese ou credencial no cliente.
(function(global){
  'use strict';
  const manifestUrl='assets/audio/azure-static/is08-week01/manifest.json';
  const title='SEMANA 01 - INTERMEDIATE 01 - END TERM 54 - 57';
  let manifestPromise=null, current=null, blocked=null;
  const typeKinds={semana_vocab:'vocab',semana_chunks:'chunks',semana_ditado:'ditado',semana_quiz:'quiz'};
  function enabled(){
    return typeof currentUser!=='undefined' && Boolean(currentUser?.id) &&
      (currentUser.role==='student' ||
        (currentUser.role==='teacher' && typeof isTeacherPreview==='function' && isTeacherPreview())) &&
      typeof activeGame!=='undefined' && activeGame?.context===title &&
      activeGame.sessionId===`semana:is08:${title}:${activeGame.type.replace('semana_','')}` &&
      Object.hasOwn(typeKinds,activeGame.type);
  }
  async function entries(){
    if(!manifestPromise){
      manifestPromise=fetch(manifestUrl).then(response=>{
        if(!response.ok)throw new Error('Manifesto indisponível');
        return response.json();
      }).then(data=>{
        if(data.source?.room!=='is08'||data.source?.weekIndex!==0||data.source?.title!==title||data.items?.length!==34)
          throw new Error('Manifesto inesperado');
        return data.items;
      }).catch(error=>{manifestPromise=null;throw error});
    }
    return manifestPromise;
  }
  function stop(){if(current){const audio=current;current=null;audio.pause();audio.removeAttribute('src');audio.load()}}
  async function play(text,kind,rate=1,onFailure){
    if(!enabled()||typeKinds[activeGame.type]!==kind||!['vocab','chunks','ditado','quiz'].includes(kind))return null;
    try{
      const item=(await entries()).find(entry=>entry.text===text && entry.uses.some(use=>kind==='quiz'?['vocab','chunks'].includes(use.kind):use.kind===kind));
      if(!item||!/^assets\/audio\/azure-static\/is08-week01\/[a-f0-9]{64}\.mp3$/.test(item.path))return null;
      const key=item.id+':'+rate;
      if(blocked?.key===key && blocked.audio?.paused){
        try{await blocked.audio.play();current=blocked.audio;blocked=null;return {audio:current}}
        catch(error){if(error.name==='NotAllowedError')return {audio:blocked.audio,blocked:true};blocked=null;return null}
      }
      stop();blocked=null;
      const audio=new Audio(item.path);
      audio.preload='none';audio.playbackRate=rate;audio.volume=1;
      audio.addEventListener('error',()=>{
        if(current!==audio)return;
        current=null;
        if(enabled()&&typeof onFailure==='function')onFailure();
      });
      try{await audio.play();current=audio;return {audio}}
      catch(error){
        if(error.name==='NotAllowedError'){blocked={key,audio};return {audio,blocked:true}}
        audio.removeAttribute('src');audio.load();return null;
      }
    }catch{return null}
  }
  function status(){return current?{src:current.currentSrc||current.src,readyState:current.readyState,paused:current.paused,currentTime:current.currentTime,error:current.error?.code||null}:null}
  global.staticAudioPilot={enabled,play,stop,status};
})(window);
