const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let click;const storage=new Map(),spoken=[];
const host={dataset:{},innerHTML:'',contains:()=>false,querySelector:()=>null,replaceChildren(){this.innerHTML='';},addEventListener(type,fn){if(type==='click')click=fn;}};
const synth={voices:[{lang:'en-US'}],cancel(){},getVoices(){return this.voices},speak(utterance){spoken.push(utterance.text);utterance.onstart?.();}};
function TestUtterance(text){this.text=text;}
const context={BodyPartsCore:require('./core.js'),document:{getElementById:()=>host,activeElement:null},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>fn(),SpeechSynthesisUtterance:TestUtterance,speechSynthesis:synth,console,crypto:require('node:crypto')};
context.window=context;context.addEventListener=()=>{};context.confirm=()=>true;
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
const action=a=>click({target:{closest:()=>({dataset:{action:a}})}});
const choose=id=>click({target:{closest:()=>({dataset:{word:id}})}});
const chooseDetail=id=>click({target:{closest:()=>({dataset:{detailArea:id}})}});
context.BodyParts.open('student-A');action('open-basic');assert.match(host.innerHTML,/Corpo básico/);
action('learn');choose('hair');assert.match(host.innerHTML,/Brush your hair every morning/);action('exit');action('open');
action('practice');
const total=context.BodyPartsCore.words.length*2;
for(let i=0;i<total;i++){
  const targetLabel=host.innerHTML.match(/class="bp-word"[^>]*>([^<]+)/)[1];
  const target=context.BodyPartsCore.words.find(word=>word.en===targetLabel).id;
  if(i===0){choose(target==='eye'?'ear':'eye');choose(target==='eye'?'ear':'eye');assert.match(host.innerHTML,/Esta é a resposta/);}
  choose(target);choose(target);action('next');
}
assert.ok(spoken.length>=total,'Every completed answer should play its pronunciation.');
assert.match(host.innerHTML,/390 \/ 400/);assert.equal(storage.size,1);
action('save');assert.equal(JSON.parse([...storage.values()][0]).length,1);
action('review');assert.match(host.innerHTML,/Tentar sem ajuda/);action('try');
const reviewLabel=host.innerHTML.match(/class="bp-word"[^>]*>([^<]+)/)[1];const reviewTarget=context.BodyPartsCore.words.find(word=>word.en===reviewLabel).id;choose(reviewTarget);action('next');assert.match(host.innerHTML,/Revisão concluída/);
action('home');assert.match(host.innerHTML,/Fase 2/);assert.match(host.innerHTML,/Disponível/);action('open-details');assert.match(host.innerHTML,/Detalhes por região/);action('learn');assert.match(host.innerHTML,/Escolha uma região/);chooseDetail('hands');choose('wrist');assert.match(host.innerHTML,/Rotate your wrists/);action('exit');
context.BodyParts.reset();context.BodyParts.open('student-B');assert.doesNotMatch(host.innerHTML,/Seus recordes/);
context.BodyParts.open('student-A');assert.match(host.innerHTML,/Fase 2/);assert.match(host.innerHTML,/Disponível/);
storage.set('ap_body_parts_v1_student-A','broken');context.BodyParts.open('student-A');assert.match(host.innerHTML,/Bloqueada/);
context.isTeacherPreview=()=>true;context.BodyParts.open('teacher-preview');assert.match(host.innerHTML,/Prévia administrativa/);action('open-details');assert.match(host.innerHTML,/Detalhes por região/);context.isTeacherPreview=()=>false;
synth.voices=[];action('open-basic');action('listen');assert.match(host.innerHTML,/voz em inglês não está disponível/);choose('eye');assert.doesNotMatch(host.innerHTML,/Correct!/);
console.log('PASS: completed session, answer pronunciation, rapid duplicate, assisted answer, review, idempotent save, account isolation, corrupt storage and missing audio.');
