"use client";

import { useActionState, useEffect, useRef } from "react";
import SubmitButton from "@/components/ui/SubmitButton";

export type EstadoFormConta = { erro?: string; sucesso?: boolean };

const estadoInicial: EstadoFormConta = {};
const inputClass =
  "premium-input w-full rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400";

export default function CriarContaForm({
  titulo,
  descricao,
  rotuloBotao,
  action,
}: {
  titulo: string;
  descricao?: string;
  rotuloBotao: string;
  action: (estado: EstadoFormConta, formData: FormData) => Promise<EstadoFormConta>;
}) {
  const [estado, formAction] = useActionState(action, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
    }
  }, [estado.sucesso]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="premium-panel rounded-[26px] p-5 sm:p-6"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-dark">
          Novo acesso
        </p>
        <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-brand-navy-dark">
          {titulo}
        </h2>
        {descricao && <p className="mt-1 text-sm leading-6 text-slate-500">{descricao}</p>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" htmlFor="nome">
          <input id="nome" name="nome" required className={inputClass} placeholder="Nome completo" />
        </Campo>

        <Campo label="Telefone" htmlFor="telefone">
          <input id="telefone" name="telefone" className={inputClass} placeholder="(33) 99999-9999" />
        </Campo>

        <Campo label="E-mail de acesso" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="nome@empresa.com"
          />
        </Campo>

        <Campo label="Senha provisória" htmlFor="senha">
          <input
            id="senha"
            name="senha"
            type="text"
            minLength={6}
            required
            className={inputClass}
            placeholder="Mínimo de 6 caracteres"
          />
        </Campo>
      </div>

      {estado.erro && (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Conta cadastrada com sucesso.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <SubmitButton
          pendingLabel="Cadastrando..."
          className="w-full rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(11,49,95,.16)] hover:-translate-y-0.5 hover:bg-brand-navy-dark disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
        >
          {rotuloBotao}
        </SubmitButton>
      </div>
    </form>
  );
}

function Campo({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/60"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
