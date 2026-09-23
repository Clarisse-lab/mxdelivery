"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePedidosRealtime } from "@/lib/hooks/usePedidosRealtime";
import { useAgora } from "@/lib/hooks/useAgora";
import { useAlertaAtraso } from "@/lib/hooks/useAlertaAtraso";
import { useAlertaNovoPedido } from "@/lib/hooks/useAlertaNovoPedido";
import { calcularNivelUrgencia } from "@/lib/utils/atraso";
import { pegarPedido } from "@/app/motoboy/entregas/actions";
import type { Pedido } from "@/lib/types/database";
import EntregaCard from "./EntregaCard";
import AlertaNotificacoes from "@/components/AlertaNotificacoes";

export default function EntregasList({
  pedidosIniciais,
  motoboyId,
}: {
  pedidosIniciais: Pedido[];
  motoboyId: string;
}) {
  const pedidos = usePedidosRealtime(pedidosIniciais);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const agora = useAgora();

  const minhas = pedidos
    .filter((p) => p.motoboy_id === motoboyId)
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "em_rota" ? -1 : 1;
    });

  const fila = pedidos
    .filter((p) => p.motoboy_id === null)
    .sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());

  useAlertaAtraso(minhas);
  useAlertaNovoPedido(fila);

  const emRota = minhas.filter((p) => p.status === "em_rota").length;
  const aguardando = minhas.filter((p) => p.status === "pendente").length;

  function pegar(pedidoId: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await pegarPedido(pedidoId);
        router.push("/motoboy/entregas/" + pedidoId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível pegar este pedido.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <AlertaNotificacoes mensagem="Ative alertas sonoros pra ser avisado de pedido atrasado e de pedido novo na fila." />

      <section className="relative overflow-hidden rounded-[26px] bg-brand-navy px-5 py-5 text-white shadow-[0_18px_40px_rgba(11,49,95,.16)]">
        <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full border-[30px] border-brand-gold/20" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Rota do dia</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Minhas entregas</h1>
          <p className="mt-1 text-xs text-white/55">Organize seu dia e acompanhe cada entrega.</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniStat valor={minhas.length} label="Com você" />
            <MiniStat valor={emRota} label="Em rota" destaque />
            <MiniStat valor={aguardando} label="Aguardando" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold-dark">Sua operação</p>
            <h2 className="mt-0.5 text-base font-black text-brand-navy-dark">Entregas atribuídas</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">● Online</span>
        </div>

        {minhas.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">Você não tem entregas no momento.</p>
          </div>
        )}

        <div className="space-y-3">
          {minhas.map((pedido) => (
            <EntregaCard key={pedido.id} pedido={pedido} nivelUrgencia={calcularNivelUrgencia(pedido, agora)} />
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-200/70 pt-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold-dark">Novas oportunidades</p>
            <h2 className="mt-0.5 text-base font-black text-brand-navy-dark">Fila disponível</h2>
          </div>
          {fila.length > 0 && (
            <span className="rounded-full bg-brand-gold-soft px-2.5 py-1 text-[10px] font-black text-brand-navy">
              {fila.length}
            </span>
          )}
        </div>

        {erro && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{erro}</p>}
        {fila.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-7 text-center">
            <p className="text-sm font-semibold text-slate-500">Nenhum pedido esperando na fila.</p>
          </div>
        )}

        <div className="space-y-3">
          {fila.map((pedido) => (
            <EntregaCard
              key={pedido.id}
              pedido={pedido}
              nivelUrgencia={calcularNivelUrgencia(pedido, agora)}
              acao={
                <button
                  onClick={() => pegar(pedido.id)}
                  disabled={pending}
                  className="w-full rounded-xl bg-brand-gold py-3 text-sm font-black text-brand-navy-dark shadow-sm hover:bg-[#ffd64d] disabled:opacity-60"
                >
                  {pending ? "Carregando..." : "Pegar esta entrega"}
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ valor, label, destaque = false }: { valor: number; label: string; destaque?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl px-3 py-3 " +
        (destaque ? "bg-brand-gold text-brand-navy-dark" : "bg-white/[0.075] text-white")
      }
    >
      <p className="text-xl font-black tracking-[-0.04em]">{valor}</p>
      <p
        className={
          "mt-0.5 text-[10px] font-semibold " +
          (destaque ? "text-brand-navy/60" : "text-white/45")
        }
      >
        {label}
      </p>
    </div>
  );
}
