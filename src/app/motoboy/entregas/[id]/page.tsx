import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IniciarRotaButton from "@/components/motoboy/IniciarRotaButton";
import PegarEntregaButton from "@/components/motoboy/PegarEntregaButton";
import AcaoFixa from "@/components/motoboy/AcaoFixa";
import {
  TIPO_RECEITA_LABEL,
  descreverPagamento,
  formatarMoeda,
} from "@/lib/utils/status";
import { calcularTroco } from "@/lib/utils/troco";
import type { Pedido, Receita, Pagamento } from "@/lib/types/database";

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

  const [{ data: pedido }, { data: receitas }, { data: pagamentos }] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).single(),
    supabase.from("receitas").select("*").eq("pedido_id", id),
    supabase.from("pagamentos").select("*").eq("pedido_id", id),
  ]);
  if (!pedido) notFound();

  const p = pedido as Pedido;
  const listaReceitas = (receitas as Receita[]) ?? [];
  const listaPagamentos = (pagamentos as Pagamento[]) ?? [];
  const ehMinha = p.motoboy_id === user.id;
  const naFila = p.motoboy_id === null && p.status === "pendente";

  const banner = definirBanner(p.status, ehMinha, naFila);

  return (
    <div className="space-y-5 pb-32">
      <Link
        href="/motoboy/entregas"
        className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-navy/55 hover:text-brand-navy"
      >
        <span aria-hidden="true">←</span>
        Minhas entregas
      </Link>

      <section className={"relative overflow-hidden rounded-[26px] px-5 py-5 shadow-[0_16px_36px_rgba(11,49,95,.10)] " + banner.classe}>
        <div className="absolute -right-12 -top-14 h-36 w-36 rounded-full border-[24px] border-white/15" />
        <div className="relative z-10 flex items-center gap-3">
          {banner.pulsante && (
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-brand-gold" />
          )}
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
              Pedido #{p.numero}
            </p>
            <p className="mt-1 text-xl font-black tracking-[-0.03em]">{banner.texto}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-60">Valor</p>
            <p className="mt-0.5 text-sm font-black">{formatarMoeda(p.valor_total)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] bg-brand-gold px-5 py-5 shadow-[0_14px_30px_rgba(218,169,0,.10)]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-navy/50">Bairro</p>
        <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-brand-navy-dark">{p.bairro}</p>
      </section>

      {p.precisa_receita && (
        <section className="rounded-[24px] border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">
              !
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-400">
                Atenção obrigatória
              </p>
              <h2 className="mt-1 text-lg font-black text-red-800">Recolher receita controlada</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {listaReceitas.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 shadow-sm"
                  >
                    {r.quantidade}x · {TIPO_RECEITA_LABEL[r.tipo_receita]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="premium-panel rounded-[26px] p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold-dark">
            Dados da entrega
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-brand-navy-dark">
            Informações do cliente
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoCard label="Cliente" valor={p.cliente_nome} destaque />
          <InfoCard label="Valor total" valor={formatarMoeda(p.valor_total)} tom="yellow" />
          {p.cliente_telefone && <InfoCard label="Telefone" valor={p.cliente_telefone} />}
          <InfoCard label="Endereço" valor={p.endereco} className="sm:col-span-2" />
          {p.referencia && <InfoCard label="Referência" valor={p.referencia} className="sm:col-span-2" />}

          <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Pagamento</p>
            <div className="mt-3 space-y-2.5">
              {listaPagamentos.length === 0 && (
                <p className="text-sm font-semibold text-slate-400">Nenhum pagamento cadastrado.</p>
              )}
              {listaPagamentos.map((pg) => {
                const troco = calcularTroco(pg.valor, pg.troco_para);
                const cobrar = pg.forma_pagamento !== "pix" || pg.pix_pago !== true;
                return (
                  <div
                    key={pg.id}
                    className={
                      "rounded-2xl border p-3.5 " +
                      (cobrar
                        ? "border-brand-gold/35 bg-brand-gold-soft/50"
                        : "border-emerald-100 bg-emerald-50/70")
                    }
                  >
                    <p className={"text-sm font-black " + (cobrar ? "text-amber-900" : "text-emerald-800")}>
                      {descreverPagamento(pg)}
                      {listaPagamentos.length > 1 && " · " + formatarMoeda(pg.valor)}
                    </p>
                    {!cobrar && (
                      <p className="mt-1 text-[11px] font-bold text-emerald-700">✓ Já pago — nada a cobrar</p>
                    )}
                    {troco !== null && (
                      <p className="mt-1.5 text-xs font-extrabold text-amber-900">
                        Cliente paga com {formatarMoeda(pg.troco_para!)} · Levar troco: {formatarMoeda(troco)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {p.observacoes && (
            <InfoCard label="Observações" valor={p.observacoes} className="sm:col-span-2" tom="yellow" />
          )}
        </div>
      </section>

      {p.status === "problema" && p.motivo_problema && (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-black">Problema reportado</p>
          <p className="mt-1">{p.motivo_problema}</p>
        </div>
      )}

      {p.observacao_motoboy && (
        <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-black">Sua observação</p>
          <p className="mt-1">{p.observacao_motoboy}</p>
        </div>
      )}

      {naFila && (
        <AcaoFixa>
          <PegarEntregaButton pedidoId={p.id} />
        </AcaoFixa>
      )}

      {ehMinha && p.status === "pendente" && (
        <AcaoFixa>
          <IniciarRotaButton pedidoId={p.id} endereco={p.endereco} bairro={p.bairro} />
        </AcaoFixa>
      )}

      {ehMinha && p.status === "em_rota" && (
        <AcaoFixa>
          <Link
            href={"/motoboy/entregas/" + p.id + "/finalizar"}
            className="block w-full rounded-xl bg-brand-navy py-3.5 text-center text-base font-black text-white shadow-[0_10px_24px_rgba(11,49,95,.18)]"
          >
            Finalizar entrega
          </Link>
        </AcaoFixa>
      )}
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
      ? "border-brand-gold/30 bg-brand-gold-soft/45"
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

function definirBanner(status: Pedido["status"], ehMinha: boolean, naFila: boolean) {
  if (naFila) {
    return { texto: "Disponível na fila", classe: "bg-slate-200 text-brand-navy-dark", pulsante: false };
  }
  if (ehMinha && status === "pendente") {
    return { texto: "Pronta para iniciar", classe: "bg-brand-gold text-brand-navy-dark", pulsante: false };
  }
  if (ehMinha && status === "em_rota") {
    return { texto: "Em rota — a caminho do cliente", classe: "bg-brand-navy text-white", pulsante: true };
  }
  if (status === "problema") {
    return { texto: "Entrega com problema", classe: "bg-red-600 text-white", pulsante: false };
  }
  if (status === "entregue") {
    return { texto: "Entrega concluída", classe: "bg-emerald-600 text-white", pulsante: false };
  }
  return { texto: "Cancelado", classe: "bg-slate-300 text-slate-700", pulsante: false };
}
