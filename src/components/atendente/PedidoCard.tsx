"use client";

import Link from "next/link";
import type { Pedido, Perfil } from "@/lib/types/database";
import { tempoDesde } from "@/lib/utils/tempo";

const BORDA_POR_STATUS: Record<Pedido["status"], string> = {
  pendente: "border-l-brand-gold",
  em_rota: "border-l-brand-navy",
  entregue: "border-l-emerald-500",
  problema: "border-l-red-500",
  cancelado: "border-l-slate-300",
};

export default function PedidoCard({
  pedido,
  motoboy,
}: {
  pedido: Pedido;
  motoboy?: Perfil;
}) {
  return (
    <Link
      href={`/atendente/pedidos/${pedido.id}`}
      className={`block rounded-lg border-l-4 border-y border-r border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${BORDA_POR_STATUS[pedido.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-slate-900">#{pedido.numero}</span>
        {pedido.precisa_receita && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
            Receita
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-blue-900">{pedido.bairro}</p>
      <p className="truncate text-xs text-slate-500">{pedido.cliente_nome}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{motoboy ? motoboy.nome : "Fila"}</span>
        <span>{tempoDesde(pedido.criado_em)}</span>
      </div>
    </Link>
  );
}
