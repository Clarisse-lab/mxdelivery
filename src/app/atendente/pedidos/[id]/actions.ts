"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Reatribuir sempre devolve o pedido para "pendente" com o checklist
// zerado — é um recomeço para o motoboy novo (ou para a fila, se
// motoboyId vier null), então o progresso do motoboy anterior não faz
// mais sentido manter.
export async function reatribuirMotoboy(pedidoId: string, motoboyId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pedidos")
    .update({
      motoboy_id: motoboyId,
      atribuido_em: motoboyId ? new Date().toISOString() : null,
      status: "pendente",
      iniciado_em: null,
      motivo_problema: null,
      receita_coletada: false,
      troco_entregue: false,
      pagamento_confirmado: false,
    })
    .eq("id", pedidoId)
    .in("status", ["pendente", "em_rota", "problema"]);

  if (error) throw new Error(error.message);

  revalidatePath(`/atendente/pedidos/${pedidoId}`);
  revalidatePath("/atendente/dashboard");
}

export async function cancelarPedido(pedidoId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pedidos")
    .update({ status: "cancelado" })
    .eq("id", pedidoId)
    .neq("status", "entregue");

  if (error) throw new Error(error.message);

  revalidatePath(`/atendente/pedidos/${pedidoId}`);
  revalidatePath("/atendente/dashboard");
}

// Exclusão de verdade (não é o "cancelar", que só muda o status).
// A RLS de pedidos só deixa admin excluir qualquer um; a UI também só
// mostra esse botão pra admin.
export async function excluirPedido(pedidoId: string) {
  const supabase = await createClient();

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("comprovante_pix_path")
    .eq("pedido_id", pedidoId)
    .not("comprovante_pix_path", "is", null);

  const caminhos = (pagamentos ?? [])
    .map((p) => p.comprovante_pix_path)
    .filter((c): c is string => Boolean(c));

  if (caminhos.length > 0) {
    await supabase.storage.from("comprovantes-pix").remove(caminhos);
  }

  const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId);
  if (error) throw new Error(error.message);

  revalidatePath("/atendente/dashboard");
}
