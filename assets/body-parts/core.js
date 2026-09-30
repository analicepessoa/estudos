(function(root){
  'use strict';
  const basicBodyWords = [
    {id:'head',en:'head',pt:'cabeça',example:'My head hurts today.',examplePt:'Minha cabeça dói hoje.',regions:[[518,125,82,108]]},
    {id:'hair',en:'hair',pt:'cabelo',example:'Brush your hair every morning.',examplePt:'Escove o cabelo toda manhã.',regions:[[480,47,58,28]]},
    {id:'eye',en:'eyes',pt:'olhos',example:'Close your eyes for a moment.',examplePt:'Feche os olhos por um instante.',regions:[[482,112,22,8],[545,120,21,8]]},
    {id:'ear',en:'ears',pt:'orelhas / ouvidos',example:'Cover your ears from the noise.',examplePt:'Cubra os ouvidos por causa do barulho.',regions:[[438,144,10,21],[573,161,9,20]]},
    {id:'nose',en:'nose',pt:'nariz',example:'Breathe in through your nose.',examplePt:'Inspire pelo nariz.',regions:[[518,139,15,17]]},
    {id:'mouth',en:'mouth',pt:'boca',example:'Open your mouth wide.',examplePt:'Abra bem a boca.',regions:[[518,169,26,10]]},
    {id:'neck',en:'neck',pt:'pescoço',example:'Turn your neck slowly.',examplePt:'Vire o pescoço devagar.',regions:[[518,250,35,30]]},
    {id:'shoulder',en:'shoulders',pt:'ombros',example:'Relax your shoulders.',examplePt:'Relaxe os ombros.',regions:[[423,284,66,30],[612,284,66,30]]},
    {id:'arm',en:'arms',pt:'braços',example:'Raise your arms.',examplePt:'Levante os braços.',regions:[[363,410,42,112],[674,410,42,112]]},
    {id:'elbow',en:'elbows',pt:'cotovelos',example:'Bend your elbows.',examplePt:'Dobre os cotovelos.',regions:[[338,548,27,27],[698,548,27,27]]},
    {id:'forearm',en:'forearms',pt:'antebraços',example:'Rest your forearms on the table.',examplePt:'Apoie os antebraços na mesa.',regions:[[327,625,34,74],[709,625,34,74]]},
    {id:'hand',en:'hands',pt:'mãos',example:'Wash your hands.',examplePt:'Lave as mãos.',regions:[[315,715,38,48],[721,715,38,48]]},
    {id:'finger',en:'fingers',pt:'dedos da mão',example:'Move your fingers.',examplePt:'Mova os dedos.',regions:[[303,744,29,30],[733,744,29,30]]},
    {id:'chest',en:'chest',pt:'peitoral',example:'Take a deep breath with your chest open.',examplePt:'Respire fundo com o peito aberto.',regions:[[518,382,111,62]]},
    {id:'waist',en:'waist',pt:'cintura',example:'Put your hands on your waist.',examplePt:'Coloque as mãos na cintura.',regions:[[518,620,84,25]]},
    {id:'leg',en:'legs',pt:'pernas',example:'Stretch your legs.',examplePt:'Alongue as pernas.',regions:[[456,1120,58,220],[580,1120,58,220]]},
    {id:'thigh',en:'thighs',pt:'coxas',example:'Your thighs are above your knees.',examplePt:'As coxas ficam acima dos joelhos.',regions:[[456,875,57,105],[580,875,57,105]]},
    {id:'knee',en:'knees',pt:'joelhos',example:'Bend your knees.',examplePt:'Dobre os joelhos.',regions:[[456,1020,46,35],[580,1020,46,35]]},
    {id:'foot',en:'feet (singular: foot)',pt:'pés (pé)',example:'Keep your feet on the floor.',examplePt:'Mantenha os pés no chão.',regions:[[426,1395,70,48],[610,1395,70,48]]},
    {id:'toe',en:'toes',pt:'dedos do pé',example:'Wiggle your toes.',examplePt:'Mexa os dedos do pé.',regions:[[407,1431,36,18],[629,1431,36,18]]}
  ];
  const detailWords = [
    {id:'eyebrow',en:'eyebrows',pt:'sobrancelhas',example:'Raise your eyebrows.',examplePt:'Levante as sobrancelhas.',regions:[[481,94,24,7],[546,101,21,7]]},
    {id:'forehead',en:'forehead',pt:'testa',example:'Wipe the sweat from your forehead.',examplePt:'Limpe o suor da sua testa.',regions:[[519,82,24,9]]},
    {id:'jaw',en:'jaw',pt:'maxilar',example:'Relax your jaw muscles.',examplePt:'Relaxe os músculos do maxilar.',regions:[[474,184,16,12],[562,186,16,12]]},
    {id:'dimple',en:'dimples',pt:'covinhas',example:'He has dimples when he smiles.',examplePt:'Ele tem covinhas quando sorri.',regions:[[482,163,8,7],[555,168,8,7]]},
    {id:'chin',en:'chin',pt:'queixo',example:'Rest your chin on your hand.',examplePt:'Apoie o queixo na mão.',regions:[[520,194,15,7]]},
    {id:'wrist',en:'wrists',pt:'pulsos',example:'Rotate your wrists.',examplePt:'Gire os pulsos.',regions:[[325,683,19,16],[711,683,19,16]]},
    {id:'palm',en:'palms',pt:'palmas das mãos',example:'Open your palms.',examplePt:'Abra as palmas das mãos.',regions:[[315,719,24,28],[721,719,24,28]]},
    {id:'abs',en:'abs',pt:'abdômen definido',example:'His abs are strong.',examplePt:'O abdômen dele é forte.',regions:[[518,500,48,70]]},
    {id:'belly',en:'belly',pt:'barriga',example:'My belly is full.',examplePt:'Minha barriga está cheia.',regions:[[518,560,62,42]]}
  ];
  const chapters={
    'basic-body':{id:'basic-body',phase:1,title:'Corpo básico',short:'corpo inteiro',description:'Explore o personagem inteiro e aprenda o vocabulário básico antes de fazer o teste.',words:basicBodyWords,total:40,passPoints:280},
    'body-details':{id:'body-details',phase:2,title:'Detalhes por região',short:'detalhes',description:'Depois do corpo básico, explore detalhes do rosto, mãos e tronco.',words:detailWords,total:18}
  };
  const words=basicBodyWords;
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
    const isChapterFour=r?.version===4&&((r.chapter==='basic-body'&&r.total===40&&r.points<=400&&r.first<=40)||(r.chapter==='body-details'&&r.total===18&&r.points<=180&&r.first<=18));
    return r && typeof r.id==='string' && ['practice','listen'].includes(r.mode) && ['visual','list'].includes(r.format) && Number.isInteger(r.points) && r.points>=0 && Number.isInteger(r.first) && r.first>=0 && (isOriginal||isExpanded||isChapterThree||isChapterFour);
  }
  const api={words,chapters,rounds,answer,validRecord};
  if(typeof module!=='undefined')module.exports=api;
  else root.BodyPartsCore=api;
})(globalThis);
