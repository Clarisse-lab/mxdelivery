import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IniciarRotaButton from "@/components/motoboy/IniciarRotaButton";
import PegarEntregaButton from "@/components/motoboy/PegarEntregaButton";
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  FORMA_PAGAMENTO_LABEL,
  TIPO_RECEITA_LABEL,
  formatarMoeda,
} from "@/lib/utils/status";
import type { Pedido, TipoReceita } from "@/lib/types/database";

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

  const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", id).single();
  if (!pedido) notFound();

  const p = pedido as Pedido;
  const ehMinha = p.motoboy_id === user.id;
  const naFila = p.motoboy_id === null && p.status === "pendente";

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

      {p.precisa_receita && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4">
          <p className="text-base font-bold text-red-700">⚠ Recolher receita controlada</p>
          <p className="text-sm text-red-700">
            {p.qtd_receitas ?? "?"}x ·{" "}
            {TIPO_RECEITA_LABEL[p.tipo_receita as TipoReceita] ?? p.tipo_receita}
          </p>
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
          {p.bairro && <p className="text-sm text-slate-600">{p.bairro}</p>}
        </div>
        {p.referencia && (
          <div>
            <p className="text-xs font-medium text-slate-500">Referência</p>
            <p className="text-base text-slate-900">{p.referencia}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-slate-500">Forma de pagamento</p>
          <p className="text-base text-slate-900">{FORMA_PAGAMENTO_LABEL[p.forma_pagamento]}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Valor total</p>
          <p className="text-base text-slate-900">{formatarMoeda(p.valor_total)}</p>
        </div>
        {p.troco_para !== null && (
          <div className="rounded-lg bg-amber-100 p-3">
            <p className="text-xs font-medium text-amber-800">Troco</p>
            <p className="text-lg font-bold text-amber-900">
              Levar troco para {formatarMoeda(p.troco_para)}
            </p>
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
