"use client";

import { useActionState, useState } from "react";
import { editarPedido, type EstadoFormEditarPedido } from "@/app/atendente/pedidos/[id]/editar/actions";
import SubmitButton from "@/components/ui/SubmitButton";
import ComboboxTexto from "@/components/ui/ComboboxTexto";
import { TIPOS_RECEITA, type NovaReceita, type TipoReceita } from "@/lib/types/database";
import { TIPO_RECEITA_LABEL } from "@/lib/utils/status";
import { BAIRROS_GOVERNADOR_VALADARES } from "@/lib/data/bairrosGovernadorValadares";
import { apenasDigitos, buscarEnderecoPorCep, formatarCep } from "@/lib/utils/cep";

const estadoInicial: EstadoFormEditarPedido = {};

export default function EditarPedidoForm({
  pedidoId,
  valoresIniciais,
  receitasIniciais,
}: {
  pedidoId: string;
  valoresIniciais: {
    cliente_nome: string;
    cliente_telefone: string;
    cep: string;
    endereco: string;
    bairro: string;
    referencia: string;
    observacoes: string;
  };
  receitasIniciais: NovaReceita[];
}) {
  const editarComId = editarPedido.bind(null, pedidoId);
  const [estado, formAction] = useActionState(editarComId, estadoInicial);

  const [precisaReceita, setPrecisaReceita] = useState(receitasIniciais.length > 0);
  const [receitas, setReceitas] = useState<NovaReceita[]>(
    receitasIniciais.length > 0 ? receitasIniciais : [{ tipo_receita: "comum", quantidade: 1 }],
  );

  const [cep, setCep] = useState(valoresIniciais.cep);
  const [endereco, setEndereco] = useState(valoresIniciais.endereco);
  const [bairroSelecionado, setBairroSelecionado] = useState(valoresIniciais.bairro);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);

  function alterarCep(valor: string) {
    const novoCep = formatarCep(valor);
    setCep(novoCep);

    if (apenasDigitos(novoCep).length !== 8) return;

    setBuscandoCep(true);
    buscarEnderecoPorCep(novoCep).then((resultado) => {
      setBuscandoCep(false);

      if (!resultado) {
        setCepNaoEncontrado(true);
        return;
      }

      setCepNaoEncontrado(false);
      setBairroSelecionado(resultado.bairro);
      setEndereco((atual) => (atual.trim() ? atual : resultado.logradouro));
    });
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

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <section className="premium-panel rounded-[26px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Dados da entrega"
          titulo="Informações do cliente"
          descricao="Corrija o que estiver errado no pedido."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo label="Cliente" htmlFor="cliente_nome">
            <input
              id="cliente_nome"
              name="cliente_nome"
              required
              defaultValue={valoresIniciais.cliente_nome}
              className={inputClass}
            />
          </Campo>

          <Campo label="Telefone" htmlFor="cliente_telefone">
            <input
              id="cliente_telefone"
              name="cliente_telefone"
              type="tel"
              placeholder="(33) 99999-9999"
              defaultValue={valoresIniciais.cliente_telefone}
              className={inputClass}
            />
          </Campo>

          <Campo label="CEP (opcional)" htmlFor="cep">
            <input
              id="cep"
              name="cep"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => alterarCep(e.target.value)}
              className={inputClass}
            />
            {buscandoCep && (
              <p className="text-xs font-semibold text-slate-400">Buscando endereço...</p>
            )}
            {cepNaoEncontrado && apenasDigitos(cep).length === 8 && (
              <p className="text-xs font-semibold text-amber-600">
                CEP não encontrado — preencha o endereço manualmente.
              </p>
            )}
          </Campo>

          <Campo label="Bairro" htmlFor="bairro">
            <ComboboxTexto
              key={bairroSelecionado}
              id="bairro"
              name="bairro"
              opcoes={BAIRROS_GOVERNADOR_VALADARES}
              required
              defaultValue={bairroSelecionado}
              className={inputClass}
            />
          </Campo>

          <Campo label="Endereço" htmlFor="endereco" className="sm:col-span-2">
            <input
              id="endereco"
              name="endereco"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className={inputClass}
            />
          </Campo>

          <Campo label="Ponto de referência" htmlFor="referencia">
            <input
              id="referencia"
              name="referencia"
              defaultValue={valoresIniciais.referencia}
              className={inputClass}
            />
          </Campo>
        </div>
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
              defaultValue={valoresIniciais.observacoes}
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
        pendingLabel="Salvando..."
        className="w-full rounded-xl bg-brand-navy px-8 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(11,49,95,.18)] hover:-translate-y-0.5 hover:bg-brand-navy-dark disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
      >
        Salvar alterações
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
