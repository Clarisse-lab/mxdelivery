// Service worker mínimo — só o necessário para o navegador considerar o
// app instalável como PWA. Funcionamento offline está fora do escopo do
// MVP (spec, seção 9).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // passthrough — sem cache
});
