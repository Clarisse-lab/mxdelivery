"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Convite, Perfil } from "@/lib/types/database";

export default function ContasList({
  contas,
  convitesPendentes = [],
  definirAtivo,
  excluirConvite,
  vazio = "Nenhuma conta cadastrada ainda.",
}: {
  contas: Perfil[];
  convitesPendentes?: Convite[];
  definirAtivo: (id: string, ativo: boolean) => Promise<void>;
  excluirConvite?: (numero: string) => Promise<void>;
  vazio?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function alternar(id: string, ativo: boolean) {
    startTransition(async () => {
      await definirAtivo(id, ativo);
      router.refresh();
    });
  }

  function excluir(numero: string) {
    if (!excluirConvite) return;
    startTransition(async () => {
      await excluirConvite(numero);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {convitesPendentes.length > 0 && (
        <ul className="divide-y divide-amber-200 rounded-lg border border-amber-200 bg-amber-50">
          {convitesPendentes.map((c) => (
            <li key={c.numero} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {c.nome} <span className="text-slate-400">· nº {c.numero}</span>
                </p>
                <p className="text-xs text-slate-500">{c.telefone ?? "sem telefone"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                  Aguardando 1º acesso
                </span>
                {excluirConvite && (
                  <button
                    onClick={() => excluir(c.numero)}
                    disabled={pending}
                    className="text-xs font-medium text-red-600 underline disabled:opacity-60"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {contas.length === 0 ? (
        <p className="text-sm text-slate-500">{vazio}</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {contas.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {c.nome}
                  {c.numero_login && (
                    <span className="text-slate-400"> · nº {c.numero_login}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{c.telefone ?? "sem telefone"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
                <button
                  onClick={() => alternar(c.id, !c.ativo)}
                  disabled={pending}
                  className="text-xs font-medium text-slate-600 underline disabled:opacity-60"
                >
                  {c.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
