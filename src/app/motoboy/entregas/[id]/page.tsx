import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IniciarRotaButton from "@/components/motoboy/IniciarRotaButton";
import PegarEntregaButton from "@/components/motoboy/PegarEntregaButton";
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  TIPO_RECEITA_LABEL,
  descreverFormaPagamento,
  formatarMoeda,
} from "@/lib/utils/status";
import { calcularTroco } from "@/lib/utils/troco";
import type { Pedido, Receita } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function EntregaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: pedido }, { data: receitas }] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).single(),
    supabase.from("receitas").select("*").eq("pedido_id", id),
  ]);
  if (!pedido) notFound();

  const p = pedido as Pedido;
  const listaReceitas = (receitas as Receita[]) ?? [];
  const ehMinha = p.motoboy_id === user.id;
  const naFila = p.motoboy_id === null && p.status === "pendente";
  const troco = calcularTroco(p.valor_total, p.troco_para);

  return (
    <div className="space-y-4 pb-24">
      <Link href="/motoboy/entregas" className="text-sm font-medium text-slate-500">
        ← Minhas entregas
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Pedido #{p.numero}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[p.status]}`}>
          {STATUS_LABEL[p.status]}
        </span>
      </div>

      <div className="rounded-xl bg-blue-600 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Bairro</p>
        <p className="text-2xl font-bold text-white">{p.bairro}</p>
      </div>

      {p.precisa_receita && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4">
          <p className="text-base font-bold text-red-700">⚠ Recolher receita controlada</p>
          <ul className="mt-1 text-sm text-red-700">
            {listaReceitas.map((r) => (
              <li key={r.id}>
                {r.quantidade}x · {TIPO_RECEITA_LABEL[r.tipo_receita]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Cliente</p>
          <p className="text-base text-slate-900">{p.cliente_nome}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Endereço</p>
          <p className="text-base text-slate-900">{p.endereco}</p>
        </div>
        {p.referencia && (
          <div>
            <p className="text-xs font-medium text-slate-500">Referência</p>
            <p className="text-base text-slate-900">{p.referencia}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-slate-500">Forma de pagamento</p>
          <p className="text-base text-slate-900">{descreverFormaPagamento(p)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Valor total</p>
          <p className="text-base text-slate-900">{formatarMoeda(p.valor_total)}</p>
        </div>
        {troco !== null && (
          <div className="rounded-lg bg-amber-100 p-3">
            <p className="text-xs font-medium text-amber-800">
              Cliente paga com {formatarMoeda(p.troco_para!)}
            </p>
            <p className="text-lg font-bold text-amber-900">Levar troco: {formatarMoeda(troco)}</p>
          </div>
        )}
        {p.observacoes && (
          <div>
            <p className="text-xs font-medium text-slate-500">Observações</p>
            <p className="text-base text-slate-900">{p.observacoes}</p>
          </div>
        )}
      </div>

      {naFila && <PegarEntregaButton pedidoId={p.id} />}

      {ehMinha && p.status === "pendente" && (
        <IniciarRotaButton pedidoId={p.id} endereco={p.endereco} bairro={p.bairro} />
      )}

      {ehMinha && p.status === "em_rota" && (
        <Link
          href={`/motoboy/entregas/${p.id}/finalizar`}
          className="block w-full rounded-lg bg-emerald-600 py-3 text-center text-base font-semibold text-white"
        >
          Finalizar entrega
        </Link>
      )}

      {p.status === "problema" && p.motivo_problema && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Problema reportado:</strong> {p.motivo_problema}
        </div>
      )}
    </div>
  );
}
