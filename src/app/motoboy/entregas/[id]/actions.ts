"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function iniciarRota(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("iniciar_rota", { p_pedido_id: pedidoId });

  if (error) throw new Error(error.message);

  revalidatePath(`/motoboy/entregas/${pedidoId}`);
  revalidatePath("/motoboy/entregas");
}

export async function devolverPedido(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("devolver_pedido", { p_pedido_id: pedidoId });

  if (error) throw new Error(error.message);

  revalidatePath(`/motoboy/entregas/${pedidoId}`);
  revalidatePath("/motoboy/entregas");
}
