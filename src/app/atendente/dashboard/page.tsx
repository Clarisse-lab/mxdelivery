import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/atendente/KanbanBoard";
import type { Pedido, Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: pedidos }, { data: motoboys }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*")
      .neq("status", "cancelado")
      .order("criado_em", { ascending: false }),
    supabase
      .from("perfis")
      .select("*")
      .eq("papel", "motoboy")
      .order("nome"),
  ]);

  return (
    <KanbanBoard
      pedidosIniciais={(pedidos as Pedido[]) ?? []}
      motoboys={(motoboys as Perfil[]) ?? []}
    />
  );
}
