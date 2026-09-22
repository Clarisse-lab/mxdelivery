import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PedidoDetalheAcoes from "@/components/atendente/PedidoDetalheAcoes";
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  FORMA_PAGAMENTO_LABEL,
  TIPO_RECEITA_LABEL,
  formatarMoeda,
} from "@/lib/utils/status";
import { formatarData } from "@/lib/utils/tempo";
import type { Pedido, Perfil, TipoReceita } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pedido }, { data: motoboys }] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).single(),
    supabase.from("perfis").select("*").eq("papel", "motoboy").eq("ativo", true).order("nome"),
  ]);

  if (!pedido) notFound();

  const p = pedido as Pedido;
  const listaMotoboys = (motoboys as Perfil[]) ?? [];
  const motoboyAtual = listaMotoboys.find((m) => m.id === p.motoboy_id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Pedido #{p.numero}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[p.status]}`}>
          {STATUS_LABEL[p.status]}
        </span>
      </div>

      {p.status === "problema" && p.motivo_problema && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Motivo do problema:</strong> {p.motivo_problema}
        </div>
      )}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Info label="Cliente" valor={p.cliente_nome} />
        <Info label="Motoboy" valor={motoboyAtual?.nome ?? "Fila (sem motoboy)"} />
        <Info label="Endereço" valor={p.endereco} className="sm:col-span-2" />
        <Info label="Bairro" valor={p.bairro ?? "—"} />
        <Info label="Referência" valor={p.referencia ?? "—"} />
        <Info label="Forma de pagamento" valor={FORMA_PAGAMENTO_LABEL[p.forma_pagamento]} />
        <Info label="Valor total" valor={formatarMoeda(p.valor_total)} />
        <Info
          label="Troco"
          valor={p.troco_para ? `Para ${formatarMoeda(p.troco_para)}` : "Não precisa"}
        />
        <Info
          label="Receita controlada"
          valor={
            p.precisa_receita
              ? `${p.qtd_receitas ?? "?"}x · ${TIPO_RECEITA_LABEL[p.tipo_receita as TipoReceita] ?? p.tipo_receita}`
              : "Não precisa"
          }
        />
        {p.observacoes && (
          <Info label="Observações" valor={p.observacoes} className="sm:col-span-2" />
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Checklist de finalização</h2>
        <ul className="space-y-1 text-sm text-slate-700">
          {p.precisa_receita && <ChecklistItem ok={p.receita_coletada} texto="Receita recolhida" />}
          {p.troco_para !== null && <ChecklistItem ok={p.troco_entregue} texto="Troco entregue" />}
          <ChecklistItem ok={p.pagamento_confirmado} texto="Pagamento confirmado" />
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Linha do tempo</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-500">Criado</dt>
          <dd>{formatarData(p.criado_em)}</dd>
          <dt className="text-slate-500">Atribuído</dt>
          <dd>{formatarData(p.atribuido_em)}</dd>
          <dt className="text-slate-500">Iniciado</dt>
          <dd>{formatarData(p.iniciado_em)}</dd>
          <dt className="text-slate-500">Entregue</dt>
          <dd>{formatarData(p.entregue_em)}</dd>
        </dl>
      </div>

      <PedidoDetalheAcoes
        pedidoId={p.id}
        statusAtual={p.status}
        motoboyAtualId={p.motoboy_id}
        motoboys={listaMotoboys}
      />
    </div>
  );
}

function Info({
  label,
  valor,
  className,
}: {
  label: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{valor}</p>
    </div>
  );
}

function ChecklistItem({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {ok ? "✓" : "·"}
      </span>
      {texto}
    </li>
  );
}
