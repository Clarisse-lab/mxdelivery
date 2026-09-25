import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/atendente/DashboardClient";
import { hojeLocalISO, limitesDoDia } from "@/lib/utils/dataLocal";
import type { Pedido, Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) redirect("/login");

  // O painel só mostra pedidos de hoje (criados ou entregues hoje) e os
  // que ainda estão em aberto (pendente/em_rota/problema), então não tem
  // por que buscar TODO o histórico de pedidos já entregues em outros
  // dias — isso só cresce pra sempre e deixa o carregamento cada vez mais
  // lento conforme a farmácia acumula pedidos.
  const { inicio } = limitesDoDia(hojeLocalISO());

  const [{ data: pedidos }, { data: motoboys }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*")
      .neq("status", "cancelado")
      .or(`criado_em.gte.${inicio.toISOString()},entregue_em.gte.${inicio.toISOString()},status.in.(pendente,em_rota,problema)`)
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
