"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function finalizarEntrega(
  pedidoId: string,
  checklist: {
    receitaColetada: boolean;
    trocoEntregue: boolean;
    pagamentoConfirmado: boolean;
    observacao: string;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalizar_entrega", {
    p_pedido_id: pedidoId,
    p_receita_coletada: checklist.receitaColetada,
    p_troco_entregue: checklist.trocoEntregue,
    p_pagamento_confirmado: checklist.pagamentoConfirmado,
    p_observacao: checklist.observacao || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/motoboy/entregas/${pedidoId}`);
  revalidatePath("/motoboy/entregas");
}

export async function marcarProblema(pedidoId: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_problema", {
    p_pedido_id: pedidoId,
    p_motivo: motivo,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/motoboy/entregas/${pedidoId}`);
  revalidatePath("/motoboy/entregas");
}
