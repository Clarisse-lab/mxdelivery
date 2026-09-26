import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/atendente/DashboardClient";
import FiltroDataPedidos from "@/components/atendente/FiltroDataPedidos";
import PedidoCard from "@/components/atendente/PedidoCard";
import { hojeLocalISO, limitesDoDia, formatarDataLocal } from "@/lib/utils/dataLocal";
import type { Pedido, Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const supabase = await createClient();
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) redirect("/login");

  const hoje = hojeLocalISO();

  // O painel só mostra pedidos de hoje (criados ou entregues hoje) e os
  // que ainda estão em aberto (pendente/em_rota/problema), então não tem
  // por que buscar TODO o histórico de pedidos já entregues em outros
  // dias — isso só cresce pra sempre e deixa o carregamento cada vez mais
  // lento conforme a farmácia acumula pedidos. Pra consultar outros dias,
  // tem o filtro de data logo abaixo, que busca só aquele dia específico.
  const { inicio } = limitesDoDia(hoje);

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

  const listaMotoboys = (motoboys as Perfil[]) ?? [];
  const motoboysPorId = new Map(listaMotoboys.map((m) => [m.id, m]));

  const { data: dataParam } = await searchParams;
  const dataSelecionada = dataParam && DATA_REGEX.test(dataParam) && dataParam <= hoje ? dataParam : hoje;
  const vendoOutroDia = dataSelecionada !== hoje;

  let pedidosDoDia: Pedido[] = [];
  if (vendoOutroDia) {
    const { inicio: inicioDia, fim: fimDia } = limitesDoDia(dataSelecionada);
    const inicioISO = inicioDia.toISOString();
    const fimISO = fimDia.toISOString();

    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .or(
        `and(criado_em.gte.${inicioISO},criado_em.lte.${fimISO}),and(entregue_em.gte.${inicioISO},entregue_em.lte.${fimISO})`,
      )
      .order("criado_em", { ascending: false });

    pedidosDoDia = (data as Pedido[]) ?? [];
  }

  const secaoHistorico = (
    <section className="space-y-4">
      <FiltroDataPedidos hoje={hoje} dataSelecionada={dataSelecionada} />

      {vendoOutroDia && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black tracking-[-0.03em] text-brand-navy-dark">
              Pedidos de {formatarDataLocal(dataSelecionada)}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {pedidosDoDia.length} {pedidosDoDia.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          {pedidosDoDia.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
              <p className="text-xs font-semibold text-slate-350">Nenhum pedido encontrado nesse dia.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pedidosDoDia.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  motoboy={pedido.motoboy_id ? motoboysPorId.get(pedido.motoboy_id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  return (
    <DashboardClient
      pedidosIniciais={(pedidos as Pedido[]) ?? []}
      motoboys={listaMotoboys}
      perfilId={perfilAtual.id}
      perfilNome={perfilAtual.nome}
      papel={perfilAtual.papel}
      hoje={hoje}
      secaoHistorico={secaoHistorico}
    />
  );
}
