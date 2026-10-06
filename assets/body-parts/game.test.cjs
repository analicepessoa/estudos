const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let click;const storage=new Map(),spoken=[];
const host={dataset:{},innerHTML:'',contains:()=>false,querySelector:()=>null,replaceChildren(){this.innerHTML='';},addEventListener(type,fn){if(type==='click')click=fn;}};
const synth={voices:[{lang:'en-US'}],cancel(){},getVoices(){return this.voices},speak(utterance){spoken.push(utterance.text);utterance.onstart?.();}};
function TestUtterance(text){this.text=text;}
const context={BodyPartsCore:require('./core.js'),document:{getElementById:()=>host,activeElement:null},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:(fn,delay)=>{if(delay<2000)fn();return 0;},SpeechSynthesisUtterance:TestUtterance,speechSynthesis:synth,console,crypto:require('node:crypto')};
context.window=context;context.addEventListener=()=>{};context.confirm=()=>true;
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
const action=a=>click({target:{closest:()=>({dataset:{action:a}})}});
const choose=id=>click({target:{closest:()=>({dataset:{word:id}})}});
const chooseDetail=id=>click({target:{closest:()=>({dataset:{detailArea:id}})}});
context.BodyParts.open('student-A');action('open-basic');assert.match(host.innerHTML,/Corpo básico/);
action('learn');choose('hair');assert.match(host.innerHTML,/Brush your hair every morning/);action('exit');action('open');
action('practice');
const total=context.BodyPartsCore.chapters['basic-body'].total;
for(let i=0;i<total;i++){
  const targetLabel=host.innerHTML.match(/class="bp-word"[^>]*>([^<]+)/)[1];
  const target=context.BodyPartsCore.words.find(word=>word.en===targetLabel).id;
  if(i===0){choose(target==='eye'?'ear':'eye');choose(target==='eye'?'ear':'eye');assert.match(host.innerHTML,/Esta é a resposta/);}
  choose(target);choose(target);action('next');
}
assert.ok(spoken.length>=total,'Every completed answer should play its pronunciation.');
assert.match(host.innerHTML,new RegExp(`${(total-1)*10} / ${total*10}`));assert.equal(storage.size,1);
action('save');assert.equal(JSON.parse([...storage.values()][0]).length,1);
action('review');assert.match(host.innerHTML,/Tentar sem ajuda/);action('try');
const reviewLabel=host.innerHTML.match(/class="bp-word"[^>]*>([^<]+)/)[1];const reviewTarget=context.BodyPartsCore.words.find(word=>word.en===reviewLabel).id;choose(reviewTarget);action('next');assert.match(host.innerHTML,/Revisão concluída/);
action('home');assert.match(host.innerHTML,/Fase 2/);assert.match(host.innerHTML,/Disponível/);action('open-details');assert.match(host.innerHTML,/Escolha uma região/);chooseDetail('hands');assert.match(host.innerHTML,/Dedos da mão/);action('open-fingers');choose('pinky');assert.match(host.innerHTML,/My pinky is small/);action('exit');
context.BodyParts.reset();context.BodyParts.open('student-B');assert.doesNotMatch(host.innerHTML,/Seus recordes/);
context.BodyParts.open('student-A');assert.match(host.innerHTML,/Fase 2/);assert.match(host.innerHTML,/Disponível/);
storage.set('ap_body_parts_v1_student-A','broken');context.BodyParts.open('student-A');assert.match(host.innerHTML,/Bloqueada/);
context.isTeacherPreview=()=>true;context.BodyParts.open('teacher-preview');assert.match(host.innerHTML,/Prévia administrativa/);action('open-details');assert.match(host.innerHTML,/Detalhes por região/);context.isTeacherPreview=()=>false;
synth.voices=[];action('open-basic');action('listen');assert.match(host.innerHTML,/voz em inglês não está disponível/);choose('eye');assert.doesNotMatch(host.innerHTML,/Correct!/);

// Test Phase 3 - Explore, Find the Organ, and Functions Challenge
synth.voices=[{lang:'en-US'}];
action('open-organs');
assert.match(host.innerHTML,/Internal Organs/);
assert.match(host.innerHTML,/Functions Challenge/);

action('start-functions-challenge');
assert.match(host.innerHTML,/FUNCTIONS CHALLENGE/);
assert.match(host.innerHTML,/Question 1 \/ 8/);
action('function-audio');
assert.ok(spoken.length>0);

for(let i=0;i<8;i++){
  const qMatch=host.innerHTML.match(/class="bp-word[^"]*"[^>]*>([^<]+)/);
  assert.ok(qMatch);
  const qText=qMatch[1];
  const targetId=Object.keys(context.BodyPartsCore.organFunctionQuestions).find(id=>context.BodyPartsCore.organFunctionQuestions[id]===qText);
  assert.ok(targetId,`Must find organ for question: ${qText}`);
  if(i===0){
    const wrong=targetId==='brain'?'heart':'brain';
    choose(wrong);
    assert.match(host.innerHTML,/Try again!/);
  }
  choose(targetId);
}
assert.match(host.innerHTML,/Functions Challenge Complete!/);
assert.match(host.innerHTML,/Accuracy:/);
assert.match(host.innerHTML,/Correct on first try: 7 \/ 8/);

