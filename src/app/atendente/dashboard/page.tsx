import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/atendente/DashboardClient";
import { hojeLocalISO } from "@/lib/utils/dataLocal";
import type { Pedido, Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) redirect("/login");

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
    <DashboardClient
      pedidosIniciais={(pedidos as Pedido[]) ?? []}
      motoboys={(motoboys as Perfil[]) ?? []}
      perfilId={perfilAtual.id}
      perfilNome={perfilAtual.nome}
      papel={perfilAtual.papel}
      hoje={hojeLocalISO()}
    />
  );
}
