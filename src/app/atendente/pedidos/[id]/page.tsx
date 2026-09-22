import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PedidoDetalheAcoes from "@/components/atendente/PedidoDetalheAcoes";
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  TIPO_RECEITA_LABEL,
  descreverPagamento,
  formatarMoeda,
} from "@/lib/utils/status";
import { formatarData } from "@/lib/utils/tempo";
import { calcularTroco } from "@/lib/utils/troco";
import type { Pedido, Perfil, Receita, Pagamento } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pedido }, { data: motoboys }, { data: receitas }, { data: pagamentos }] =
    await Promise.all([
      supabase.from("pedidos").select("*").eq("id", id).single(),
      supabase.from("perfis").select("*").eq("papel", "motoboy").eq("ativo", true).order("nome"),
      supabase.from("receitas").select("*").eq("pedido_id", id),
      supabase.from("pagamentos").select("*").eq("pedido_id", id),
    ]);

  if (!pedido) notFound();

  const p = pedido as Pedido;
  const listaMotoboys = (motoboys as Perfil[]) ?? [];
  const listaReceitas = (receitas as Receita[]) ?? [];
  const listaPagamentos = (pagamentos as Pagamento[]) ?? [];
  const motoboyAtual = listaMotoboys.find((m) => m.id === p.motoboy_id);
  const precisaTroco = listaPagamentos.some(
    (pg) => pg.forma_pagamento === "dinheiro" && pg.troco_para !== null,
  );

  const comprovantes = await Promise.all(
    listaPagamentos
      .filter((pg) => pg.comprovante_pix_path)
      .map(async (pg) => {
        const { data: signed } = await supabase.storage
          .from("comprovantes-pix")
          .createSignedUrl(pg.comprovante_pix_path!, 60);
        return { id: pg.id, url: signed?.signedUrl ?? null };
      }),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Pedido #{p.numero}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[p.status]}`}>
          {STATUS_LABEL[p.status]}
        </span>
      </div>

      <div className="inline-flex items-baseline gap-2 rounded-lg bg-blue-50 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Bairro</span>
        <span className="text-lg font-bold text-blue-900">{p.bairro}</span>
      </div>

      {p.status === "problema" && p.motivo_problema && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Motivo do problema:</strong> {p.motivo_problema}
        </div>
      )}

      {p.observacao_motoboy && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Observação do motoboy:</strong> {p.observacao_motoboy}
        </div>
      )}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Info label="Cliente" valor={p.cliente_nome} />
        <Info label="Motoboy" valor={motoboyAtual?.nome ?? "Fila (sem motoboy)"} />
        <Info label="Endereço" valor={p.endereco} className="sm:col-span-2" />
        <Info label="Referência" valor={p.referencia ?? "—"} />
        <Info label="Valor total" valor={formatarMoeda(p.valor_total)} />
        {p.observacoes && (
          <Info label="Observações" valor={p.observacoes} className="sm:col-span-2" />
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Pagamento</h2>
        <ul className="space-y-2 text-sm text-slate-900">
          {listaPagamentos.map((pg) => {
            const troco = calcularTroco(pg.valor, pg.troco_para);
            const comprovante = comprovantes.find((c) => c.id === pg.id);
            return (
              <li key={pg.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  {descreverPagamento(pg)}
                  {listaPagamentos.length > 1 && ` · ${formatarMoeda(pg.valor)}`}
                  {troco !== null && ` · Troco: ${formatarMoeda(troco)}`}
                </span>
                {comprovante?.url && (
                  <a
                    href={comprovante.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-700 underline"
                  >
                    Ver comprovante
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {p.precisa_receita && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Receitas</h2>
          <ul className="space-y-1 text-sm text-slate-900">
            {listaReceitas.map((r) => (
              <li key={r.id}>
                {r.quantidade}x · {TIPO_RECEITA_LABEL[r.tipo_receita]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Checklist de finalização</h2>
        <ul className="space-y-1 text-sm text-slate-700">
          {p.precisa_receita && <ChecklistItem ok={p.receita_coletada} texto="Receita recolhida" />}
          {precisaTroco && <ChecklistItem ok={p.troco_entregue} texto="Troco entregue" />}
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
