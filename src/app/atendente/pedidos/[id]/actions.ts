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
