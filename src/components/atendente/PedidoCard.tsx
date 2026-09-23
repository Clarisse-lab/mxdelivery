"use client";

import Link from "next/link";
import type { Pedido, Perfil } from "@/lib/types/database";
import { tempoDesde } from "@/lib/utils/tempo";

const STATUS: Record<Pedido["status"], { bar: string; badge: string; label: string }> = {
  pendente: { bar: "bg-brand-gold", badge: "bg-amber-50 text-amber-800", label: "Pendente" },
  em_rota: { bar: "bg-blue-500", badge: "bg-blue-50 text-brand-blue", label: "Em rota" },
  entregue: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Entregue" },
  problema: { bar: "bg-red-500", badge: "bg-red-50 text-red-700", label: "Atenção" },
  cancelado: { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-500", label: "Cancelado" },
};

export default function PedidoCard({
  pedido,
  motoboy,
}: {
  pedido: Pedido;
  motoboy?: Perfil;
}) {
  const status = STATUS[pedido.status];

  return (
    <Link
      href={"/atendente/pedidos/" + pedido.id}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_9px_rgba(7,31,61,.045)] hover:-translate-y-0.5 hover:border-brand-navy/15 hover:shadow-[0_12px_28px_rgba(7,31,61,.08)]"
    >
      <span className={"absolute inset-y-0 left-0 w-1 " + status.bar} />

      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-350">Pedido</span>
          <p className="mt-0.5 text-sm font-black text-brand-navy-dark">#{pedido.numero}</p>
        </div>
        <span className={"rounded-full px-2 py-1 text-[9px] font-extrabold " + status.badge}>
          {status.label}
        </span>
      </div>

      <div className="mt-3">
        <p className="truncate text-[15px] font-extrabold tracking-[-0.015em] text-brand-navy">{pedido.bairro}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{pedido.cliente_nome}</p>
      </div>

      {pedido.precisa_receita && (
        <div className="mt-3 inline-flex rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-brand-red">
          Receita necessária
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
        <span className="font-semibold text-slate-400">{motoboy ? motoboy.nome : "Aguardando motoboy"}</span>
        <span className="font-bold text-brand-navy/55">{tempoDesde(pedido.criado_em)}</span>
      </div>
    </Link>
  );
}
