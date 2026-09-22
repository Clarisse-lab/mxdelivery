import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EntregasList from "@/components/motoboy/EntregasList";
import type { Pedido } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .in("status", ["pendente", "em_rota"])
    .order("criado_em", { ascending: true });

  return (
    <EntregasList pedidosIniciais={(pedidos as Pedido[]) ?? []} motoboyId={user.id} />
  );
}
