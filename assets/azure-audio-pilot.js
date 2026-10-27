// Piloto da professora em ?azureAudioPilot=1. Autorização real ocorre na Edge Function.
(function(global){
 let playing=null, objectUrl='', preparedKey='';
 global.azurePilotEnabled=()=>new URLSearchParams(location.search).get('azureAudioPilot')==='1' && typeof currentUser!=='undefined' && currentUser?.role==='teacher' && typeof isTeacherPreview==='function' && isTeacherPreview();
 global.playAzurePilot=async(text,rate,voice='en-US-JennyNeural')=>{
  if(!global.azurePilotEnabled()||!navigator.onLine) return null;
  const requestKey=JSON.stringify([text,rate,voice]);
  if(playing&&preparedKey===requestKey&&playing.paused){try{await playing.play();return playing}catch{return null}}
  try{
   const {data:{session}}=await sbClient.auth.getSession();
   if(!session) return null;
   const response=await fetch(SUPABASE_URL+'/functions/v1/azure-speech-cache',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({text,rate:Math.max(.75,Math.min(1.25,rate)),voice}),signal:AbortSignal.timeout(15000)});
   if(!response.ok) return null;
   const blob=await response.blob();if(blob.type!=='audio/mpeg') return null;
   if(playing){playing.pause();playing.src='';}if(objectUrl)URL.revokeObjectURL(objectUrl);
   objectUrl=URL.createObjectURL(blob);playing=new Audio(objectUrl);preparedKey=requestKey;
   try{await playing.play();return playing}catch(error){
    if(error.name==='NotAllowedError'){const status=document.getElementById('dict-count');if(status)status.textContent='Áudio pronto. Toque novamente para ouvir.';return playing}
    return null;
   }
  }catch{return null}
 };
})(window);
