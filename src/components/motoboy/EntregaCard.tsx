import Link from "next/link";
import type { Pedido } from "@/lib/types/database";
import { STATUS_LABEL } from "@/lib/utils/status";
import { tempoDesde } from "@/lib/utils/tempo";

const BORDA_POR_STATUS: Record<Pedido["status"], string> = {
  pendente: "border-l-brand-gold",
  em_rota: "border-l-brand-navy",
  entregue: "border-l-emerald-500",
  problema: "border-l-red-500",
  cancelado: "border-l-slate-300",
};

const BADGE_POR_STATUS: Record<Pedido["status"], string> = {
  pendente: "bg-amber-100 text-amber-800",
  em_rota: "bg-brand-navy text-white",
  entregue: "bg-emerald-100 text-emerald-800",
  problema: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-600",
};

export default function EntregaCard({
  pedido,
  acao,
}: {
  pedido: Pedido;
  acao?: React.ReactNode;
}) {
  const emRota = pedido.status === "em_rota";

  return (
    <div
      className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${BORDA_POR_STATUS[pedido.status]} ${
        emRota ? "ring-1 ring-brand-navy/20" : ""
      }`}
    >
      <Link href={`/motoboy/entregas/${pedido.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <span className="text-lg font-semibold text-slate-900">#{pedido.numero}</span>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_POR_STATUS[pedido.status]}`}
          >
            {emRota && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
            )}
            {STATUS_LABEL[pedido.status]}
          </span>
        </div>
        <p className="mt-1 text-xl font-bold text-blue-900">{pedido.bairro}</p>
        <p className="text-sm text-slate-600">{pedido.cliente_nome}</p>
        {pedido.precisa_receita && (
          <p className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            Precisa recolher receita
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">{tempoDesde(pedido.criado_em)}</p>
      </Link>
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}
