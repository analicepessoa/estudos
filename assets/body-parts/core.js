(function(root){
  'use strict';
  const words = [
    {id:'hair',en:'hair',pt:'cabelo',regions:[[480,47,58,28]]},
    {id:'eyebrow',en:'eyebrow',pt:'sobrancelha',regions:[[481,94,24,7],[546,101,21,7]]},
    {id:'eye',en:'eye',pt:'olho',regions:[[482,112,22,8],[545,120,21,8]]},
    {id:'ear',en:'ear',pt:'orelha',regions:[[438,144,10,21],[573,161,9,20]]},
    {id:'nose',en:'nose',pt:'nariz',regions:[[518,139,15,17]]},
    {id:'mouth',en:'mouth',pt:'boca',regions:[[518,169,26,10]]}
  ];
  function rounds(random=Math.random){
    const result=[];
    for(let group=0;group<2;group++){
      const pool=words.map(w=>w.id);
      while(pool.length){
        const choices=pool.filter(id=>id!==result[result.length-1]);
        const id=choices[Math.floor(random()*choices.length)];
        result.push(id); pool.splice(pool.indexOf(id),1);
      }
    }
    return result;
  }
  function answer(round,id){
    if(round.done)return round;
    if(id===round.target)return {...round,done:true,points:round.errors===0?10:round.errors===1?5:0};
    return {...round,errors:Math.min(2,round.errors+1)};
  }
  function validRecord(r){
    return r && typeof r.id==='string' && ['practice','listen'].includes(r.mode) && ['visual','list'].includes(r.format) && r.version===1 && Number.isInteger(r.points) && r.points>=0 && r.points<=120 && Number.isInteger(r.first) && r.first>=0 && r.first<=12 && r.total===12;
  }
  const api={words,rounds,answer,validRecord};
  if(typeof module!=='undefined')module.exports=api;
  else root.BodyPartsCore=api;
})(globalThis);
