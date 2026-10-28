// Service Worker — Analice Pessoa · English
// Troque a versão (v1, v2...) sempre que publicar uma atualização do app,
// para forçar os celulares a baixarem a versão nova.
const CACHE = 'ap-english-v139';
const PILOT_AUDIO_CACHE = 'ap-is08-static-audio-v1';

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_PORTAL_VERSION') {
    event.ports?.[0]?.postMessage({ version: CACHE });
  }
  if (event.data?.type === 'ACTIVATE_PORTAL_UPDATE') {
    // An older open tab may still have the unsafe controllerchange reload handler.
    // Wait until only the requesting portal window remains before taking control.
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const portalClients = clients.filter((client) => client.url.startsWith(self.registration.scope));
      if (portalClients.length <= 1 && portalClients.some((client) => client.id === event.source?.id)) {
        return self.skipWaiting();
      }
    }));
  }
});

// Arquivos do "esqueleto" do app que ficam guardados para abrir offline.
const APP_SHELL = [
  './',
  './index.html',
  './assets/azure-static-audio.js?v=135',
  './assets/azure-audio-pilot.js?v=134',
  './assets/reading/reader-1984.js?v=133',
  './assets/reading/reader-1984.css?v=133',
  './livros/1984/app/dictionary.json',
  './livros/1984/app/week1_app_content.json',
  './livros/1984/app/week2_app_content.json',
  './livros/1984/app/week3_app_content.json',
  './livros/1984/app/assets/cover_nineteen_eighty_four_a2.webp',
  './livros/1984/app/assets/week1_opening_victory_mansions.webp',
  './livros/1984/app/assets/week1_story_winston_diary.webp',
  './livros/1984/app/assets/week2_opening_ministry_of_truth.webp',
  './livros/1984/app/assets/week2_story_room_above_shop.webp',
  './livros/1984/app/assets/week3_opening_secret_note.webp',
  './livros/1984/app/assets/week3_story_room_with_julia.webp',
  './assets/reading/cover-1984.png',
  './assets/body-parts/core.js',
  './assets/body-parts/game.js',
  './assets/body-parts/game.css',
  './assets/body-parts/character.png',
  './assets/conversation-practice.css',
  './assets/conversation-live.js',
  './assets/conversation-pcm-worklet.js',
  './assets/conversation-practice.js',
  './book-audio-data.js',
  './book-audio-data-2.js',
  './livros/a%20metamorfose/reading-data.js',
  './livros/a%20metamorfose/week1_app_content.json',
  './livros/a%20metamorfose/week2_app_content.json',
  './livros/a%20metamorfose/week3_app_content.json',
  './livros/a%20metamorfose/week4_app_content.json',
  './livros/a%20metamorfose/week5_app_content.json',
  './livros/a%20metamorfose/week6_app_content.json',
  './livros/a%20metamorfose/assets/cover_the_metamorphosis_a1.png',
  './livros/a%20metamorfose/assets/week1_opening_gregor_wakes.png',
  './livros/a%20metamorfose/assets/week1_part2_clock_and_job.webp',
  './livros/a%20metamorfose/assets/week1_part3_responsibility.webp',
  './livros/a%20metamorfose/assets/week1_part4_voices_behind_door.webp',
  './livros/a%20metamorfose/assets/week1_part5_time_passing.webp',
  './livros/a%20metamorfose/assets/week1_part6_chief_clerk.webp',
  './livros/a%20metamorfose/assets/week1_visual_reflection_closed_door.png',
  './livros/a%20metamorfose/assets/week2_part1_chief_clerk_arrives.webp',
  './livros/a%20metamorfose/assets/week2_part2_key_in_lock.webp',
  './livros/a%20metamorfose/assets/week2_part3_door_opens.webp',
  './livros/a%20metamorfose/assets/week2_part4_clerk_runs_away.webp',
  './livros/a%20metamorfose/assets/week2_part5_father_forces_return.webp',
  './livros/a%20metamorfose/assets/week2_part6_alone_again.webp',
  './livros/a%20metamorfose/assets/week3_part1_grete_brings_food.webp',
  './livros/a%20metamorfose/assets/week3_part2_different_foods.webp',
  './livros/a%20metamorfose/assets/week3_part3_gregor_hides.webp',
  './livros/a%20metamorfose/assets/week3_part4_listens_to_family.webp',
  './livros/a%20metamorfose/assets/week3_part5_climbs_wall.webp',
  './livros/a%20metamorfose/assets/week3_part6_old_life.webp',
  './livros/a%20metamorfose/assets/week4_part1_remove_furniture.webp',
  './livros/a%20metamorfose/assets/week4_part2_human_memories.webp',
  './livros/a%20metamorfose/assets/week4_part3_protects_picture.webp',
  './livros/a%20metamorfose/assets/week4_part4_mother_frightened.webp',
  './livros/a%20metamorfose/assets/week4_part5_apple_attack.webp',
  './livros/a%20metamorfose/assets/week4_part6_empty_room.webp',
  './livros/a%20metamorfose/assets/week5_part1_family_routine.webp',
  './livros/a%20metamorfose/assets/week5_part2_neglected_room.webp',
  './livros/a%20metamorfose/assets/week5_part3_three_lodgers.webp',
  './livros/a%20metamorfose/assets/week5_part4_violin_music.webp',
  './livros/a%20metamorfose/assets/week5_part5_drawn_to_music.webp',
  './livros/a%20metamorfose/assets/week5_part6_lodgers_see_gregor.webp',
  './livros/a%20metamorfose/assets/week6_part1_lodgers_angry.webp',
  './livros/a%20metamorfose/assets/week6_part2_grete_decision.webp',
  './livros/a%20metamorfose/assets/week6_part3_returns_to_room.webp',
  './livros/a%20metamorfose/assets/week6_part4_last_night.webp',
  './livros/a%20metamorfose/assets/week6_part5_lodgers_leave.webp',
  './livros/a%20metamorfose/assets/week6_part6_family_tram.webp',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Instala e guarda o esqueleto do app.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Remove caches antigos quando a versão muda.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => /^ap-english-v\d+$/.test(k) && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: tenta a rede primeiro (sempre pega a versão mais nova),
// e usa o cache como reserva quando estiver sem internet.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // O cache do PWA deve cuidar apenas dos arquivos do próprio portal.
  // Requisições externas (como o Supabase) precisam seguir direto para a
  // rede: interceptá-las pode prender a resposta no Safari/iPhone e deixar o
  // progresso eternamente em "Salvando...", mesmo com internet disponível.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // MP3 da IS08: sob demanda, com limite de 30 arquivos. Safari envia Range
  // diretamente à rede; em falhas o cliente recorre à voz do navegador.
  if (/\/assets\/audio\/azure-static\/is08-week01\/[a-f0-9]{64}\.mp3$/.test(url.pathname)) {
    event.respondWith((async () => {
      if (req.headers.has('range')) return fetch(req);
      try {
        const response = await fetch(req);
        if (response.ok && response.status === 200 && response.headers.get('content-type')?.toLowerCase().startsWith('audio/mpeg')) {
          const copy = response.clone();
          event.waitUntil(caches.open(PILOT_AUDIO_CACHE).then(async cache => {
            await cache.put(req, copy);
            const keys = await cache.keys();
            if (keys.length > 30) await Promise.all(keys.slice(0, keys.length - 30).map(key => cache.delete(key)));
          }).catch(() => {}));
        }
        return response;
      } catch {
        return (await caches.open(PILOT_AUDIO_CACHE).then(cache => cache.match(req))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // guarda uma cópia atualizada no cache
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
