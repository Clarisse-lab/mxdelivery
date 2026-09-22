"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function pegarPedido(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("pegar_pedido", { p_pedido_id: pedidoId });

  if (error) throw new Error(error.message);

  revalidatePath("/motoboy/entregas");
}
