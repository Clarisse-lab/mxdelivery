import Link from "next/link";
import type { Pedido } from "@/lib/types/database";
import { STATUS_LABEL } from "@/lib/utils/status";
import { tempoDesde } from "@/lib/utils/tempo";

const UI: Record<Pedido["status"], { bar: string; badge: string }> = {
  pendente: { bar: "bg-brand-gold", badge: "bg-amber-50 text-amber-800" },
  em_rota: { bar: "bg-blue-500", badge: "bg-blue-50 text-brand-blue" },
  entregue: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  problema: { bar: "bg-red-500", badge: "bg-red-50 text-red-700" },
  cancelado: { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-500" },
};

export default function EntregaCard({
  pedido,
  acao,
  atrasado = false,
}: {
  pedido: Pedido;
  acao?: React.ReactNode;
  atrasado?: boolean;
}) {
  const ui = UI[pedido.status];

  return (
    <article
      className={
        "relative overflow-hidden rounded-[22px] border bg-white p-4 shadow-[0_8px_28px_rgba(7,31,61,.055)] " +
        (atrasado ? "border-red-300" : "border-slate-200/80")
      }
    >
      <span className={"absolute inset-y-0 left-0 w-1 " + ui.bar} />
      <Link href={"/motoboy/entregas/" + pedido.id} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-350">Pedido</p>
            <span className="mt-0.5 block text-base font-black text-brand-navy-dark">#{pedido.numero}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={"rounded-full px-2.5 py-1 text-[10px] font-extrabold " + ui.badge}>
              {STATUS_LABEL[pedido.status]}
            </span>
            {atrasado && (
              <span className="animate-pulse rounded-full bg-red-600 px-2 py-1 text-[9px] font-extrabold text-white">
                ⏰ Atrasado
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 px-3.5 py-3">
          <p className="text-lg font-black tracking-[-0.025em] text-brand-navy">{pedido.bairro}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-600">{pedido.cliente_nome}</p>
        </div>

        {pedido.precisa_receita && (
          <p className="mt-3 inline-flex rounded-lg bg-red-50 px-2 py-1 text-[10px] font-extrabold text-brand-red">
            Recolher receita
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-400">{tempoDesde(pedido.criado_em)}</span>
          <span className="font-extrabold text-brand-navy">Ver detalhes →</span>
        </div>
      </Link>
      {acao && <div className="mt-4 border-t border-slate-100 pt-4">{acao}</div>}
    </article>
  );
}
