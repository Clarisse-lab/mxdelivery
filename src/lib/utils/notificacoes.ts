export function notificacoesSuportadas(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissaoNotificacao(): NotificationPermission | "indisponivel" {
  if (!notificacoesSuportadas()) return "indisponivel";
  return Notification.permission;
}

export async function pedirPermissaoNotificacao(): Promise<NotificationPermission | "indisponivel"> {
  if (!notificacoesSuportadas()) return "indisponivel";
  return Notification.requestPermission();
}

export function notificar(titulo: string, corpo: string) {
  if (!notificacoesSuportadas() || Notification.permission !== "granted") return;
  try {
    new Notification(titulo, { body: corpo, icon: "/icons/icon-192.png", tag: titulo + corpo });
  } catch {
    // Alguns navegadores bloqueiam notificação em certas condições (ex.:
    // aba em segundo plano em determinados sistemas) — sem problema,
    // o alerta sonoro e o badge na tela continuam funcionando.
  }
}
