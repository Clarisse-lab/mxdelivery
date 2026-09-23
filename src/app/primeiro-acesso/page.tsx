"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ativarConta, type EstadoAtivacao } from "./actions";

const estadoInicial: EstadoAtivacao = {};
const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [estado, formAction] = useActionState(ativarConta, estadoInicial);

  useEffect(() => {
    if (estado.sucesso) {
      const timer = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [estado.sucesso, router]);

  if (estado.sucesso) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-semibold text-emerald-700">Conta ativada!</p>
          <p className="mt-2 text-sm text-slate-600">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Primeiro acesso</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use o número que o administrador te passou pra criar sua senha.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="numero" className="text-sm font-medium text-slate-700">
            Número
          </label>
          <input
            id="numero"
            name="numero"
            inputMode="numeric"
            pattern="[0-9]+"
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="senha" className="text-sm font-medium text-slate-700">
            Nova senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            minLength={6}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmar_senha" className="text-sm font-medium text-slate-700">
            Confirmar senha
          </label>
          <input
            id="confirmar_senha"
            name="confirmar_senha"
            type="password"
            minLength={6}
            required
            className={inputClass}
          />
        </div>

        {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Criar senha e ativar
        </button>

        <p className="text-center text-sm text-slate-500">
          Já tem senha?{" "}
          <Link href="/login" className="font-medium text-emerald-700 underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
