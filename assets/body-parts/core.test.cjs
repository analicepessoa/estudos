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
console.log('PASS: 2000 decks, scoring, assisted answers, duplicate answers and record validation.');
