"use client";

import { useMemo } from "react";
import { usePedidosRealtime } from "@/lib/hooks/usePedidosRealtime";
import type { Pedido, Perfil, StatusPedido } from "@/lib/types/database";
import PedidoCard from "./PedidoCard";

const COLUNAS: { status: StatusPedido; titulo: string }[] = [
  { status: "pendente", titulo: "Pendente" },
  { status: "em_rota", titulo: "Em rota" },
  { status: "entregue", titulo: "Entregue hoje" },
];

export default function KanbanBoard({
  pedidosIniciais,
  motoboys,
}: {
  pedidosIniciais: Pedido[];
  motoboys: Perfil[];
}) {
  const pedidos = usePedidosRealtime(pedidosIniciais);
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
    <div className="space-y-6">
      {problemas.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="mb-2 text-sm font-semibold text-red-800">
            Pedidos com problema ({problemas.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid gap-4 sm:grid-cols-3">
        {colunas.map((coluna) => (
          <div key={coluna.status} className="space-y-2">
            <h2 className="flex items-center justify-between text-sm font-semibold text-slate-700">
              {coluna.titulo}
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                {coluna.pedidos.length}
              </span>
            </h2>
            <div className="space-y-2">
              {coluna.pedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  motoboy={pedido.motoboy_id ? motoboysPorId.get(pedido.motoboy_id) : undefined}
                />
              ))}
              {coluna.pedidos.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                  Nenhum pedido
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
