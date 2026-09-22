import Link from "next/link";
import type { Pedido } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/utils/status";
import { tempoDesde } from "@/lib/utils/tempo";

export default function EntregaCard({
  pedido,
  acao,
}: {
  pedido: Pedido;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Link href={`/motoboy/entregas/${pedido.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <span className="text-lg font-semibold text-slate-900">#{pedido.numero}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[pedido.status]}`}>
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
