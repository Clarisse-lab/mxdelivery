"use client";

import Link from "next/link";
import type { Pedido, Perfil } from "@/lib/types/database";
import { tempoDesde } from "@/lib/utils/tempo";

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
      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-emerald-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-slate-900">#{pedido.numero}</span>
        {pedido.precisa_receita && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
            Receita
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-sm text-slate-700">{pedido.cliente_nome}</p>
      {pedido.bairro && (
        <p className="truncate text-xs text-slate-500">{pedido.bairro}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{motoboy ? motoboy.nome : "Fila"}</span>
        <span>{tempoDesde(pedido.criado_em)}</span>
      </div>
    </Link>
  );
}
