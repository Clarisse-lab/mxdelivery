"use client";

import { useActionState, useState, type WheelEvent } from "react";
import { criarPedido, type EstadoFormPedido } from "@/app/atendente/pedidos/novo/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import ComboboxTexto from "@/components/ui/ComboboxTexto";
import {
  TIPOS_RECEITA,
  type CartaoTipo,
  type FormaPagamento,
  type NovaReceita,
  type TipoReceita,
} from "@/lib/types/database";
import { TIPO_RECEITA_LABEL, formatarMoeda } from "@/lib/utils/status";
import { calcularTroco } from "@/lib/utils/troco";
import { BAIRROS_GOVERNADOR_VALADARES } from "@/lib/data/bairrosGovernadorValadares";

const estadoInicial: EstadoFormPedido = {};

// Evita alterar o valor do campo sem querer ao rolar a rodinha do mouse
// por cima dele — o input perde o foco e o scroll da página segue normal.
function semScrollNoNumero(e: WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}

type LinhaPagamento = {
  forma_pagamento: FormaPagamento | "";
  valor: string;
  cartaoTipo: CartaoTipo;
  parcelar: boolean;
  parcelas: string;
  troco: boolean;
  trocoPara: string;
  pixPago: boolean;
};

function linhaVazia(): LinhaPagamento {
  return {
    forma_pagamento: "",
    valor: "",
    cartaoTipo: "credito",
    parcelar: false,
    parcelas: "2",
    troco: false,
    trocoPara: "",
    pixPago: false,
  };
}

