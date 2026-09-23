"use client";

import { useMemo } from "react";
import type { Pedido, Perfil, StatusPedido } from "@/lib/types/database";
import PedidoCard from "./PedidoCard";

const COLUNAS: { status: StatusPedido; titulo: string; detalhe: string }[] = [
  { status: "pendente", titulo: "Pendentes", detalhe: "Aguardando saída" },
  { status: "em_rota", titulo: "Em rota", detalhe: "A caminho do cliente" },
  { status: "entregue", titulo: "Entregues", detalhe: "Concluídos hoje" },
];

const STATUS_UI: Record<string, { dot: string; pill: string }> = {
  pendente: { dot: "bg-brand-gold", pill: "bg-brand-gold-soft text-brand-navy" },
  em_rota: { dot: "bg-blue-500", pill: "bg-blue-50 text-brand-blue" },
  entregue: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
};

export default function KanbanBoard({
  pedidos,
  motoboys,
}: {
  pedidos: Pedido[];
  motoboys: Perfil[];
}) {
  const motoboysPorId = useMemo(
    () => new Map(motoboys.map((m) => [m.id, m])),
    [motoboys],
  );

  const hoje = new Date().toDateString();
  const problemas = pedidos.filter((p) => p.status === "problema");

  const colunas = COLUNAS.map((coluna) => ({
    ...coluna,
    pedidos: pedidos.filter((p) => {
      if (p.status !== coluna.status) return false;
      if (coluna.status === "entregue") {
        return p.entregue_em && new Date(p.entregue_em).toDateString() === hoje;
      }
      return true;
    }),
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-dark">Operação</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-brand-navy-dark">Fluxo de pedidos</h2>
        </div>
        <p className="text-xs font-medium text-slate-400">{pedidos.length} pedidos no painel</p>
      </div>

      {problemas.length > 0 && (
        <div className="rounded-[20px] border border-red-100 bg-red-50/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-red-800">Pedidos com atenção necessária</p>
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white">
              {problemas.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {problemas.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                motoboy={pedido.motoboy_id ? motoboysPorId.get(pedido.motoboy_id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {colunas.map((coluna) => {
          const ui = STATUS_UI[coluna.status];
          return (
            <div
              key={coluna.status}
              className="rounded-[22px] border border-slate-200/70 bg-[#f2f5f8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <span className={"h-2.5 w-2.5 rounded-full " + ui.dot} />
                  <div>
                    <h3 className="text-sm font-extrabold text-brand-navy-dark">{coluna.titulo}</h3>
                    <p className="text-[10px] font-medium text-slate-400">{coluna.detalhe}</p>
                  </div>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-[11px] font-black " + ui.pill}>
                  {coluna.pedidos.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {coluna.pedidos.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    motoboy={pedido.motoboy_id ? motoboysPorId.get(pedido.motoboy_id) : undefined}
                  />
                ))}
                {coluna.pedidos.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
                    <p className="text-xs font-semibold text-slate-350">Nenhum pedido por aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
