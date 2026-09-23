"use client";

import { useMemo, useState } from "react";
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
  const [busca, setBusca] = useState("");
  const [motoboyFiltro, setMotoboyFiltro] = useState("");

  const motoboysPorId = useMemo(
    () => new Map(motoboys.map((m) => [m.id, m])),
    [motoboys],
  );

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (motoboyFiltro === "sem" && p.motoboy_id !== null) return false;
      if (motoboyFiltro && motoboyFiltro !== "sem" && p.motoboy_id !== motoboyFiltro) return false;
      if (termo) {
        const noCliente = p.cliente_nome.toLowerCase().includes(termo);
        const noBairro = (p.bairro ?? "").toLowerCase().includes(termo);
        if (!noCliente && !noBairro) return false;
      }
      return true;
    });
  }, [pedidos, motoboyFiltro, busca]);

  const filtroAtivo = busca.trim() !== "" || motoboyFiltro !== "";

  const hoje = new Date().toDateString();
  const problemas = pedidosFiltrados.filter((p) => p.status === "problema");

  const colunas = COLUNAS.map((coluna) => ({
    ...coluna,
    pedidos: pedidosFiltrados.filter((p) => {
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
        <p className="text-xs font-medium text-slate-400">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"} no painel
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-[18px] border border-slate-200/80 bg-white p-3 shadow-[0_2px_9px_rgba(7,31,61,.045)]">
        <div className="relative min-w-[220px] flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-350"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente ou bairro..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-brand-navy-dark placeholder:text-slate-400 focus:border-brand-gold focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={motoboyFiltro}
          onChange={(e) => setMotoboyFiltro(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-brand-navy-dark focus:border-brand-gold focus:bg-white focus:outline-none"
        >
          <option value="">Todos os entregadores</option>
          <option value="sem">Sem motoboy (fila)</option>
          {motoboys.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>

        {filtroAtivo && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setMotoboyFiltro("");
            }}
            className="rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy/55 hover:text-brand-navy"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filtroAtivo && pedidosFiltrados.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
          <p className="text-xs font-semibold text-slate-350">Nenhum pedido encontrado com esses filtros</p>
        </div>
      )}

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
