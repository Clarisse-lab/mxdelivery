"use client";

import { useActionState, useState, type WheelEvent } from "react";
import { criarPedido, type EstadoFormPedido } from "@/app/atendente/pedidos/novo/actions";
import SubmitButton from "@/components/ui/SubmitButton";
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
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Cliente" htmlFor="cliente_nome" className="sm:col-span-2">
          <input id="cliente_nome" name="cliente_nome" required className={inputClass} />
        </Campo>

        <Campo label="Endereço" htmlFor="endereco" className="sm:col-span-2">
          <input id="endereco" name="endereco" required className={inputClass} />
        </Campo>

        <Campo label="Bairro" htmlFor="bairro">
          <input
            id="bairro"
            name="bairro"
            list="bairros-sugestoes"
            required
            className={inputClass}
          />
          <datalist id="bairros-sugestoes">
            {BAIRROS_GOVERNADOR_VALADARES.map((bairro) => (
              <option key={bairro} value={bairro} />
            ))}
          </datalist>
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

      <div className="space-y-3 rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">Forma de pagamento</p>

        {pagamentos.map((linha, index) => (
          <div key={index} className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-2.5">
            <div className="flex items-center gap-2">
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
              {dividido && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor (R$)"
                  value={linha.valor}
                  onChange={(e) => atualizarLinha(index, { valor: e.target.value })}
                  onWheel={semScrollNoNumero}
                  className={`${inputClass} w-32 shrink-0`}
                />
              )}
              {pagamentos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(index)}
                  className="shrink-0 text-sm font-medium text-red-600"
                >
                  Remover
                </button>
              )}
            </div>

            {linha.forma_pagamento === "cartao" && (
              <div className="space-y-2 pl-1">
                <div className="flex gap-4 text-sm text-slate-700">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={linha.cartaoTipo === "credito"}
                      onChange={() => atualizarLinha(index, { cartaoTipo: "credito" })}
                      className="h-4 w-4"
                    />
                    Crédito
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={linha.cartaoTipo === "debito"}
                      onChange={() => atualizarLinha(index, { cartaoTipo: "debito" })}
                      className="h-4 w-4"
                    />
                    Débito
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.parcelar}
                    onChange={(e) => atualizarLinha(index, { parcelar: e.target.checked })}
                    className="h-4 w-4"
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
                    className={`${inputClass} w-32`}
                  />
                )}
              </div>
            )}

            {linha.forma_pagamento === "pix" && (
              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.pixPago}
                    onChange={(e) => atualizarLinha(index, { pixPago: e.target.checked })}
                    className="h-4 w-4"
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
                    className="block w-full text-sm text-slate-600"
                  />
                </div>
              </div>
            )}

            {linha.forma_pagamento === "dinheiro" && (
              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={linha.troco}
                    onChange={(e) => atualizarLinha(index, { troco: e.target.checked })}
                    className="h-4 w-4"
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
          className="text-sm font-medium text-emerald-700"
        >
          + Dividir em outra forma de pagamento
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
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="precisa_receita"
            checked={precisaReceita}
            onChange={(e) => setPrecisaReceita(e.target.checked)}
            className="h-4 w-4"
          />
          Precisa de receita
        </label>

        {precisaReceita && (
          <div className="space-y-3">
            {receitas.map((receita, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_5rem_auto]">
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
                    className="text-sm font-medium text-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarReceita}
              className="text-sm font-medium text-emerald-700"
            >
              + Adicionar outra receita
            </button>
            <input type="hidden" name="receitas" value={JSON.stringify(receitas)} />
          </div>
        )}
      </div>

      <Campo label="Observações (cliente/endereço)" htmlFor="observacoes">
        <textarea id="observacoes" name="observacoes" rows={3} className={inputClass} />
      </Campo>

      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

      <SubmitButton
        pendingLabel="Criando..."
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        Criar pedido
      </SubmitButton>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

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
    <div className={`space-y-1 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
