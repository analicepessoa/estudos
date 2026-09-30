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
    {id:'forearm',en:'forearms',pt:'antebraços',example:'Rest your forearms on the table.',examplePt:'Apoie os antebraços na mesa.',regions:[[282,655,30,75],[755,655,30,75]]},
    {id:'hand',en:'hands',pt:'mãos',example:'Wash your hands.',examplePt:'Lave as mãos.',regions:[[230,798,42,55],[800,798,42,55]]},
    {id:'finger',en:'fingers',pt:'dedos da mão',example:'Move your fingers.',examplePt:'Mova os dedos.',regions:[[225,848,48,42],[800,848,48,42]]},
    {id:'chest',en:'chest',pt:'peitoral',example:'Take a deep breath with your chest open.',examplePt:'Respire fundo com o peito aberto.',regions:[[518,382,111,62]]},
    {id:'waist',en:'waist',pt:'cintura',example:'Put your hands on your waist.',examplePt:'Coloque as mãos na cintura.',regions:[[518,620,84,25]]},
    {id:'leg',en:'legs',pt:'pernas',example:'Stretch your legs.',examplePt:'Alongue as pernas.',regions:[[456,1120,58,220],[580,1120,58,220]]},
    {id:'thigh',en:'thighs',pt:'coxas',example:'Your thighs are above your knees.',examplePt:'As coxas ficam acima dos joelhos.',regions:[[456,875,57,105],[580,875,57,105]]},
    {id:'knee',en:'knees',pt:'joelhos',example:'Bend your knees.',examplePt:'Dobre os joelhos.',regions:[[456,1020,46,35],[580,1020,46,35]]},
    {id:'foot',en:'feet (singular: foot)',pt:'pés (pé)',example:'Keep your feet on the floor.',examplePt:'Mantenha os pés no chão.',regions:[[426,1395,70,48],[610,1395,70,48]]},
    {id:'toe',en:'toes',pt:'dedos do pé',example:'Wiggle your toes.',examplePt:'Mexa os dedos do pé.',regions:[[365,1462,50,28],[660,1462,50,28]]}
  ];
  const detailAreas={
    head:{id:'head',label:'Cabeça e rosto',hint:'Testa, sobrancelhas, maxilar e queixo.',viewBox:'390 15 260 230',regions:[[518,132,100,112]]},
    hands:{id:'hands',label:'Braços e mãos',hint:'Pulsos, palmas e dedos.',viewBox:'120 500 800 410',regions:[[247,700,80,205],[779,700,80,205]]},
    fingers:{id:'fingers',label:'Dedos da mão',hint:'Thumb, index finger, middle finger, ring finger e pinky.',viewBox:'150 700 740 215',regions:[],primary:false},
    torso:{id:'torso',label:'Tronco',hint:'Bíceps, abs, umbigo, quadril e mamilos.',viewBox:'330 285 375 390',regions:[[518,480,145,188]]},
    lower:{id:'lower',label:'Parte inferior',hint:'Panturrilhas, tornozelos e calcanhares.',viewBox:'285 760 465 735',regions:[[456,1110,75,315],[580,1110,75,315]]}
  };
  const detailWords = [
    {id:'eyebrow',area:'head',en:'eyebrows',pt:'sobrancelhas',example:'Raise your eyebrows.',examplePt:'Levante as sobrancelhas.',regions:[[481,94,24,7],[546,101,21,7]]},
    {id:'forehead',area:'head',en:'forehead',pt:'testa',example:'Wipe the sweat from your forehead.',examplePt:'Limpe o suor da sua testa.',regions:[[519,82,24,9]]},
    {id:'jaw',area:'head',en:'jaw',pt:'maxilar',example:'Relax your jaw muscles.',examplePt:'Relaxe os músculos do maxilar.',regions:[[474,184,16,12],[562,186,16,12]]},
    {id:'dimple',area:'head',en:'dimples',pt:'covinhas',example:'He has dimples when he smiles.',examplePt:'Ele tem covinhas quando sorri.',regions:[[482,163,8,7],[555,168,8,7]]},
    {id:'chin',area:'head',en:'chin',pt:'queixo',example:'Rest your chin on your hand.',examplePt:'Apoie o queixo na mão.',regions:[[520,194,15,7]]},
    {id:'lip',area:'head',en:'lips',pt:'lábios',example:'Her lips are dry today.',examplePt:'Os lábios dela estão secos hoje.',regions:[[518,169,27,10]]},
    {id:'eyelash',area:'head',en:'eyelashes',pt:'cílios',example:'She has long eyelashes.',examplePt:'Ela tem cílios longos.',regions:[[482,111,24,8],[545,119,23,8]]},
    {id:'bicep',area:'torso',en:'biceps',pt:'bíceps',example:'He trains his biceps at the gym.',examplePt:'Ele treina os bíceps na academia.',regions:[[372,392,35,53],[666,392,35,53]]},
    {id:'wrist',area:'hands',en:'wrists',pt:'pulsos',example:'Rotate your wrists.',examplePt:'Gire os pulsos.',regions:[[253,720,22,18],[777,720,22,18]]},
    {id:'palm',area:'hands',en:'palms',pt:'palmas das mãos',example:'Open your palms.',examplePt:'Abra as palmas das mãos.',regions:[[228,796,29,34],[802,796,29,34]]},
    {id:'thumb',area:'fingers',en:'thumbs',pt:'polegares',example:'Raise your thumbs.',examplePt:'Levante os polegares.',regions:[[198,812,16,28],[836,812,16,28]]},
    {id:'index-finger',area:'fingers',en:'index fingers',pt:'dedos indicadores',example:'Point with your index finger.',examplePt:'Aponte com o dedo indicador.',regions:[[216,842,12,27],[820,842,12,27]]},
    {id:'middle-finger',area:'fingers',en:'middle fingers',pt:'dedos médios',example:'The middle finger is the longest finger.',examplePt:'O dedo médio é o dedo mais longo.',regions:[[229,856,12,28],[807,856,12,28]]},
    {id:'ring-finger',area:'fingers',en:'ring fingers',pt:'dedos anelares',example:'A ring goes on the ring finger.',examplePt:'Um anel vai no dedo anelar.',regions:[[242,866,11,26],[794,866,11,26]]},
    {id:'pinky',area:'fingers',en:'pinkies',pt:'dedos mindinhos',example:'My pinky is small.',examplePt:'Meu dedo mindinho é pequeno.',regions:[[253,856,10,23],[783,856,10,23]]},
    {id:'abs',area:'torso',en:'abs',say:'abdominal muscles',pt:'abdômen definido',example:'His abs are strong.',examplePt:'O abdômen dele é forte.',regions:[[518,500,48,70]]},
    {id:'belly',area:'torso',en:'belly',pt:'barriga',example:'My belly is full.',examplePt:'Minha barriga está cheia.',regions:[[518,560,62,42]]},
    {id:'navel',area:'torso',en:'navel',pt:'umbigo',example:'His navel is in the center of his belly.',examplePt:'O umbigo dele fica no centro da barriga.',regions:[[518,590,13,13]]},
    {id:'hip',area:'torso',en:'hips',pt:'quadris',example:'Put your hands on your hips.',examplePt:'Coloque as mãos nos quadris.',regions:[[430,615,42,28],[605,615,42,28]]},
    {id:'nipple',area:'torso',en:'nipples',pt:'mamilos',example:'The chest has two nipples.',examplePt:'O peitoral tem dois mamilos.',regions:[[427,430,14,14],[604,430,14,14]]},
    {id:'calf',area:'lower',en:'calves',pt:'panturrilhas',example:'My calves are tired after running.',examplePt:'Minhas panturrilhas estão cansadas depois de correr.',regions:[[456,1170,42,105],[580,1170,42,105]]},
    {id:'ankle',area:'lower',en:'ankles',pt:'tornozelos',example:'Move your ankles slowly.',examplePt:'Mova os tornozelos devagar.',regions:[[433,1325,30,28],[603,1325,30,28]]},
    {id:'heel',area:'lower',en:'heels',pt:'calcanhares',example:'My heels hurt in these shoes.',examplePt:'Meus calcanhares doem com estes sapatos.',regions:[[402,1400,31,28],[633,1400,31,28]]}
  ];
  const chapters={
    'basic-body':{id:'basic-body',phase:1,title:'Corpo básico',short:'corpo inteiro',description:'Explore o personagem inteiro e faça um teste curto com perguntas sorteadas.',words:basicBodyWords,total:12,passPoints:90},
    'body-details':{id:'body-details',phase:2,title:'Detalhes por região',short:'detalhes',description:'Toque primeiro em uma grande região do corpo para ampliar e pratique com perguntas sorteadas.',words:detailWords,total:12,passPoints:90}
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
    const isChapterFive=r?.version===5&&((r.chapter==='basic-body'&&r.total===40&&r.points<=400&&r.first<=40)||(r.chapter==='body-details'&&r.total===26&&r.points<=260&&r.first<=26));
    const isChapterSix=r?.version===6&&((r.chapter==='basic-body'&&r.total===40&&r.points<=400&&r.first<=40)||(r.chapter==='body-details'&&r.total===46&&r.points<=460&&r.first<=46));
    const isChapterSeven=r?.version===7&&((r.chapter==='basic-body'||r.chapter==='body-details')&&r.total===12&&r.points<=120&&r.first<=12);
    return r && typeof r.id==='string' && ['practice','listen'].includes(r.mode) && ['visual','list'].includes(r.format) && Number.isInteger(r.points) && r.points>=0 && Number.isInteger(r.first) && r.first>=0 && (isOriginal||isExpanded||isChapterThree||isChapterFour||isChapterFive||isChapterSix||isChapterSeven);
  }
  const api={words,chapters,detailAreas,rounds,answer,validRecord};
  if(typeof module!=='undefined')module.exports=api;
  else root.BodyPartsCore=api;
})(globalThis);
