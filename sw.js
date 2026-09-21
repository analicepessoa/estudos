// Service Worker — Analice Pessoa · English
// Troque a versão (v1, v2...) sempre que publicar uma atualização do app,
// para forçar os celulares a baixarem a versão nova.
const CACHE = 'ap-english-v62';

// Arquivos do "esqueleto" do app que ficam guardados para abrir offline.
const APP_SHELL = [
  './',
  './index.html',
  './assets/conversation-practice.css',
  './assets/conversation-live.js',
  './assets/conversation-pcm-worklet.js',
  './assets/conversation-practice.js',
  './book-audio-data.js',
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
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Remove caches antigos quando a versão muda.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: tenta a rede primeiro (sempre pega a versão mais nova),
// e usa o cache como reserva quando estiver sem internet.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

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
