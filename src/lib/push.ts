import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export type PayloadPush = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
};

// Manda notificação push pra todo mundo cujo perfil está na lista —
// funciona mesmo com o app fechado, já que passa pelo service worker
// de cada aparelho (e não pela aba aberta, como o alerta sonoro antigo).
// Se as chaves VAPID não estiverem configuradas no ambiente, não faz
// nada — nunca trava a ação que chamou (ex.: criar pedido).
export async function enviarPushParaPerfis(perfilIds: string[], payload: PayloadPush) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return;
  if (perfilIds.length === 0) return;

  const admin = createAdminClient();
  const { data: inscricoes } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .in("perfil_id", perfilIds);

  if (!inscricoes || inscricoes.length === 0) return;

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth_key },
          },
          JSON.stringify(payload),
        );
      } catch (erro) {
        // Endpoint não existe mais (usuário desinstalou, trocou de
        // navegador etc.) — limpa pra não tentar de novo pra sempre.
        const status = (erro as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", inscricao.id);
        }
      }
    }),
  );
}
