const assert=require('node:assert/strict');
const {words,rounds,answer,validRecord}=require('./core.js');
for(let n=0;n<2000;n++){
  const deck=rounds();assert.equal(deck.length,words.length*2);
  for(const w of words)assert.equal(deck.filter(x=>x===w.id).length,2);
  assert.ok(deck.every((id,i)=>!i||id!==deck[i-1]));
}
for(const errors of [0,1,2]){
  const result=answer({target:'eye',errors,done:false},'eye');
  assert.equal(result.points,[10,5,0][errors]);
  assert.deepEqual(answer(result,'ear'),result);
}
let r={target:'eye',errors:0,done:false};
r=answer(r,'ear');r=answer(r,'ear');r=answer(r,'ear');assert.equal(r.errors,2);
assert.equal(answer(r,'eye').points,0);
assert.equal(validRecord({id:'a',mode:'practice',format:'visual',version:1,points:125,first:12,total:12}),false);
assert.equal(validRecord({id:'a',mode:'practice',format:'visual',version:1,points:120,first:12,total:12}),true);
assert.equal(validRecord({id:'b',mode:'listen',format:'list',version:2,points:200,first:20,total:20}),true);
assert.equal(validRecord({id:'b',mode:'listen',format:'list',version:2,points:200,first:20,total:12}),false);
assert.equal(validRecord({id:'c',chapter:'body-regions',mode:'practice',format:'visual',version:3,points:160,first:16,total:16}),true);
assert.equal(validRecord({id:'c',chapter:'body-regions',mode:'practice',format:'visual',version:3,points:170,first:16,total:16}),false);
assert.equal(validRecord({id:'d',chapter:'basic-body',mode:'practice',format:'visual',version:4,points:400,first:40,total:40}),true);
assert.equal(validRecord({id:'d',chapter:'basic-body',mode:'practice',format:'visual',version:4,points:410,first:40,total:40}),false);
assert.equal(validRecord({id:'e',chapter:'body-details',mode:'practice',format:'visual',version:5,points:260,first:26,total:26}),true);
assert.equal(validRecord({id:'e',chapter:'body-details',mode:'practice',format:'visual',version:5,points:270,first:26,total:26}),false);
assert.equal(validRecord({id:'f',chapter:'body-details',mode:'practice',format:'visual',version:6,points:460,first:46,total:46}),true);
assert.equal(validRecord({id:'f',chapter:'body-details',mode:'practice',format:'visual',version:6,points:470,first:46,total:46}),false);
assert.equal(validRecord({id:'g',chapter:'basic-body',mode:'practice',format:'visual',version:7,points:90,first:9,total:12}),true);
assert.equal(validRecord({id:'g',chapter:'basic-body',mode:'practice',format:'visual',version:7,points:130,first:12,total:12}),false);
const {organChallengeRounds,organFunctionQuestions,organFunctionRounds,organWords}=require('./core.js');
const organDeck=organChallengeRounds();
assert.equal(organDeck.length,16);
assert.equal(organDeck.filter(r=>r.type==='text').length,8);
assert.equal(organDeck.filter(r=>r.type==='listen').length,8);
for(const w of organWords){
  assert.equal(organDeck.filter(r=>r.target===w.id&&r.type==='text').length,1);
  assert.equal(organDeck.filter(r=>r.target===w.id&&r.type==='listen').length,1);
}
const funcDeck=organFunctionRounds();
assert.equal(funcDeck.length,8);
for(const w of organWords){
  assert.equal(funcDeck.filter(r=>r.target===w.id).length,1);
  assert.equal(organFunctionQuestions[w.id],funcDeck.find(r=>r.target===w.id).question);
}
const {calculatePhase3Stars,phase3PerformanceMessage}=require('./core.js');
assert.equal(calculatePhase3Stars(24), 3);
assert.equal(calculatePhase3Stars(22), 3);
assert.equal(calculatePhase3Stars(21), 2);
assert.equal(calculatePhase3Stars(18), 2);
assert.equal(calculatePhase3Stars(17), 1);
assert.equal(calculatePhase3Stars(12), 1);
assert.equal(calculatePhase3Stars(11), 0);
assert.equal(calculatePhase3Stars(0), 0);
assert.equal(calculatePhase3Stars(-5), 0);
assert.equal(calculatePhase3Stars(30), 3);
assert.equal(phase3PerformanceMessage(3), 'Amazing! You really know the human body!');
assert.equal(phase3PerformanceMessage(2), "Great job! You're getting really good at this!");
assert.equal(phase3PerformanceMessage(1), 'Good job! Keep practicing!');
assert.equal(phase3PerformanceMessage(0), "Keep practicing! You'll get better!");

console.log('PASS: 2000 decks, scoring, assisted answers, duplicate answers, record validation, organ challenge/function rounds, phase 3 stars and messages.');
