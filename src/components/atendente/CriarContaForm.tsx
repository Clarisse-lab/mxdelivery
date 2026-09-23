"use client";

import { useActionState, useEffect, useRef } from "react";
import SubmitButton from "@/components/ui/SubmitButton";

export type EstadoFormConta = { erro?: string; sucesso?: boolean };

const estadoInicial: EstadoFormConta = {};
const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

export default function CriarContaForm({
  titulo,
  rotuloBotao,
  action,
}: {
  titulo: string;
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
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      <h2 className="text-sm font-semibold text-slate-700 sm:col-span-2">{titulo}</h2>

      <div className="space-y-1">
        <label htmlFor="nome" className="text-xs font-medium text-slate-600">
          Nome
        </label>
        <input id="nome" name="nome" required className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="telefone" className="text-xs font-medium text-slate-600">
          Telefone
        </label>
        <input id="telefone" name="telefone" className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="numero" className="text-xs font-medium text-slate-600">
          Número (login)
        </label>
        <input
          id="numero"
          name="numero"
          inputMode="numeric"
          pattern="[0-9]+"
          placeholder="ex.: 123"
          required
          className={inputClass}
        />
      </div>

      {estado.erro && <p className="text-sm text-red-600 sm:col-span-2">{estado.erro}</p>}
      {estado.sucesso && (
        <p className="text-sm text-emerald-700 sm:col-span-2">
          Convite criado — a pessoa já pode entrar em &quot;Primeiro acesso&quot; com esse número
          pra criar a própria senha.
        </p>
      )}

      <SubmitButton
        pendingLabel="Cadastrando..."
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
      >
        {rotuloBotao}
      </SubmitButton>
    </form>
  );
}
