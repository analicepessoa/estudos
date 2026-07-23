// Service Worker — Analice Pessoa · English
// Troque a versão (v1, v2...) sempre que publicar uma atualização do app,
// para forçar os celulares a baixarem a versão nova.
const CACHE = 'ap-english-v2';

// Arquivos do "esqueleto" do app que ficam guardados para abrir offline.
const APP_SHELL = [
  './',
  './index.html',
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
