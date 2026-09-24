"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  finalizarEntrega,
  marcarProblema,
} from "@/app/motoboy/entregas/[id]/finalizar/actions";
import { calcularTroco } from "@/lib/utils/troco";
import { descreverPagamento, formatarMoeda, TIPO_RECEITA_LABEL } from "@/lib/utils/status";
import type { Pedido, Pagamento, Receita } from "@/lib/types/database";

export default function ChecklistFinalizar({
  pedido,
  pagamentos,
  receitas,
}: {
  pedido: Pedido;
  pagamentos: Pagamento[];
  receitas: Receita[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [receitaColetada, setReceitaColetada] = useState(false);
  const [trocoEntregue, setTrocoEntregue] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [observacao, setObservacao] = useState("");

  const [mostrarProblema, setMostrarProblema] = useState(false);
  const [motivo, setMotivo] = useState("");

  const precisaReceita = pedido.precisa_receita;

  const pendentesDeCobranca = pagamentos.filter(
    (pg) => pg.forma_pagamento !== "pix" || pg.pix_pago !== true,
  );
  const tudoJaPago = pagamentos.length > 0 && pendentesDeCobranca.length === 0;

  const linhasComTroco = pagamentos.filter(
    (pg) => pg.forma_pagamento === "dinheiro" && pg.troco_para !== null,
  );
  const precisaTroco = linhasComTroco.length > 0;

  const pagamentoOk = tudoJaPago || pagamentoConfirmado;

  const podeFinalizar =
    (!precisaReceita || receitaColetada) && (!precisaTroco || trocoEntregue) && pagamentoOk;

  function finalizar() {
    setErro(null);
    startTransition(async () => {
      try {
        await finalizarEntrega(pedido.id, {
          receitaColetada,
          trocoEntregue,
          pagamentoConfirmado: pagamentoOk,
          observacao: observacao.trim(),
        });
        router.push("/motoboy/entregas");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao finalizar entrega.");
      }
    });
  }

  function enviarProblema() {
    if (!motivo.trim()) {
      setErro("Descreva o motivo do problema.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await marcarProblema(pedido.id, motivo.trim());
        router.push("/motoboy/entregas");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao registrar problema.");
      }
    });
  }

  if (mostrarProblema) {
    return (
      <section className="space-y-4 rounded-[24px] border border-red-200 bg-red-50 p-5 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">
            Problema na entrega
          </p>
          <h2 className="mt-1 text-lg font-black text-red-800">
            Por que não conseguiu entregar?
          </h2>
        </div>

        <textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
          placeholder="Ex.: cliente não estava em casa, não conseguiu pagar, não tinha a receita..."
          className="w-full rounded-xl border border-red-200 bg-white px-4 py-3.5 text-[15px] font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
        />

        {erro && (
          <p className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-red-700">
            {erro}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMostrarProblema(false)}
            disabled={pending}
            className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-extrabold text-slate-700"
          >
            Voltar
          </button>
          <button
            onClick={enviarProblema}
            disabled={pending}
            className="rounded-xl bg-red-600 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
          >
            Confirmar problema
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="premium-panel rounded-[24px] p-5">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold-dark">
            Checklist
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-brand-navy-dark">
            Confirme antes de finalizar
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Marque os itens concluídos para liberar a finalização da entrega.
          </p>
        </div>

        <div className="space-y-3">
          {precisaReceita && (
            <ChecklistCheckbox
              label={
                "Recolhi a receita" +
                (receitas.length > 0
                  ? " (" +
                    receitas.map((r) => `${r.quantidade}x ${TIPO_RECEITA_LABEL[r.tipo_receita]}`).join(" + ") +
                    ")"
                  : "")
              }
              checked={receitaColetada}
              onChange={setReceitaColetada}
            />
          )}

          {precisaTroco && (
            <ChecklistCheckbox
              label={
                "Entreguei o troco" +
                (linhasComTroco.length > 0
                  ? " (" +
                    linhasComTroco
                      .map((pg) => formatarMoeda(calcularTroco(pg.valor, pg.troco_para) ?? 0))
                      .join(" + ") +
                    ")"
                  : "")
              }
              checked={trocoEntregue}
              onChange={setTrocoEntregue}
            />
          )}

          {tudoJaPago ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                ✓
              </span>
              <div>
                <p className="text-sm font-extrabold text-emerald-800">Pagamento confirmado</p>
                <p className="text-[11px] font-semibold text-emerald-700/70">Nada a cobrar do cliente</p>
              </div>
            </div>
          ) : (
            <ChecklistCheckbox
              label={
                pendentesDeCobranca.length > 0
                  ? "Recebi o pagamento (" +
                    pendentesDeCobranca
                      .map((pg) => descreverPagamento(pg) + " · " + formatarMoeda(pg.valor))
                      .join(" + ") +
                    ")"
                  : "Recebi o pagamento"
              }
              checked={pagamentoConfirmado}
              onChange={setPagamentoConfirmado}
            />
          )}
        </div>
      </section>

      <section className="premium-panel rounded-[24px] p-5">
        <label
          htmlFor="observacao"
          className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
        >
          Observação da entrega
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Opcional. Registre qualquer informação útil sobre a entrega.
        </p>
        <textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          placeholder="Alguma nota sobre essa entrega?"
          className="premium-input mt-3 w-full rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
        />
      </section>

      {erro && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {erro}
        </p>
      )}

      <button
        onClick={finalizar}
        disabled={!podeFinalizar || pending}
        className="w-full rounded-xl bg-brand-navy py-3.5 text-base font-black text-white shadow-[0_12px_28px_rgba(11,49,95,.16)] hover:bg-brand-navy-dark disabled:opacity-40"
      >
        {pending ? "Finalizando..." : "Finalizar entrega"}
      </button>

      <button
        onClick={() => setMostrarProblema(true)}
        disabled={pending}
        className="w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-extrabold text-red-700 hover:bg-red-50"
      >
        Não consegui entregar
      </button>
    </div>
  );
}

function ChecklistCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={
        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[15px] font-extrabold transition " +
        (checked
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50/80 text-slate-700")
      }
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 accent-brand-navy"
      />
      {label}
    </label>
  );
}
