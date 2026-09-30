(function(root){
  'use strict';
  const faceWords = [
    {id:'hair',en:'hair',pt:'cabelo',example:'Brush your hair every morning.',examplePt:'Escove o cabelo toda manhã.',regions:[[480,47,58,28]]},
    {id:'eyebrow',en:'eyebrow',pt:'sobrancelha',example:'Raise your eyebrows.',examplePt:'Levante as sobrancelhas.',regions:[[481,94,24,7],[546,101,21,7]]},
    {id:'eye',en:'eye',pt:'olho',example:'Close one eye for a moment.',examplePt:'Feche um olho por um instante.',regions:[[482,112,22,8],[545,120,21,8]]},
    {id:'ear',en:'ear',pt:'orelha',example:'Cover one ear from the noise.',examplePt:'Cubra uma orelha por causa do barulho.',regions:[[438,144,10,21],[573,161,9,20]]},
    {id:'nose',en:'nose',pt:'nariz',example:'Breathe in through your nose.',examplePt:'Inspire pelo nariz.',regions:[[518,139,15,17]]},
    {id:'mouth',en:'mouth',pt:'boca',example:'Open your mouth wide.',examplePt:'Abra bem a boca.',regions:[[518,169,26,10]]},
    {id:'forehead',en:'forehead',pt:'testa',example:'Wipe the sweat from your forehead.',examplePt:'Limpe o suor da sua testa.',regions:[[519,82,24,9]]},
    {id:'jaw',en:'jaw',pt:'maxilar',example:'Relax your jaw muscles.',examplePt:'Relaxe os músculos do maxilar.',regions:[[474,184,16,12],[562,186,16,12]]},
    {id:'dimple',en:'dimple',pt:'covinha',example:'He has a dimple when he smiles.',examplePt:'Ele tem uma covinha quando sorri.',regions:[[482,163,8,7],[555,168,8,7]]},
    {id:'chin',en:'chin',pt:'queixo',example:'Rest your chin on your hand.',examplePt:'Apoie o queixo na mão.',regions:[[520,194,15,7]]}
  ];
  const regionWords = [
    {id:'region-head',en:'head',pt:'cabeça',example:'My head hurts today.',examplePt:'Minha cabeça dói hoje.',regions:[[518,125,82,108]]},
    {id:'region-neck',en:'neck',pt:'pescoço',example:'Turn your neck slowly.',examplePt:'Vire o pescoço devagar.',regions:[[518,250,35,30]]},
    {id:'region-shoulder',en:'shoulders',pt:'ombros',example:'Relax your shoulders.',examplePt:'Relaxe os ombros.',regions:[[423,284,66,30],[612,284,66,30]]},
    {id:'region-torso',en:'torso',pt:'tronco',example:'Keep your torso straight.',examplePt:'Mantenha o tronco reto.',regions:[[518,455,118,168]]},
    {id:'region-arm',en:'arms',pt:'braços',example:'Raise your arms.',examplePt:'Levante os braços.',regions:[[363,458,45,180],[674,458,45,180]]},
    {id:'region-hand',en:'hands',pt:'mãos',example:'Wash your hands.',examplePt:'Lave as mãos.',regions:[[315,715,38,48],[721,715,38,48]]},
    {id:'region-leg',en:'legs',pt:'pernas',example:'Stretch your legs.',examplePt:'Alongue as pernas.',regions:[[456,1005,58,260],[580,1005,58,260]]},
    {id:'region-foot',en:'feet',pt:'pés',example:'Keep your feet on the floor.',examplePt:'Mantenha os pés no chão.',regions:[[426,1395,70,48],[610,1395,70,48]]}
  ];
  const chapters={
    'head-face':{id:'head-face',phase:1,title:'Cabeça e rosto',short:'Rosto',description:'Explore as partes do rosto livremente antes de fazer o teste.',words:faceWords,total:20,passPoints:140},
    'body-regions':{id:'body-regions',phase:2,title:'Regiões do corpo',short:'Regiões',description:'Conheça as grandes regiões do corpo antes de entrar nos detalhes.',words:regionWords,total:16}
  };
  const words=faceWords;
  function rounds(list=words,random=Math.random){
    const result=[];
    for(let group=0;group<2;group++){
      const pool=list.map(w=>w.id);
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
    const isOriginal=r?.version===1&&r.total===12&&r.points<=120&&r.first<=12;
    const isExpanded=r?.version===2&&r.total===20&&r.points<=200&&r.first<=20;
    const isChapterThree=r?.version===3&&((r.chapter==='head-face'&&r.total===20&&r.points<=200&&r.first<=20)||(r.chapter==='body-regions'&&r.total===16&&r.points<=160&&r.first<=16));
    return r && typeof r.id==='string' && ['practice','listen'].includes(r.mode) && ['visual','list'].includes(r.format) && Number.isInteger(r.points) && r.points>=0 && Number.isInteger(r.first) && r.first>=0 && (isOriginal||isExpanded||isChapterThree);
  }
  const api={words,chapters,rounds,answer,validRecord};
  if(typeof module!=='undefined')module.exports=api;
  else root.BodyPartsCore=api;
})(globalThis);
