import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import PedidoCard from "@/components/atendente/PedidoCard";
import type { Pedido, Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

// Não é um "login mestre" de verdade — não gera sessão nenhuma pro
// motoboy nem precisa da senha dele. É só uma cópia, somente leitura, do
// que a fila e "minhas entregas" mostram pra ele agora, montada com os
// dados que o admin já tem permissão de ver. Serve pra suporte/print de
// tela, não pra agir no lugar dele (por isso não tem os botões de
// pegar/iniciar entrega aqui).
export default async function VisualizarMotoboyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) redirect("/login");
  if (perfilAtual.papel !== "admin") redirect("/atendente/dashboard");

  const supabase = await createClient();
  const [{ data: motoboy }, { data: pedidos }] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", id).eq("papel", "motoboy").single(),
    supabase
      .from("pedidos")
      .select("*")
      .in("status", ["pendente", "em_rota"])
      .order("criado_em", { ascending: true }),
  ]);

  if (!motoboy) notFound();

  const m = motoboy as Perfil;
  const listaPedidos = (pedidos as Pedido[]) ?? [];
  const minhas = listaPedidos.filter((p) => p.motoboy_id === m.id);
  const fila = listaPedidos.filter((p) => p.motoboy_id === null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/atendente/motoboys"
        className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-navy/55 hover:text-brand-navy"
      >
        <span aria-hidden="true">←</span>
        Motoboys
      </Link>

      <div className="rounded-[20px] border border-brand-gold/40 bg-brand-gold-soft/60 px-4 py-3.5">
        <p className="text-sm font-extrabold text-brand-navy-dark">
          Visualizando a tela de {m.nome} · somente leitura
        </p>
        <p className="mt-1 text-xs leading-5 text-brand-navy/60">
          Mostra o mesmo que ele vê agora no app dele (entregas atribuídas + fila disponível). Não dá
          pra pegar/iniciar entrega por aqui — é só visualização.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="px-1 text-base font-black tracking-[-0.03em] text-brand-navy-dark">
          Entregas de {m.nome}
        </h2>
        {minhas.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
            <p className="text-xs font-semibold text-slate-350">Nenhuma entrega atribuída no momento.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {minhas.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} motoboy={m} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 border-t border-slate-200/70 pt-5">
        <h2 className="px-1 text-base font-black tracking-[-0.03em] text-brand-navy-dark">
          Fila disponível
        </h2>
        {fila.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
            <p className="text-xs font-semibold text-slate-350">Nenhum pedido esperando na fila.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fila.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