export default function NovoPedidoForm() {
  const [estado, formAction] = useActionState(criarPedido, estadoInicial);
  const [precisaReceita, setPrecisaReceita] = useState(false);
  const [valorTotal, setValorTotal] = useState("");
  const [pagamentos, setPagamentos] = useState<LinhaPagamento[]>([linhaVazia()]);
  const [receitas, setReceitas] = useState<NovaReceita[]>([
    { tipo_receita: "comum", quantidade: 1 },
  ]);

  const dividido = pagamentos.length > 1;
  const somaPagamentos = dividido
    ? pagamentos.reduce((soma, l) => soma + (Number(l.valor) || 0), 0)
    : Number(valorTotal) || 0;
  const diferenca = Math.round((Number(valorTotal || 0) - somaPagamentos) * 100) / 100;

  function atualizarLinha(index: number, mudanca: Partial<LinhaPagamento>) {
    setPagamentos((atual) => atual.map((l, i) => (i === index ? { ...l, ...mudanca } : l)));
  }

  function adicionarLinha() {
    setPagamentos((atual) => [...atual, linhaVazia()]);
  }

  function removerLinha(index: number) {
    setPagamentos((atual) => atual.filter((_, i) => i !== index));
  }

  function adicionarReceita() {
    setReceitas((atual) => [...atual, { tipo_receita: "comum", quantidade: 1 }]);
  }

  function removerReceita(index: number) {
    setReceitas((atual) => atual.filter((_, i) => i !== index));
  }

  function atualizarReceita(index: number, campo: keyof NovaReceita, valor: string) {
    setReceitas((atual) =>
      atual.map((r, i) =>
        i === index
          ? { ...r, [campo]: campo === "quantidade" ? Number(valor) || 1 : (valor as TipoReceita) }
          : r,
      ),
    );
  }

  const pagamentosParaEnviar = pagamentos.map((l) => ({
    forma_pagamento: l.forma_pagamento,
    valor: dividido ? Number(l.valor) || 0 : Number(valorTotal) || 0,
    cartao_tipo: l.forma_pagamento === "cartao" ? l.cartaoTipo : null,
    parcelas: l.forma_pagamento === "cartao" && l.parcelar ? Number(l.parcelas) || 2 : null,
    troco_para: l.forma_pagamento === "dinheiro" && l.troco ? Number(l.trocoPara) || null : null,
    pix_pago: l.forma_pagamento === "pix" ? l.pixPago : null,
  }));

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <section className="premium-panel rounded-[26px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Dados da entrega"
          titulo="Informações do cliente"
          descricao="Preencha os dados principais do pedido e do endereço de entrega."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo label="Cliente" htmlFor="cliente_nome">
          <input id="cliente_nome" name="cliente_nome" required className={inputClass} />
        </Campo>

        <Campo label="Telefone" htmlFor="cliente_telefone">
          <input
            id="cliente_telefone"
            name="cliente_telefone"
            type="tel"
            placeholder="(33) 99999-9999"
            className={inputClass}
          />
        </Campo>

        <Campo label="Endereço" htmlFor="endereco" className="sm:col-span-2">
          <input id="endereco" name="endereco" required className={inputClass} />
        </Campo>

        <Campo label="Bairro" htmlFor="bairro">
          <ComboboxTexto
            id="bairro"
            name="bairro"
            opcoes={BAIRROS_GOVERNADOR_VALADARES}
            required
            className={inputClass}
          />
        </Campo>

        <Campo label="Ponto de referência" htmlFor="referencia">
          <input id="referencia" name="referencia" className={inputClass} />
        </Campo>

        <Campo label="Valor total (R$)" htmlFor="valor_total">
          <input
            id="valor_total"
            name="valor_total"
            type="number"
            step="0.01"
            min="0"
            required
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            onWheel={semScrollNoNumero}
            className={inputClass}
          />
        </Campo>
        </div>
      </section>

      <section className="premium-panel space-y-4 rounded-[26px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Cobrança"
          titulo="Forma de pagamento"
          descricao="Defina como o cliente fará o pagamento e, se necessário, divida o valor."
        />

        {pagamentos.map((linha, index) => (
          <div
            key={index}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Pagamento {index + 1}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-brand-navy-dark">
                  {linha.forma_pagamento
                    ? linha.forma_pagamento === "cartao"
                      ? "Cartão"
                      : linha.forma_pagamento === "pix"
                        ? "Pix"
                        : "Dinheiro"
                    : "Escolha a forma de pagamento"}
                </p>
              </div>

              {pagamentos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(index)}
                  className="shrink-0 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50"
                >
                  Remover
                </button>
              )}
            </div>

            <div className={dividido ? "grid min-w-0 gap-3 sm:grid-cols-2" : "min-w-0"}>
              <div className="min-w-0">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/55">
                  Forma
                </label>
                <select
                  value={linha.forma_pagamento}
                  onChange={(e) =>
                    atualizarLinha(index, { forma_pagamento: e.target.value as FormaPagamento })
                  }
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">Pix</option>
                </select>
              </div>

              {dividido && (
                <div className="min-w-0">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/55">
                    Valor desta forma
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor (R$)"
                    value={linha.valor}
                    onChange={(e) => atualizarLinha(index, { valor: e.target.value })}
                    onWheel={semScrollNoNumero}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {linha.forma_pagamento === "cartao" && (
              <div className="space-y-3 rounded-2xl border border-brand-navy/8 bg-white/75 p-4">
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={linha.cartaoTipo === "credito"}
                      onChange={() => atualizarLinha(index, { cartaoTipo: "credito" })}
                      className="h-5 w-5 accent-brand-navy"
                    />
                    Crédito
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={linha.cartaoTipo === "debito"}
                      onChange={() => atualizarLinha(index, { cartaoTipo: "debito" })}
                      className="h-5 w-5 accent-brand-navy"
                    />
                    Débito
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.parcelar}
                    onChange={(e) => atualizarLinha(index, { parcelar: e.target.checked })}
                    className="h-5 w-5 accent-brand-navy"
                  />
                  Parcelar
                </label>
                {linha.parcelar && (
                  <input
                    type="number"
                    min="2"
                    value={linha.parcelas}
                    onChange={(e) => atualizarLinha(index, { parcelas: e.target.value })}
                    onWheel={semScrollNoNumero}
                    placeholder="Nº de parcelas"
                    className={inputClass}
                  />
                )}
              </div>
            )}

            {linha.forma_pagamento === "pix" && (
              <div className="space-y-3 rounded-2xl border border-brand-navy/8 bg-white/75 p-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.pixPago}
                    onChange={(e) => atualizarLinha(index, { pixPago: e.target.checked })}
                    className="h-5 w-5 accent-brand-navy"
                  />
                  Já foi pago
                </label>
                <div className="space-y-1">
                  <label
                    htmlFor={`comprovante_pix_${index}`}
                    className="text-xs font-medium text-slate-600"
                  >
                    Comprovante (opcional)
                  </label>
                  <input
                    id={`comprovante_pix_${index}`}
                    name={`comprovante_pix_${index}`}
                    type="file"
                    accept="image/*,.pdf"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-navy file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-white"
                  />
                </div>
              </div>
            )}

            {linha.forma_pagamento === "dinheiro" && (
              <div className="space-y-3 rounded-2xl border border-brand-navy/8 bg-white/75 p-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.troco}
                    onChange={(e) => atualizarLinha(index, { troco: e.target.checked })}
                    className="h-5 w-5 accent-brand-navy"
                  />
                  Precisa de troco
                </label>
                {linha.troco && (
                  <>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cliente vai pagar com (R$)"
                      value={linha.trocoPara}
                      onChange={(e) => atualizarLinha(index, { trocoPara: e.target.value })}
                      onWheel={semScrollNoNumero}
                      className={inputClass}
                    />
                    {linha.trocoPara &&
                      (() => {
                        const base = dividido ? Number(linha.valor) || 0 : Number(valorTotal) || 0;
                        const troco = calcularTroco(base, Number(linha.trocoPara));
                        if (troco === null) return null;
                        return (
                          <p
                            className={`text-sm font-semibold ${
                              troco < 0 ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            {troco < 0
                              ? "O valor informado é menor que o desta linha."
                              : `Troco a levar: ${formatarMoeda(troco)}`}
                          </p>
                        );
                      })()}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={adicionarLinha}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.04] px-3 py-2 text-sm font-extrabold text-brand-navy hover:bg-brand-navy/[0.08]"
        >
          <span className="text-base leading-none">+</span>
          Dividir em outra forma de pagamento
        </button>

        {dividido && (
          <p
            className={`text-sm font-semibold ${
              diferenca === 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {diferenca === 0
              ? "Valores batem com o total do pedido."
              : diferenca > 0
                ? `Falta alocar ${formatarMoeda(diferenca)}.`
                : `Os valores somam ${formatarMoeda(Math.abs(diferenca))} a mais que o total.`}
          </p>
        )}

        <input type="hidden" name="pagamentos" value={JSON.stringify(pagamentosParaEnviar)} />
      </section>

      <section className="premium-panel space-y-4 rounded-[26px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Conferência"
          titulo="Receitas e observações"
          descricao="Sinalize exigências do pedido para evitar falhas na entrega."
        />
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-bold text-brand-navy-dark">
          <input
            type="checkbox"
            name="precisa_receita"
            checked={precisaReceita}
            onChange={(e) => setPrecisaReceita(e.target.checked)}
            className="h-5 w-5 accent-brand-navy"
          />
          Precisa de receita
        </label>

        {precisaReceita && (
          <div className="space-y-3">
            {receitas.map((receita, index) => (
              <div
                key={index}
                className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
              >
                <select
                  value={receita.tipo_receita}
                  onChange={(e) => atualizarReceita(index, "tipo_receita", e.target.value)}
                  className={inputClass}
                >
                  {TIPOS_RECEITA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_RECEITA_LABEL[tipo]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={receita.quantidade}
                  onChange={(e) => atualizarReceita(index, "quantidade", e.target.value)}
                  onWheel={semScrollNoNumero}
                  className={inputClass}
                />
                {receitas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerReceita(index)}
                    className="rounded-lg px-2 py-1 text-xs font-extrabold text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarReceita}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.04] px-3 py-2 text-sm font-extrabold text-brand-navy"
            >
              + Adicionar outra receita
            </button>
            <input type="hidden" name="receitas" value={JSON.stringify(receitas)} />
          </div>
        )}
        <div className="pt-1">
          <Campo label="Observações (cliente/endereço)" htmlFor="observacoes">
            <textarea
              id="observacoes"
              name="observacoes"
              rows={4}
              placeholder="Ex.: interfone, portaria, instruções especiais..."
              className={inputClass}
            />
          </Campo>
        </div>
      </section>

      {estado.erro && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {estado.erro}
        </p>
      )}

      <SubmitButton
        pendingLabel="Criando..."
        className="w-full rounded-xl bg-brand-navy px-8 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(11,49,95,.18)] hover:-translate-y-0.5 hover:bg-brand-navy-dark disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
      >
        Criar pedido
      </SubmitButton>
    </form>
  );
}

const inputClass =
  "premium-input w-full rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400";

function Campo({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-black uppercase tracking-[0.11em] text-brand-navy/60"
      >
        {label}
      </label>
      {children}
    </div>
  );
}


function SectionHeading({
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
