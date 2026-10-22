const assert=require('node:assert/strict'),test=require('node:test'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const weeks=[1,2,3].map(n=>JSON.parse(fs.readFileSync(path.join(root,`livros/1984/app/week${n}_app_content.json`))));
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'livros/1984/app/dictionary.json')));
test('all reading words have offline meanings and all illustration paths exist',()=>{
 for(const {week:w} of weeks){
  const text=w.chapter_opening.intro+' '+w.story.paragraphs.join(' ')+' '+w.end_of_chapter.join(' ');
  for(const word of text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g))assert.ok(dictionary[word.replace(/’/g,"'")],word);
  for(const asset of [w.chapter_opening.asset,w.story.secondary_illustration.asset])assert.ok(fs.existsSync(path.join(root,'livros/1984/app',asset)),asset);
 }
});
test('all multiple choice, grammar, sequencing and reflection answer keys are consistent',()=>{
 for(const {week:w} of weeks){
  for(const q of w.quick_check)assert.ok((q.options||[true,false]).includes(q.answer));
  for(const group of Object.values(w.language_check)){
   for(const q of group.questions||[]){const options=q.options||q.question.match(/([A-Za-z]+) \/ ([A-Za-z]+)/)?.slice(1);assert.ok(options?.includes(q.answer),q.question);}
   if(group.order_items){assert.deepEqual([...group.answer].sort(),group.order_items.map(i=>i.id).sort());}
  }
  for(const q of [w.orwells_question,w.second_reflection])assert.ok(q.options.includes(q.preferred_answer));
  assert.equal(w.optional_classroom_mission.writing.blocking,false);
 }
});
test('reader and integration scripts parse',()=>{
 new vm.Script(fs.readFileSync(path.join(root,'assets/reading/reader-1984.js'),'utf8'));
 const files=['index.html'];
 if(fs.existsSync(path.join(root,'scratch/release-1984/index.html')))files.push('scratch/release-1984/index.html');
 for(const file of files){
  const html=fs.readFileSync(path.join(root,file),'utf8');assert.ok(html.includes('assets/reading/reader-1984.js?v=133'));
  for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('src=')&&m[2].trim())new vm.Script(m[2]);
 }
});
