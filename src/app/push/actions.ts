"use server";

import { createClient } from "@/lib/supabase/server";

export type InscricaoPush = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Guarda (ou atualiza) a inscrição de push deste navegador/aparelho pro
// usuário logado. Chamado pelo próprio navegador depois que o
// pushManager.subscribe() dá certo.
export async function salvarInscricaoPush(inscricao: InscricaoPush) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!inscricao?.endpoint || !inscricao.keys?.p256dh || !inscricao.keys?.auth) {
    throw new Error("Inscrição de notificação inválida.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      perfil_id: user.id,
      endpoint: inscricao.endpoint,
      p256dh: inscricao.keys.p256dh,
      auth_key: inscricao.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw new Error(error.message);
}
