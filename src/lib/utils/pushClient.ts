import { salvarInscricaoPush } from "@/app/push/actions";

function urlBase64ParaUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  const saida = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i);
  return saida;
}

export function pushSuportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  );
}

// Pede permissão de notificação e, se concedida, assina o Push real
// (funciona com o app fechado) e salva a inscrição no servidor. Só
// precisa rodar uma vez por aparelho — chamado a partir de um clique do
// próprio usuário (exigência dos navegadores).
export async function inscreverPush(): Promise<boolean> {
  if (!pushSuportado()) return false;

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast necessário: o TS mais recente tipa Uint8Array como genérico
      // sobre ArrayBufferLike (inclui SharedArrayBuffer), que não bate
      // exatamente com BufferSource — mas em runtime é sempre um
      // ArrayBuffer comum aqui (criado com `new Uint8Array(n)` logo acima).
      applicationServerKey: urlBase64ParaUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
    });
  }

  await salvarInscricaoPush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
  return true;
}
