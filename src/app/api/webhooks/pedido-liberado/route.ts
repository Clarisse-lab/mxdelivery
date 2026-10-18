import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarPushParaPerfis } from "@/lib/push";

// Chamado pelo gatilho do banco (trigger + pg_net, migration 0021) assim
// que o pg_cron libera um pedido agendado pra fila. Não tem sessão de
// usuário nesse momento — quem chama é o próprio Postgres — então a
// autenticação aqui é um segredo compartilhado, não um login.
export async function POST(request: NextRequest) {
  const segredo = request.headers.get("x-webhook-secret");
  if (!segredo || segredo !== process.env.CRON_WEBHOOK_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  const pedidoId = corpo?.pedido_id as string | undefined;
  if (!pedidoId) {
    return NextResponse.json({ erro: "pedido_id obrigatório" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("numero, bairro")
    .eq("id", pedidoId)
    .single();

  if (!pedido) {
    return NextResponse.json({ erro: "pedido não encontrado" }, { status: 404 });
  }

  const { data: destinatarios } = await admin.from("perfis").select("id").eq("ativo", true);

  await enviarPushParaPerfis((destinatarios ?? []).map((d) => d.id), {
    title: "Novo pedido",
    body: `#${pedido.numero} · ${pedido.bairro ?? "Bairro não informado"}`,
    tag: `pedido-${pedidoId}`,
    url: "/",
  });

  return NextResponse.json({ ok: true });
}
