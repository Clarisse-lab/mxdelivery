// Service worker mínimo — só o necessário para o navegador considerar o
// app instalável como PWA, e pra receber/mostrar notificações push mesmo
// com o app fechado. Funcionamento offline está fora do escopo do MVP
// (spec, seção 9).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // passthrough — sem cache
});

// Chega mesmo com o navegador/app fechado — é o que o servidor manda ao
// criar um pedido novo. O "som" da notificação é o toque de notificação
// do próprio aparelho (não dá pra controlar isso pelo código, depende do
// volume/modo silencioso do celular); o vibrate ajuda em Android.
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { title: "Sistema de Entregas", body: event.data ? event.data.text() : "" };
  }

  const titulo = dados.title || "Sistema de Entregas";
  const opcoes = {
    body: dados.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: dados.tag || "mx-delivery",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { url: dados.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Clicar na notificação abre o app (ou foca a aba já aberta) em vez de
// só sumir.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ("focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
