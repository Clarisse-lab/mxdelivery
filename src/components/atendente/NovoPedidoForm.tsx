"use client";

import { useActionState, useState } from "react";
import { criarPedido, type EstadoFormPedido } from "@/app/atendente/pedidos/novo/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { TIPOS_RECEITA } from "@/lib/types/database";
import { TIPO_RECEITA_LABEL } from "@/lib/utils/status";

const estadoInicial: EstadoFormPedido = {};

export default function NovoPedidoForm() {
  const [estado, formAction] = useActionState(criarPedido, estadoInicial);
  const [precisaReceita, setPrecisaReceita] = useState(false);
  const [precisaTroco, setPrecisaTroco] = useState(false);

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
          <input id="bairro" name="bairro" className={inputClass} />
        </Campo>

        <Campo label="Ponto de referência" htmlFor="referencia">
          <input id="referencia" name="referencia" className={inputClass} />
        </Campo>

        <Campo label="Forma de pagamento" htmlFor="forma_pagamento">
          <select id="forma_pagamento" name="forma_pagamento" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="pix">Pix</option>
          </select>
        </Campo>

        <Campo label="Valor total (R$)" htmlFor="valor_total">
          <input
            id="valor_total"
            name="valor_total"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
          />
        </Campo>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="precisa_troco"
            checked={precisaTroco}
            onChange={(e) => setPrecisaTroco(e.target.checked)}
            className="h-4 w-4"
          />
          Precisa de troco
        </label>
        {precisaTroco && (
          <Campo label="Troco para (R$)" htmlFor="troco_para">
            <input
              id="troco_para"
              name="troco_para"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
            />
          </Campo>
        )}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Quantidade de receitas" htmlFor="qtd_receitas">
              <input
                id="qtd_receitas"
                name="qtd_receitas"
                type="number"
                min="1"
                className={inputClass}
              />
            </Campo>
            <Campo label="Tipo de receita" htmlFor="tipo_receita">
              <select id="tipo_receita" name="tipo_receita" className={inputClass} defaultValue="comum">
                {TIPOS_RECEITA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {TIPO_RECEITA_LABEL[tipo]}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        )}
      </div>

      <Campo label="Observações" htmlFor="observacoes">
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
