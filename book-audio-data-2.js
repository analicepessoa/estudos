// Catálogo de áudios do Livro 2, organizado por nível, unidade e lição.
const BOOK2_AUDIO_CATALOG = [
  {
    id:"book2_intermediate01_01", level:"intermediate01", order:1, unit:"1", lesson:"1", page:"13",
    title:"Pronúncia dos verbos regulares no passado", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/1 - pag 13 - Intermediate 1_Unit 1_Lesson 01.mp3", duration:48.51,
    transcript:`The game ended with no winner. He failed his driving exam. We laughed uncontrollably. My brother lived in London. My grandmother passed away last year. John started college two years ago. Susan stopped smoking. We tried our best. I used to practice sports. They wanted to talk to you. I watched lots of movies on my vacation. I worked for this activity.`,
    vocab:[["winner","vencedor"],["driving exam","exame de direção"],["pass away","falecer"],["used to","costumava"],["try our best","dar o nosso melhor"]],
    expressions:[["The game ended with no winner.","O jogo terminou sem vencedor.","Passado simples"],["We tried our best.","Nós demos o nosso melhor.","Esforço"]]
  },
  {
    id:"book2_intermediate01_02", level:"intermediate01", order:2, unit:"1", lesson:"2", page:"",
    title:"Uma manhã cheia de imprevistos", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 1_Lesson 2.mp3", duration:51.06,
    transcript:`Michael? Hi, Megan. Oh, what's wrong? You really don't sound well. Yeah, the day didn't start very well, you see. Oh, what happened? You know, today I woke up late and I didn't have breakfast. I ran to the bus stop, but I didn't catch the bus on time. Wow, tough morning, huh? Yeah, and when I arrived here, I remembered I didn't bring the reports we worked on the whole weekend. That's why I called you. Well, I have a copy here with me. Do you want me to take it to you? Oh, yes, please. Okay, I'll be in your room in a minute.`,
    vocab:[["wake up late","acordar tarde"],["bus stop","ponto de ônibus"],["catch the bus","pegar o ônibus"],["on time","no horário"],["tough morning","manhã difícil"],["report","relatório"]],
    expressions:[["What's wrong?","O que aconteceu?","Perguntar sobre um problema"],["That's why I called you.","Foi por isso que liguei para você.","Explicar uma razão"],["I'll be there in a minute.","Estarei aí em um minuto.","Promessa imediata"]]
  },
  {
    id:"book2_intermediate01_03", level:"intermediate01", order:3, unit:"1", lesson:"3", page:"",
    title:"Entrevista de emprego — formação", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 1_Lesson 3_Dialogue 1.mp3", duration:20.43,
    transcript:`Welcome to our office, Mrs. Allen. Thank you, Mr. Johnson. It's my pleasure. Would you like anything? Maybe a cup of coffee? I'm fine. We can start anytime you want. All right. First question is: where did you study?`,
    vocab:[["office","escritório"],["pleasure","prazer"],["anytime","a qualquer momento"],["first question","primeira pergunta"]],
    expressions:[["It's my pleasure.","O prazer é meu.","Cortesia formal"],["Would you like anything?","Você gostaria de alguma coisa?","Oferta educada"],["We can start anytime.","Podemos começar a qualquer momento.","Disponibilidade"]]
  },
  {
    id:"book2_intermediate01_04", level:"intermediate01", order:4, unit:"1", lesson:"3", page:"",
    title:"Entrevista de emprego — experiência", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 1_Lesson 3_Dialogue 2.mp3", duration:22.98,
    transcript:`Very interesting. I've always wanted to study in that institution. It was hard, but I fulfilled that dream. I really admire that. Now tell me, do you have any previous experience? Certainly, sir. In my last job, I worked for CSS Offices. What did you do there?`,
    vocab:[["institution","instituição"],["fulfill a dream","realizar um sonho"],["previous experience","experiência anterior"],["last job","emprego anterior"]],
    expressions:[["I've always wanted to...","Eu sempre quis...","Desejo de longa duração"],["I fulfilled that dream.","Eu realizei esse sonho.","Conquista"],["What did you do there?","O que você fazia lá?","Experiência profissional"]]
  },
  {
    id:"book2_intermediate01_05", level:"intermediate01", order:5, unit:"1", lesson:"3", page:"",
    title:"Entrevista de emprego — desligamento", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 1_Lesson 3_Dialogue 3.mp3", duration:17.87,
    transcript:`You have what we are looking for, Mrs. Allen. That's good. Thank you. I really hope we can work together. I just have one question about your previous job. As you wish. Why did you leave?`,
    vocab:[["look for","procurar"],["work together","trabalhar juntos"],["previous job","emprego anterior"],["leave a job","deixar um emprego"]],
    expressions:[["You have what we are looking for.","Você tem o que estamos procurando.","Avaliação profissional"],["I hope we can work together.","Espero que possamos trabalhar juntos.","Expectativa"],["Why did you leave?","Por que você saiu?","Pergunta no passado"]]
  },
  {
    id:"book2_intermediate01_06", level:"intermediate01", order:6, unit:"2", lesson:"5", page:"",
    title:"Conselho sobre um animal perigoso", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 2_Lesson 5.mp3", duration:58.72,
    transcript:`Welcome to another edition of Agony Aunt. Today I have a letter here from Agnes Jones, and she has quite a serious problem. She says she loves pets, but her neighbor got a snake recently and the snake frequently escapes from its cage. She has found this snake many times in her house, especially in the corridors and on the floor. Well, here's my advice, Agnes: people should not put other people in danger. I think it's dangerous to have a snake around, so you ought to talk to your neighbor. This is a situation you could bring to the condo meetings. There, you could establish an exotic animal room. That's it! We'll be back soon. Don't change channels!`,
    vocab:[["neighbor","vizinho"],["snake","cobra"],["escape from its cage","escapar da gaiola"],["put someone in danger","colocar alguém em perigo"],["advice","conselho"],["condo meeting","reunião de condomínio"]],
    expressions:[["Here's my advice.","Aqui está meu conselho.","Dar conselho"],["You ought to talk to your neighbor.","Você deveria conversar com seu vizinho.","Recomendação"],["Don't change channels!","Não mude de canal!","Programa de rádio/TV"]]
  },
  {
    id:"book2_intermediate01_07", level:"intermediate01", order:7, unit:"2", lesson:"6", page:"",
    title:"Segredos para um bom churrasco", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 2_Lesson 6.mp3", duration:45.96,
    transcript:`You know, my family's specialty is barbecue. Whenever we get together, there's barbecue and I'm always the one responsible for the grill. I'll tell you some secrets to prepare the perfect meat. First, you need to marinate it. After that, you have to pay attention to the embers. You must use high-quality coal to have good embers. You need to fire up the grill carefully and don't get burned, please. You mustn't forget any vegetarian friends. For them, I prepare some skewers and they usually love them. With these tips, your barbecue will be perfect, trust me.`,
    vocab:[["barbecue","churrasco"],["grill","churrasqueira"],["marinate","marinar"],["embers","brasas"],["coal","carvão"],["skewer","espetinho"]],
    expressions:[["You have to pay attention.","Você precisa prestar atenção.","Obrigação"],["You mustn't forget.","Você não pode esquecer.","Alerta"],["Trust me.","Confie em mim.","Garantia informal"]]
  },
  {
    id:"book2_intermediate01_08", level:"intermediate01", order:8, unit:"Revisão 1", lesson:"Unidades 1 e 2", page:"",
    title:"Reencontro e convite para um churrasco", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 2.1_Review  Units 1_2.mp3", duration:35.74,
    transcript:`I loved last night at Edward's. Oh, me too. The best part was when they opened the dance floor. Yeah, exactly. I danced a lot. You know, I missed Edward. I'm glad he came back to the neighborhood. Yeah, he visited me some weeks ago and said he was coming back. By the way, he invited us for a barbecue at his house next weekend. Are you going? Oh, yeah, of course.`,
    vocab:[["dance floor","pista de dança"],["miss someone","sentir falta de alguém"],["neighborhood","bairro"],["come back","voltar"],["by the way","a propósito"],["invite","convidar"]],
    expressions:[["The best part was...","A melhor parte foi...","Relatar experiência"],["I'm glad he came back.","Fico feliz que ele voltou.","Satisfação"],["Are you going?","Você vai?","Perguntar sobre plano"]]
  },
  {
    id:"book2_intermediate01_09", level:"intermediate01", order:9, unit:"3", lesson:"9", page:"",
    title:"Planos de viagem que mudaram", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 9.mp3", duration:68.94,
    transcript:`Hello, Amanda. How are you? Hi, Jennifer. I'm fine, and you? I'm fine too. Listen, Peter's just called and told me about our weekend trip. We're taking the executive bus at 6 a.m. and we're making two stops on the road. Jennifer, I have also planned the activities we're doing. We're visiting some art galleries, museums and theaters. The prices are quite reasonable. Jennifer. Oh, the hotel. We're staying at a hotel downtown, near all the attractions we want to visit. You and Edward are staying in a room right next to ours. Jennifer, listen, please. Sure. Are you as excited as I am? I was, but unfortunately Edward and I aren't going on this trip with you and Peter. What? Yeah, I'm sorry. Edward received a call from his boss yesterday and now he's working the whole weekend. He really couldn't change that. We'll have to leave it for another time. Oh, my. How unfortunate. But that's okay. I'll talk to Peter and see what we can do.`,
    vocab:[["weekend trip","viagem de fim de semana"],["executive bus","ônibus executivo"],["art gallery","galeria de arte"],["reasonable price","preço razoável"],["downtown","centro da cidade"],["attraction","atração"]],
    expressions:[["We're taking the bus.","Nós vamos de ônibus.","Plano futuro"],["Are you as excited as I am?","Você está tão animada quanto eu?","Comparação"],["We'll leave it for another time.","Deixaremos para outra ocasião.","Adiar plano"]]
  },
  {
    id:"book2_intermediate01_10", level:"intermediate01", order:10, unit:"3", lesson:"10", page:"",
    title:"Preparativos para uma festa", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 10.mp3", duration:48.51,
    transcript:`Anthony, will you come to my get-together this weekend? I'm sorry, but I definitely won't. What? I'm kidding, man. Of course I will. Jerk, you got me! How about the preparations? Well, everything is okay so far. On Friday, I'll buy the food and drinks. The DJ will arrive early. What time do I have to be there? I'll wait for you by 4 p.m. Janice will leave work a little later this weekend, so we'll be there at about 6. Is that okay? Yeah, she told me she'll work overtime this weekend. Great. I can wait. Thanks, dude. See ya.`,
    vocab:[["get-together","encontro informal"],["kid someone","brincar com alguém"],["preparations","preparativos"],["so far","até agora"],["work overtime","fazer hora extra"]],
    expressions:[["You got me!","Você me pegou!","Brincadeira"],["Everything is okay so far.","Está tudo bem até agora.","Situação atual"],["What time do I have to be there?","A que horas preciso estar lá?","Perguntar horário"]]
  },
  {
    id:"book2_intermediate01_11", level:"intermediate01", order:11, unit:"3", lesson:"11", page:"",
    title:"Pedido de demissão e novo negócio", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 11_Passage 1.mp3", duration:17.87,
    transcript:`Take a look at this, Chris. What is it? My resignation letter. Why? Why are you leaving? I'm leaving because I'm going to open my own company. Really? I'm happy for you, then. I hope only the best for you.`,
    vocab:[["take a look","dar uma olhada"],["resignation letter","carta de demissão"],["leave","sair"],["open a company","abrir uma empresa"]],
    expressions:[["Why are you leaving?","Por que você está saindo?","Perguntar motivo"],["I'm going to open my own company.","Vou abrir minha própria empresa.","Plano"],["I'm happy for you.","Fico feliz por você.","Boa notícia"]]
  },
  {
    id:"book2_intermediate01_12", level:"intermediate01", order:12, unit:"3", lesson:"11", page:"",
    title:"Previsão de uma promoção", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 11_Passage 2.mp3", duration:30.64,
    transcript:`I can see something. What? It's not clear. I don't know exactly what it is. Please, please try. Oh, it's clear now. Your future is bright. Seriously? Yes, it's certain. You will get a wonderful promotion.`,
    vocab:[["clear","claro"],["exactly","exatamente"],["future","futuro"],["bright","promissor"],["promotion","promoção"]],
    expressions:[["I don't know exactly.","Eu não sei exatamente.","Incerteza"],["Your future is bright.","Seu futuro é promissor.","Previsão positiva"],["You will get a promotion.","Você receberá uma promoção.","Futuro com will"]]
  },
  {
    id:"book2_intermediate01_13", level:"intermediate01", order:13, unit:"3", lesson:"11", page:"",
    title:"Previsão do tempo", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 11_Passage 3.mp3", duration:17.87,
    transcript:`Now, the forecast. The temperatures have been rising in the last few days and the maximum continues to rise. We have clear skies and some warm breeze, especially near the coast. Tomorrow is going to be a sunny and hot day.`,
    vocab:[["forecast","previsão do tempo"],["temperature","temperatura"],["rise","subir"],["clear skies","céu limpo"],["warm breeze","brisa morna"],["coast","litoral"]],
    expressions:[["Temperatures have been rising.","As temperaturas vêm subindo.","Tendência recente"],["Tomorrow is going to be sunny.","Amanhã será ensolarado.","Previsão"]]
  },
  {
    id:"book2_intermediate01_14", level:"intermediate01", order:14, unit:"3", lesson:"12", page:"",
    title:"Possibilidade de faltar à festa", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 12_Situation 1.mp3", duration:12.77,
    transcript:`We will go to Megan's party. Well, I might not go. I have to study for college.`,
    vocab:[["party","festa"],["might not","talvez não"],["have to","ter que"],["college","faculdade"]],
    expressions:[["I might not go.","Talvez eu não vá.","Possibilidade"],["I have to study.","Eu tenho que estudar.","Obrigação"]]
  },
  {
    id:"book2_intermediate01_15", level:"intermediate01", order:15, unit:"3", lesson:"12", page:"",
    title:"Possibilidade de promoção", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 12_Situation 2.mp3", duration:10.21,
    transcript:`Why are you so happy? I may get the promotion very soon.`,
    vocab:[["happy","feliz"],["may","talvez"],["get a promotion","receber uma promoção"],["very soon","muito em breve"]],
    expressions:[["Why are you so happy?","Por que você está tão feliz?","Perguntar motivo"],["I may get the promotion.","Talvez eu receba a promoção.","Possibilidade"]]
  },
  {
    id:"book2_intermediate01_16", level:"intermediate01", order:16, unit:"3", lesson:"12", page:"",
    title:"Possível viagem pela Europa", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 12_Situation 3.mp3", duration:12.77,
    transcript:`Have you decided where you're going on your vacation? I might travel around Europe. I don't know yet.`,
    vocab:[["decide","decidir"],["vacation","férias"],["travel around","viajar por"],["Europe","Europa"],["yet","ainda"]],
    expressions:[["Have you decided...?","Você já decidiu...?","Present Perfect"],["I don't know yet.","Eu ainda não sei.","Decisão pendente"]]
  },
  {
    id:"book2_intermediate01_17", level:"intermediate01", order:17, unit:"3", lesson:"12", page:"",
    title:"Horário de chegada do voo", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 3_Lesson 12_Situation 4.mp3", duration:10.21,
    transcript:`When will Barry arrive? His plane lands at five. He'll soon be here.`,
    vocab:[["arrive","chegar"],["plane","avião"],["land","pousar"],["soon","em breve"]],
    expressions:[["When will he arrive?","Quando ele chegará?","Pergunta futura"],["His plane lands at five.","O avião dele pousa às cinco.","Horário programado"]]
  },
  {
    id:"book2_intermediate01_18", level:"intermediate01", order:18, unit:"4", lesson:"15", page:"",
    title:"Orientações para a prova de software", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 4_Lesson 15.mp3", duration:58.72,
    transcript:`All right, everybody. Good evening. If you open your books to page 55, you will find today's lesson. Well, this lesson is very important and you will have to talk about it at the midterm exam. If you don't pay attention to it, you won't pass the test, I'm sure. Now, this software in the picture is one of the most used editing programs on the market. If you know how to use it well, you will have a guaranteed position. That's certain. Mr. Banks? Yes? Will we have the chance to use the software before the exam? Well, right now we will only check the theory, but if you want, I will give you a week or two of practice. Yes, sir. That would be awesome. All right. Now, let's start with the whole thing regarding the...`,
    vocab:[["midterm exam","prova do meio do curso"],["pay attention","prestar atenção"],["pass the test","passar na prova"],["editing software","programa de edição"],["theory","teoria"],["practice","prática"]],
    expressions:[["If you don't pay attention, you won't pass.","Se você não prestar atenção, não passará.","Primeira condicional"],["Will we have the chance...?","Teremos a oportunidade...?","Pergunta educada"],["That would be awesome.","Isso seria incrível.","Reação positiva"]]
  },
  {
    id:"book2_intermediate01_19", level:"intermediate01", order:19, unit:"Revisão 2", lesson:"Unidades 3 e 4", page:"",
    title:"Notícia sobre uma falsa denúncia", file:"Audios One World/LIVRO 02/INTERMEDIATE 01/Intermediate 1_Unit 4.1_Review Units 3_4.mp3", duration:43.4,
    transcript:`Olympic swimmer Ryan Lochte loses all his major sponsors after the Rio incident. The athlete alleged he had been robbed at gunpoint in Rio. However, investigators discovered that Lochte and his friends had actually vandalized a gas station's bathroom after leaving a party in Barra, one of the wealthiest neighborhoods in Rio. The security guard pointed a gun in order to stop the athletes from escaping the place. The athletes paid for the vandalism and were released. That's what we say: lies are never worth it. Besides that, they can really cost you money.`,
    vocab:[["sponsor","patrocinador"],["allege","alegar"],["at gunpoint","sob ameaça de arma"],["vandalize","depredar"],["security guard","segurança"],["be released","ser liberado"]],
    expressions:[["He alleged he had been robbed.","Ele alegou que havia sido roubado.","Discurso indireto"],["Lies are never worth it.","Mentiras nunca valem a pena.","Consequência"]]
  },
  {
    id:"book2_intermediate02_01", level:"intermediate02", order:1, unit:"1", lesson:"2", page:"",
    title:"Planos de mudar para uma casa maior", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 1_Lesson 2.mp3", duration:28.16,
    transcript:`Honey, can we talk? Sure, dear. What's the matter? Hmm, I have been thinking about moving to another house. Moving to another house? Why? Well, we've been planning to have kids and this house is not big enough for a family. Oh, I have to agree with that, but you know we have been having financial problems, don't you? We cannot afford an expensive house.`,
    vocab:[["move to another house","mudar para outra casa"],["plan to have kids","planejar ter filhos"],["big enough","grande o bastante"],["financial problems","problemas financeiros"],["afford","ter condições de pagar"]],
    expressions:[["What's the matter?","Qual é o problema?","Iniciar conversa"],["I've been thinking about...","Tenho pensado em...","Ação contínua"],["We cannot afford it.","Não temos condições de pagar.","Limitação financeira"]]
  },
  {
    id:"book2_intermediate02_02", level:"intermediate02", order:2, unit:"1", lesson:"3", page:"",
    title:"Notícia sobre vazamento de dados", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 1_Lesson 3.mp3", duration:40.91,
    transcript:`Yahoo has published a note saying that hackers stole data from 500 million users in 2014. In a statement, Yahoo said that critical and relevant user data, such as names, email addresses, telephone numbers, birth dates and encrypted passwords, were compromised in 2014. Yahoo did not name the country involved. On social networks, users are complaining about their personal information's safety because the announcement happened only years after the attack. And in Silicon Valley, the...`,
    vocab:[["hacker","hacker / invasor"],["steal data","roubar dados"],["statement","comunicado"],["encrypted password","senha criptografada"],["compromised","comprometido"],["safety","segurança"]],
    expressions:[["The company published a statement.","A empresa publicou um comunicado.","Linguagem jornalística"],["Data were compromised.","Os dados foram comprometidos.","Voz passiva"],["Users are complaining about...","Os usuários estão reclamando de...","Ação em andamento"]]
  },
  {
    id:"book2_intermediate02_03", level:"intermediate02", order:3, unit:"1", lesson:"4", page:"",
    title:"Notícia sobre a turnê de Beyoncé", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 1_Lesson 4.mp3", duration:53.68,
    transcript:`Beyoncé's most recent tour has earned 210 million dollars so far for the singer, according to Billboard. After a brief hiatus, the Formation World Tour restarted concerts on September 7th in New Jersey. The singer has been promoting her new album, Lemonade, all over North America and Europe for the past months. As soon as sales open, tickets to the diva's show have been selling fast and are almost sold out right now. This puts Beyoncé as one of the most requested entertainers of the decade. The singer has launched six albums as a solo artist. Beyoncé has been negotiating new dates for concerts in other places around the globe, like Asia and Latin America. And we have more news on Entertainment Tonight. Hollywood actress...`,
    vocab:[["tour","turnê"],["earn","arrecadar"],["brief hiatus","breve pausa"],["promote an album","divulgar um álbum"],["sold out","esgotado"],["around the globe","ao redor do mundo"]],
    expressions:[["so far","até agora","Período em andamento"],["Tickets have been selling fast.","Os ingressos vêm vendendo rapidamente.","Present Perfect Continuous"],["As soon as sales open...","Assim que as vendas começam...","Conector temporal"]]
  },
  {
    id:"book2_intermediate02_04", level:"intermediate02", order:4, unit:"2", lesson:"6", page:"",
    title:"Opiniões sobre alimentos industrializados", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 2_Lesson 6.mp3", duration:48.59,
    transcript:`We interviewed people on the street to know whether industrialized food should be prohibited or not. And here's what we got. Should industrialized food be prohibited? Of course. I mean, we all know how bad these things are for our health. Should we go back to consuming only organic food? I don't think that's a good idea. Why? There are thousands of people working in this industry, and prohibiting it would cause a major employment crisis, you know? It's not a good idea. I don't agree. People must have their right to choose and to be respected. Well, if I want to consume industrialized food, I should be allowed to do that. This idea is sort of unacceptable. That's what I think. And you? What's your opinion?`,
    vocab:[["industrialized food","alimento industrializado"],["prohibit","proibir"],["organic food","alimento orgânico"],["employment crisis","crise de emprego"],["right to choose","direito de escolher"],["unacceptable","inaceitável"]],
    expressions:[["I don't think that's a good idea.","Não acho que seja uma boa ideia.","Discordar"],["People should be allowed to...","As pessoas deveriam ter permissão para...","Direito"],["What's your opinion?","Qual é a sua opinião?","Pedir opinião"]]
  },
  {
    id:"book2_intermediate02_05", level:"intermediate02", order:5, unit:"3", lesson:"10", page:"",
    title:"Pedido de desculpas entre amigos", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 3_Lesson 10_Dialogue 1.mp3", duration:23.04,
    transcript:`Can I talk to you for a moment, please? Hmm, okay, say it. Listen, I'd like to apologize for my behavior the other day. I was under a lot of stress, you know. Well, I was really hurt, Matthew, but you're my friend and I really like you. Forget about it, okay?`,
    vocab:[["for a moment","por um momento"],["apologize","pedir desculpas"],["behavior","comportamento"],["the other day","outro dia"],["under stress","sob estresse"],["hurt","magoado"]],
    expressions:[["I'd like to apologize.","Eu gostaria de pedir desculpas.","Pedido de desculpas"],["I was under a lot of stress.","Eu estava sob muito estresse.","Justificativa"],["Forget about it.","Esqueça isso.","Aceitar desculpas"]]
  },
  {
    id:"book2_intermediate02_06", level:"intermediate02", order:6, unit:"3", lesson:"10", page:"",
    title:"Apoio a uma amiga doente", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 3_Lesson 10_Dialogue 2.mp3", duration:23.04,
    transcript:`Hey, Kate. How are you now? Oh, I'm feeling a lot better. Thanks for asking. Good. I called your mom and she told me you're kind of ill. Yeah, I was. If you need anything, please give me a call. Thanks for being there for me. Anytime.`,
    vocab:[["feel better","sentir-se melhor"],["thanks for asking","obrigado por perguntar"],["kind of ill","meio doente"],["give me a call","ligue para mim"]],
    expressions:[["How are you now?","Como você está agora?","Recuperação"],["Thanks for being there for me.","Obrigado por estar ao meu lado.","Agradecimento"],["Anytime.","Sempre que precisar.","Disponibilidade"]]
  },
  {
    id:"book2_intermediate02_07", level:"intermediate02", order:7, unit:"3", lesson:"12", page:"",
    title:"Reclamação em um restaurante", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 3_Lesson 12_Dialogue 1.mp3", duration:28.16,
    transcript:`Waiter, excuse me, please. Yes, sir. How can I help you? Well, I'm sorry to say this, but I have a problem with my dish. The chicken is terribly raw inside. That's terrible, sir. I'll take your complaint to the kitchen and we'll fix that. Thanks, but just forget it. I'm leaving right now. I understand. I'm so sorry. This will never happen again.`,
    vocab:[["waiter","garçom"],["dish","prato"],["raw","cru"],["complaint","reclamação"],["kitchen","cozinha"],["fix the problem","resolver o problema"]],
    expressions:[["I'm sorry to say this, but...","Desculpe dizer isto, mas...","Introduzir reclamação"],["How can I help you?","Como posso ajudar?","Atendimento"],["This will never happen again.","Isso nunca acontecerá novamente.","Garantia"]]
  },
  {
    id:"book2_intermediate02_08", level:"intermediate02", order:8, unit:"3", lesson:"12", page:"",
    title:"Elogio ao atendimento de um hotel", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 3_Lesson 12_Dialogue 2.mp3", duration:43.47,
    transcript:`Sonico's Hotel, Gabriel speaking. Good morning. Oh, hello. Good morning, Gabriel. My name is Amanda and I would like to talk to the manager, please. That would be me. How can I help you, madam? Great. Actually, I would like to pay a compliment to the hotel and to the staff. My husband and I spent the last week with you and we were wonderfully surprised by the accommodation and the staff. We will certainly return on another occasion. The hotel is just great. Oh, it's great to hear that. I would like to thank you for calling and we do expect you to return very soon.`,
    vocab:[["manager","gerente"],["pay a compliment","fazer um elogio"],["staff","equipe"],["accommodation","acomodação"],["certainly","certamente"],["return","retornar"]],
    expressions:[["I would like to talk to the manager.","Eu gostaria de falar com o gerente.","Pedido formal"],["We were wonderfully surprised.","Ficamos maravilhosamente surpresos.","Avaliação positiva"],["It's great to hear that.","É ótimo ouvir isso.","Responder a elogio"]]
  },
  {
    id:"book2_intermediate02_09", level:"intermediate02", order:9, unit:"4", lesson:"13", page:"",
    title:"Expressão: raining cats and dogs", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4_Lesson 13_Passage 1.mp3", duration:9.56,
    transcript:`Oh my God, it's raining cats and dogs today. I wish I'd brought my umbrella with me.`,
    vocab:[["rain heavily","chover muito"],["umbrella","guarda-chuva"],["bring","trazer"],["wish","lamentar / desejar"]],
    expressions:[["It's raining cats and dogs.","Está chovendo muito.","Expressão idiomática"],["I wish I'd brought my umbrella.","Eu queria ter trazido meu guarda-chuva.","Arrependimento"]]
  },
  {
    id:"book2_intermediate02_10", level:"intermediate02", order:10, unit:"4", lesson:"13", page:"",
    title:"Expressão: have a cow", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4_Lesson 13_Passage 2.mp3", duration:17.95,
    transcript:`Hey, Carl, is everything set for tonight's soccer match? Yes, but I almost couldn't make it. Really? Why? Well, when I told my wife I would be home at around 2 a.m., she had a cow.`,
    vocab:[["be set","estar pronto"],["soccer match","partida de futebol"],["make it","conseguir ir"],["around","por volta de"]],
    expressions:[["Is everything set?","Está tudo pronto?","Checar preparação"],["I almost couldn't make it.","Eu quase não consegui ir.","Dificuldade"],["She had a cow.","Ela ficou muito irritada.","Expressão idiomática"]]
  },
  {
    id:"book2_intermediate02_11", level:"intermediate02", order:11, unit:"4", lesson:"13", page:"",
    title:"Expressão: a little bird told me", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4_Lesson 13_Passage 3.mp3", duration:20.48,
    transcript:`John, can I come in? Yeah, sure. Here it is. Happy birthday! Oh, Suzanne, thank you. How did you know it was my birthday today? Oh, a little bird told me. Oh, thank you again.`,
    vocab:[["come in","entrar"],["happy birthday","feliz aniversário"],["know","saber"],["again","novamente"]],
    expressions:[["How did you know?","Como você soube?","Perguntar a fonte"],["A little bird told me.","Um passarinho me contou.","Não revelar a fonte"]]
  },
  {
    id:"book2_intermediate02_12", level:"intermediate02", order:12, unit:"4", lesson:"13", page:"",
    title:"Expressão: a dog-eat-dog world", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediade 2_Unit 4_Lesson 13_Passage 4.mp3", duration:25.6,
    transcript:`Oh, Anna. Hey, Greg. I heard the news. I'm so sorry. Yeah, I'm sorry too. But what happened exactly? Well, I never learned how to use the company's software, so I lost my job. But no one taught you how to use it? What a shame. Unfortunately, it's a dog-eat-dog world.`,
    vocab:[["hear the news","saber da notícia"],["lose a job","perder o emprego"],["software","programa"],["teach","ensinar"],["shame","pena"]],
    expressions:[["What happened exactly?","O que aconteceu exatamente?","Pedir explicação"],["What a shame.","Que pena.","Solidariedade"],["It's a dog-eat-dog world.","É um mundo muito competitivo.","Expressão idiomática"]]
  },
  {
    id:"book2_intermediate02_13", level:"intermediate02", order:13, unit:"4", lesson:"15", page:"",
    title:"Formas de cumprimentar pelo mundo", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4_Lesson 15.mp3", duration:89.44,
    transcript:`Welcome to another trivia show, everybody. Today we'll talk about ways to greet people around the world. How much do you know about it, Pamela? Well, Tim, I have never thought about that, actually, but let's see how much our participants know. Are you ready? Let's start! One: people tend to be more conservative. When meeting someone for the first time, they would usually nod their heads and smile, or shake hands, as in a formal situation. Two: people shake hands and kiss on both cheeks upon meeting and leaving. Three: men normally shake hands when they meet each other. A handshake, a smile and even a hello will do just fine. Four: the typical greeting is a very firm handshake while maintaining direct eye contact. When men shake hands with women, the handshake is less mechanical. It is considered polite to kiss women three times, alternating cheeks, and even to kiss hands. Five: the common greeting is to bow instead of giving a casual handshake or a hug. Six: close male friends or colleagues hug and kiss both cheeks, and handshakes are made only with the right hand. Contact between opposite genders in public is considered obscene. Seven: people simply say hello when they meet friends. Handshakes are common just when meeting for the first time, and social kissing is often just a peck on the cheek. All right, everybody. Now let's check the participants' scores.`,
    vocab:[["greet","cumprimentar"],["nod","acenar com a cabeça"],["shake hands","apertar as mãos"],["cheek","bochecha"],["eye contact","contato visual"],["bow","curvar-se"],["peck on the cheek","beijinho no rosto"]],
    expressions:[["when meeting for the first time","ao conhecer alguém pela primeira vez","Primeiro encontro"],["will do just fine","será suficiente","Adequação"],["It is considered polite to...","É considerado educado...","Norma cultural"]]
  },
  {
    id:"book2_intermediate02_14", level:"intermediate02", order:14, unit:"4", lesson:"16", page:"",
    title:"Pratos recomendados ao redor do mundo", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4_Lesson 16.mp3", duration:74.11,
    transcript:`Welcome, everybody, to another Taste from Around the World. On today's show, we'll take a look at some very special recommended dishes from our correspondents in other countries. Let's start our top three. In third place, if you ever visit Singapore, don't leave that country without trying its spicy, meaty specialty. There are many different ways to prepare crab. However, chili crab remains the local must-eat. Let's take a look at number two. This one is so versatile. You may find it folded around fruit, wrapped around grissini or placed over pizza. These salty, paper-thin slices of air-dried Parma ham lift the taste of everything they accompany to a higher level: a magnificent taste from Italy. And today's winner is mashed potato with spring onions, butter, salt and pepper. Champ is a side dish that accompanies any meat or fish. It's perfection from Ireland. Thank you for your audience and see you in another edition of Taste from Around the World.`,
    vocab:[["dish","prato"],["spicy","apimentado"],["crab","caranguejo"],["versatile","versátil"],["air-dried ham","presunto curado"],["mashed potato","purê de batata"],["side dish","acompanhamento"]],
    expressions:[["Don't leave without trying it.","Não vá embora sem experimentar.","Recomendação"],["It remains a local must-eat.","Continua sendo obrigatório provar no local.","Gastronomia"],["Let's take a look at...","Vamos dar uma olhada em...","Próximo item"]]
  },
  {
    id:"book2_intermediate02_15", level:"intermediate02", order:15, unit:"Revisão 2", lesson:"Unidades 3 e 4", page:"",
    title:"Combinando uma visita no fim de semana", file:"Audios One World/LIVRO 02/INTERMEDIATE 02/Intermediate 2_Unit 4.1_Review Units 3_4.mp3", duration:48.59,
    transcript:`Hi, Michelle. How are you? Philip, glad to hear you. I'm just fine, and you? I'm just fine too. Listen, can I ask you something? Yes, sure you can. What is it? Nothing much. I was thinking about showing up with some pizza and some soda. What? Of course. So, how about Saturday? Or is it better on Sunday? Saturday's perfect for me. It's my day off. Great. At six? Perfect. Hey, I've really got to go now. My lunchtime is over. See you on Saturday. All right. See you then.`,
    vocab:[["glad to hear you","feliz em ouvir você"],["show up","aparecer"],["soda","refrigerante"],["day off","dia de folga"],["lunchtime","horário de almoço"]],
    expressions:[["I was thinking about...","Eu estava pensando em...","Sugestão"],["How about Saturday?","Que tal sábado?","Sugerir data"],["I've got to go.","Tenho que ir.","Encerrar conversa"]]
  }
].map(item=>({
  book:"book2",
  goal:`Compreender o áudio sobre ${item.title.toLowerCase()} e identificar suas estruturas principais.`,
  tip:"Ouça primeiro sem ler. Depois confira a transcrição, anote as palavras-chave e repita as expressões em voz alta.",
  ...item,
  vocab:item.vocab.map(([en,pt])=>({en,pt})),
  expressions:item.expressions.map(([en,pt,use])=>({en,pt,use}))
}));

BOOK_AUDIO_CATALOG.push(...BOOK2_AUDIO_CATALOG);
