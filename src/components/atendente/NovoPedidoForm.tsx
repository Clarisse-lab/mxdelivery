"use client";

import { useActionState, useState, type WheelEvent } from "react";
import { criarPedido, type EstadoFormPedido } from "@/app/atendente/pedidos/novo/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { TIPOS_RECEITA, type NovaReceita, type TipoReceita } from "@/lib/types/database";
import { TIPO_RECEITA_LABEL, formatarMoeda } from "@/lib/utils/status";
import { calcularTroco } from "@/lib/utils/troco";
import { BAIRROS_GOVERNADOR_VALADARES } from "@/lib/data/bairrosGovernadorValadares";

const estadoInicial: EstadoFormPedido = {};

// Evita alterar o valor do campo sem querer ao rolar a rodinha do mouse
// por cima dele — o input perde o foco e o scroll da página segue normal.
function semScrollNoNumero(e: WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}

export default function NovoPedidoForm() {
  const [estado, formAction] = useActionState(criarPedido, estadoInicial);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [precisaReceita, setPrecisaReceita] = useState(false);
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [valorTotal, setValorTotal] = useState("");
  const [trocoPara, setTrocoPara] = useState("");
  const [parcelar, setParcelar] = useState(false);
  const [pixPago, setPixPago] = useState(false);
  const [receitas, setReceitas] = useState<NovaReceita[]>([
    { tipo_receita: "comum", quantidade: 1 },
  ]);

  const troco =
    precisaTroco && valorTotal && trocoPara
      ? calcularTroco(Number(valorTotal), Number(trocoPara))
      : null;

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

        <Campo label="Forma de pagamento" htmlFor="forma_pagamento">
          <select
            id="forma_pagamento"
            name="forma_pagamento"
            required
            className={inputClass}
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
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
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            onWheel={semScrollNoNumero}
            className={inputClass}
          />
        </Campo>
      </div>

      {formaPagamento === "cartao" && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-700">Cartão</p>
          <div className="flex gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="cartao_tipo" value="credito" defaultChecked className="h-4 w-4" />
              Crédito
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="cartao_tipo" value="debito" className="h-4 w-4" />
              Débito
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={parcelar}
              onChange={(e) => setParcelar(e.target.checked)}
              className="h-4 w-4"
            />
            Parcelar
          </label>
          {parcelar && (
            <Campo label="Número de parcelas" htmlFor="parcelas">
              <input
                id="parcelas"
                name="parcelas"
                type="number"
                min="2"
                defaultValue={2}
                onWheel={semScrollNoNumero}
                className={inputClass}
              />
            </Campo>
          )}
        </div>
      )}

      {formaPagamento === "pix" && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-700">Pix</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="pix_pago"
              checked={pixPago}
              onChange={(e) => setPixPago(e.target.checked)}
              className="h-4 w-4"
            />
            Já foi pago
          </label>
          <Campo label="Comprovante (opcional)" htmlFor="comprovante_pix">
            <input
              id="comprovante_pix"
              name="comprovante_pix"
              type="file"
              accept="image/*,.pdf"
              className="block w-full text-sm text-slate-600"
            />
          </Campo>
        </div>
      )}

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
          <>
            <Campo label="Cliente vai pagar com (R$)" htmlFor="troco_para">
              <input
                id="troco_para"
                name="troco_para"
                type="number"
                step="0.01"
                min="0"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                onWheel={semScrollNoNumero}
                className={inputClass}
              />
            </Campo>
            {troco !== null && (
              <p
                className={`text-sm font-semibold ${
                  troco < 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                {troco < 0
                  ? "O valor informado é menor que o total do pedido."
                  : `Troco a levar: ${formatarMoeda(troco)}`}
              </p>
            )}
          </>
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