// Now start Find the Organ and complete all 16 rounds on first try
action('start-find-organ');
assert.match(host.innerHTML,/Question 1 \/ 16/);
for(let i=0;i<16;i++){
  const headingMatch=host.innerHTML.match(/class="bp-word[^"]*"[^>]*>([^<]+)/);
  assert.ok(headingMatch);
  const hText=headingMatch[1];
  let targetId;
  if(hText.includes('Listen and find')){
    const spokenWord=spoken[spoken.length-1];
    targetId=context.BodyPartsCore.organWords.find(w=>w.en===spokenWord)?.id;
  }else{
    const organName=hText.replace('Find the ','').replace('.','').trim().toLowerCase();
    targetId=context.BodyPartsCore.organWords.find(w=>w.en===organName)?.id;
  }
  assert.ok(targetId,`Must find target for heading: ${hText}`);
  choose(targetId);
}

// Since Functions Challenge was already completed (7/8), completing Find the Organ (16/16)
// must trigger INTERNAL ORGANS COMPLETE! (Overall 23/24, 3 stars)
assert.match(host.innerHTML,/INTERNAL ORGANS COMPLETE!/);
assert.match(host.innerHTML,/First Try: 16 \/ 16/);
assert.match(host.innerHTML,/First Try: 7 \/ 8/);
assert.match(host.innerHTML,/Overall/);
assert.match(host.innerHTML,/23 \/ 24/);
assert.match(host.innerHTML,/Amazing! You really know the human body!/);
assert.match(host.innerHTML,/bp-star-filled/);

// Verify persistence in storage
const p3StorageKey='ap_body_parts_phase3_teacher-preview';
const savedData=JSON.parse(storage.get(p3StorageKey));
assert.equal(savedData.completed,true);
assert.equal(savedData.bestFirstTry,23);
assert.equal(savedData.bestStars,3);

// Test Best Score Preservation: Play Again and score lower (e.g. 18/24 = 2 stars)
action('replay-phase3');
assert.match(host.innerHTML,/Question 1 \/ 16/);
// Play Find the Organ with some errors: 12 first-try
for(let i=0;i<16;i++){
  const headingMatch=host.innerHTML.match(/class="bp-word[^"]*"[^>]*>([^<]+)/);
  const hText=headingMatch[1];
  let targetId;
  if(hText.includes('Listen and find')){
    const spokenWord=spoken[spoken.length-1];
    targetId=context.BodyPartsCore.organWords.find(w=>w.en===spokenWord)?.id;
  }else{
    const organName=hText.replace('Find the ','').replace('.','').trim().toLowerCase();
    targetId=context.BodyPartsCore.organWords.find(w=>w.en===organName)?.id;
  }
  if(i<4){
    const wrong=targetId==='brain'?'heart':'brain';
    choose(wrong);
  }
  choose(targetId);
}
assert.match(host.innerHTML,/Find the Organ Complete!/);
assert.match(host.innerHTML,/Correct on first try: 12 \/ 16/);

// Proceed to Functions Challenge and get 6 first-try
action('start-functions-challenge');
for(let i=0;i<8;i++){
  const qMatch=host.innerHTML.match(/class="bp-word[^"]*"[^>]*>([^<]+)/);
  const qText=qMatch[1];
  const targetId=Object.keys(context.BodyPartsCore.organFunctionQuestions).find(id=>context.BodyPartsCore.organFunctionQuestions[id]===qText);
  if(i<2){
    const wrong=targetId==='brain'?'heart':'brain';
    choose(wrong);
  }
  choose(targetId);
}

// Now total for this run is 12 + 6 = 18/24 (⭐⭐)
assert.match(host.innerHTML,/INTERNAL ORGANS COMPLETE!/);
assert.match(host.innerHTML,/First Try: 12 \/ 16/);
assert.match(host.innerHTML,/First Try: 6 \/ 8/);
assert.match(host.innerHTML,/18 \/ 24/);
assert.match(host.innerHTML,/Great job! You're getting really good at this!/);
// Notice best record was preserved!
assert.match(host.innerHTML,/Best Record:.*23 \/ 24/);

const savedDataAfterReplay=JSON.parse(storage.get(p3StorageKey));
assert.equal(savedDataAfterReplay.bestFirstTry,23,'Best record of 23 must NOT be overwritten by 18');
assert.equal(savedDataAfterReplay.bestStars,3,'Best 3 stars must NOT be degraded to 2 stars');

// Test Continue button -> returns to Home
action('home');
assert.match(host.innerHTML,/Fase 3/);
assert.match(host.innerHTML,/⭐⭐⭐/);

// Test Explore Organs button -> returns to Explore mode
action('open-organs');
assert.match(host.innerHTML,/Internal Organs/);
assert.match(host.innerHTML,/Resultado: ⭐⭐⭐/);

console.log('PASS: completed session, answer pronunciation, rapid duplicate, assisted answer, review, idempotent save, account isolation, corrupt storage, missing audio, functions challenge, Phase 3 stars & best record retention.');
