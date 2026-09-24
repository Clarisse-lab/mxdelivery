import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
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
import { calcularNivelUrgencia, URGENCIA_UI } from "@/lib/utils/atraso";
import type { Pedido, Perfil, Receita, Pagamento } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfilAtual = await getPerfilAtual();

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

  const podeEditar = perfilAtual?.papel === "admin" || p.criado_por === perfilAtual?.id;
  const urgencia = URGENCIA_UI[calcularNivelUrgencia(p)];

  let criador: Perfil | null = null;
  if (p.criado_por && p.criado_por !== perfilAtual?.id) {
    const { data } = await supabase.from("perfis").select("*").eq("id", p.criado_por).single();
    criador = data as Perfil | null;
  }

  const comprovantes = await Promise.all(
    listaPagamentos
      .filter((pg) => pg.comprovante_pix_path)
      .map(async (pg) => {
        const caminho = pg.comprovante_pix_path!;
        const extensao = caminho.split(".").pop() ?? "bin";
        const nomeArquivo = `comprovante-pedido-${p.numero}-pix.${extensao}`;

        const [{ data: visualizar }, { data: baixar }] = await Promise.all([
          supabase.storage.from("comprovantes-pix").createSignedUrl(caminho, 60),
          supabase.storage
            .from("comprovantes-pix")
            .createSignedUrl(caminho, 60, { download: nomeArquivo }),
        ]);

        return {
          id: pg.id,
          url: visualizar?.signedUrl ?? null,
          urlDownload: baixar?.signedUrl ?? null,
        };
      }),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-brand-gold p-6 shadow-[0_18px_42px_rgba(205,160,0,.12)] sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/20" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
              Detalhes da entrega
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-[-0.05em] text-brand-navy-dark">
                Pedido #{p.numero}
              </h1>
              <span className={"rounded-full px-3 py-1 text-[11px] font-extrabold " + STATUS_BADGE_CLASS[p.status]}>
                {STATUS_LABEL[p.status]}
              </span>
              {urgencia && (
                <span
                  className={
                    "rounded-full px-3 py-1 text-[11px] font-extrabold " +
                    urgencia.badge +
                    (urgencia.pulsante ? " animate-pulse" : "")
                  }
                >
                  ⏰ {urgencia.label}
                </span>
              )}
              {podeEditar && (
                <Link
                  href={`/atendente/pedidos/${p.id}/editar`}
                  className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-extrabold text-brand-navy-dark hover:bg-white"
                >
                  ✎ Editar pedido
                </Link>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-brand-navy/60">Bairro</p>
            <p className="text-xl font-black tracking-[-0.025em] text-brand-navy-dark">{p.bairro}</p>
          </div>

          <div className="rounded-2xl bg-white/70 px-5 py-4 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-navy/45">
              Valor do pedido
            </p>
            <p className="mt-1 text-2xl font-black tracking-[-0.045em] text-brand-navy-dark">
              {formatarMoeda(p.valor_total)}
            </p>
          </div>
        </div>
      </section>

      {p.status === "problema" && p.motivo_problema && (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-black">Atenção necessária</p>
          <p className="mt-1">{p.motivo_problema}</p>
        </div>
      )}

      {p.observacao_motoboy && (
        <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-black">Observação do motoboy</p>
          <p className="mt-1">{p.observacao_motoboy}</p>
        </div>
      )}

      <section className="premium-panel rounded-[26px] p-5 sm:p-6">
        <PanelHeader
          eyebrow="Informações principais"
          titulo="Dados do pedido"
          descricao="Tudo o que a equipe precisa consultar durante a operação."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Cliente" valor={p.cliente_nome} destaque />
          <InfoCard label="Telefone" valor={p.cliente_telefone ?? "Não informado"} />
          <InfoCard label="Motoboy" valor={motoboyAtual?.nome ?? "Fila (sem motoboy)"} />
          {criador && <InfoCard label="Criado por" valor={criador.nome} />}
          <InfoCard label="Endereço" valor={p.endereco} className="sm:col-span-2 lg:col-span-2" />
          <InfoCard label="Referência" valor={p.referencia ?? "Sem referência"} />
          {p.cep && <InfoCard label="CEP" valor={p.cep} />}
          {p.observacoes && (
            <InfoCard
              label="Observações"
              valor={p.observacoes}
              className="sm:col-span-2 lg:col-span-3"
              tom="yellow"
            />
          )}
        </div>
      </section>

      <section className="premium-panel rounded-[26px] p-5 sm:p-6">
        <PanelHeader
          eyebrow="Financeiro"
          titulo="Pagamento"
          descricao="Forma de cobrança, valores e comprovantes relacionados ao pedido."
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {listaPagamentos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-400 md:col-span-2">
              Nenhuma forma de pagamento cadastrada.
            </div>
          )}

          {listaPagamentos.map((pg) => {
            const troco = calcularTroco(pg.valor, pg.troco_para);
            const comprovante = comprovantes.find((c) => c.id === pg.id);
            const jaPago = pg.forma_pagamento === "pix" && pg.pix_pago === true;

            return (
              <div
                key={pg.id}
                className={
                  "rounded-2xl border p-4 " +
                  (jaPago
                    ? "border-emerald-100 bg-emerald-50/70"
                    : "border-brand-gold/35 bg-brand-gold-soft/45")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                      Forma de pagamento
                    </p>
                    <p className="mt-1 text-base font-black text-brand-navy-dark">
                      {descreverPagamento(pg)}
                    </p>
                  </div>
                  {listaPagamentos.length > 1 && (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-brand-navy shadow-sm">
                      {formatarMoeda(pg.valor)}
                    </span>
                  )}
                </div>

                {jaPago && (
                  <p className="mt-3 text-xs font-bold text-emerald-700">✓ Já pago — nada a cobrar</p>
                )}

                {troco !== null && (
                  <div className="mt-3 rounded-xl bg-white/75 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Troco
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-amber-900">
                      Levar {formatarMoeda(troco)}
                    </p>
                  </div>
                )}

                {comprovante?.url && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={comprovante.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg bg-brand-navy px-3 py-2 text-xs font-extrabold text-white"
                    >
                      Ver comprovante
                    </a>
                    {comprovante.urlDownload && (
                      <a
                        href={comprovante.urlDownload}
                        className="inline-flex rounded-lg border border-brand-navy/20 bg-white px-3 py-2 text-xs font-extrabold text-brand-navy hover:bg-brand-navy/5"
                      >
                        Baixar
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {p.precisa_receita && (
        <section className="premium-panel rounded-[26px] p-5 sm:p-6">
          <PanelHeader
            eyebrow="Receituário"
            titulo="Receitas"
            descricao="Documentos que precisam ser conferidos e recolhidos na entrega."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {listaReceitas.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/70 px-4 py-4"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-400">
                    Tipo
                  </p>
                  <p className="mt-1 text-sm font-black text-red-800">
                    {TIPO_RECEITA_LABEL[r.tipo_receita]}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-red-700 shadow-sm">
                  {r.quantidade}x
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-panel rounded-[26px] p-5 sm:p-6">
          <PanelHeader
            eyebrow="Conferência"
            titulo="Checklist de finalização"
            descricao="Itens que precisam estar concluídos antes de encerrar a entrega."
          />

          <ul className="mt-5 space-y-3">
            {p.precisa_receita && <ChecklistItem ok={p.receita_coletada} texto="Receita recolhida" />}
            {precisaTroco && <ChecklistItem ok={p.troco_entregue} texto="Troco entregue" />}
            <ChecklistItem ok={p.pagamento_confirmado} texto="Pagamento confirmado" />
          </ul>
        </section>

        <section className="premium-panel rounded-[26px] p-5 sm:p-6">
          <PanelHeader
            eyebrow="Rastreamento"
            titulo="Linha do tempo"
            descricao="Histórico operacional do pedido desde a criação."
          />

          <div className="mt-5 space-y-1">
            <TimelineItem label="Criado" valor={formatarData(p.criado_em)} ativo />
            <TimelineItem label="Atribuído" valor={formatarData(p.atribuido_em)} ativo={Boolean(p.atribuido_em)} />
            <TimelineItem label="Iniciado" valor={formatarData(p.iniciado_em)} ativo={Boolean(p.iniciado_em)} />
            <TimelineItem label="Entregue" valor={formatarData(p.entregue_em)} ativo={Boolean(p.entregue_em)} ultimo />
          </div>
        </section>
      </div>

      {podeEditar ? (
        <PedidoDetalheAcoes
          pedidoId={p.id}
          statusAtual={p.status}
          motoboyAtualId={p.motoboy_id}
          motoboys={listaMotoboys}
          souAdmin={perfilAtual?.papel === "admin"}
        />
      ) : (
        <p className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          Este pedido foi criado por{" "}
          {criador?.nome ?? (p.criado_por ? "outro atendente" : "uma conta que já foi excluída")} —
          apenas quem criou o pedido ou um administrador pode reatribuir o motoboy ou cancelar.
        </p>
      )}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  titulo,
  descricao,
}: {
  eyebrow: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-dark">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-brand-navy-dark">{titulo}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{descricao}</p>
    </div>
  );
}

function InfoCard({
  label,
  valor,
  className,
  destaque = false,
  tom = "neutral",
}: {
  label: string;
  valor: string;
  className?: string;
  destaque?: boolean;
  tom?: "neutral" | "yellow";
}) {
  const base =
    tom === "yellow"
      ? "border-brand-gold/30 bg-brand-gold-soft/40"
      : destaque
        ? "border-brand-navy/10 bg-brand-navy/[0.045]"
        : "border-slate-200/80 bg-slate-50/75";

  return (
    <div className={"rounded-2xl border p-4 " + base + " " + (className ?? "")}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-[15px] font-extrabold leading-6 text-brand-navy-dark">{valor}</p>
    </div>
  );
}

function ChecklistItem({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li
      className={
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 " +
        (ok ? "border-emerald-100 bg-emerald-50/70" : "border-slate-200 bg-slate-50")
      }
    >
      <span
        className={
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black " +
          (ok ? "bg-emerald-600 text-white" : "bg-white text-slate-400 shadow-sm")
        }
      >
        {ok ? "✓" : "·"}
      </span>
      <span className={"text-sm font-extrabold " + (ok ? "text-emerald-800" : "text-slate-600")}>
        {texto}
      </span>
    </li>
  );
}

function TimelineItem({
  label,
  valor,
  ativo,
  ultimo = false,
}: {
  label: string;
  valor: string;
  ativo: boolean;
  ultimo?: boolean;
}) {
  return (
    <div className="grid grid-cols-[22px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={
            "mt-1.5 h-3 w-3 rounded-full border-2 " +
            (ativo ? "border-brand-gold bg-brand-navy" : "border-slate-300 bg-white")
          }
        />
        {!ultimo && <span className="min-h-10 w-px flex-1 bg-slate-200" />}
      </div>
      <div className="pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className={"mt-0.5 text-sm font-extrabold " + (ativo ? "text-brand-navy-dark" : "text-slate-400")}>
          {valor}
        </p>
      </div>
    </div>
  );
}
