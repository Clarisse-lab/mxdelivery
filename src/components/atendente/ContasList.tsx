"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Perfil } from "@/lib/types/database";

export default function ContasList({
  contas,
  definirAtivo,
  vazio = "Nenhuma conta cadastrada ainda.",
  rotulo = "Conta",
}: {
  contas: Perfil[];
  definirAtivo: (id: string, ativo: boolean) => Promise<void>;
  vazio?: string;
  rotulo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function alternar(id: string, ativo: boolean) {
    startTransition(async () => {
      await definirAtivo(id, ativo);
      router.refresh();
    });
  }

  if (contas.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-gold-soft text-lg font-black text-brand-navy">
          +
        </div>
        <p className="mt-3 text-sm font-extrabold text-brand-navy-dark">{vazio}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Cadastre o primeiro acesso usando o formulário acima.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contas.map((c) => {
        const iniciais = c.nome
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase();

        return (
          <article
            key={c.id}
            className="premium-panel flex flex-col gap-4 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gold text-sm font-black text-brand-navy-dark shadow-sm">
                {iniciais || "MX"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black tracking-[-0.02em] text-brand-navy-dark">
                    {c.nome}
                  </h3>
                  <span className="rounded-full bg-brand-navy/[0.055] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-brand-navy/55">
                    {rotulo}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {c.telefone ?? "Telefone não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span
                className={
                  "rounded-full px-3 py-1.5 text-[10px] font-extrabold " +
                  (c.ativo
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500")
                }
              >
                {c.ativo ? "● Ativo" : "Inativo"}
              </span>

              <button
                onClick={() => alternar(c.id, !c.ativo)}
                disabled={pending}
                className={
                  "rounded-xl border px-3 py-2 text-xs font-extrabold disabled:opacity-60 " +
                  (c.ativo
                    ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                }
              >
                {c.ativo ? "Desativar" : "Reativar"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
