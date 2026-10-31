"use client";

import { useState } from "react";
import type { Papel } from "@/lib/types/database";

const inputClass =
  "mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy-dark focus:border-brand-gold focus:bg-white focus:outline-none";
const labelClass = "block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400";
const botaoClass = "rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-navy-dark";

export default function ExportarRelatorio({ hoje, papel }: { hoje: string; papel: Papel }) {
  const mesAtual = hoje.slice(0, 7);
  const [modo, setModo] = useState<"dia" | "mes">("dia");

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_9px_rgba(7,31,61,.045)]">
      {papel === "admin" && (
        <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1">
          {(["dia", "mes"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setModo(opcao)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-extrabold transition " +
                (modo === opcao ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-brand-navy")
              }
            >
              {opcao === "dia" ? "Por dia" : "Por mês"}
            </button>
          ))}
        </div>
      )}

      {modo === "dia" ? (
        <form
          action="/atendente/relatorios/exportar"
          method="GET"
          className="flex flex-wrap items-end gap-2.5"
        >
          <div>
            <label htmlFor="data-relatorio" className={labelClass}>
              Relatório do dia
            </label>
            <input
              id="data-relatorio"
              type="date"
              name="data"
              defaultValue={hoje}
              max={hoje}
              className={inputClass}
            />
          </div>
          <button type="submit" className={botaoClass}>
            Exportar Excel
          </button>
        </form>
      ) : (
        <form
          action="/atendente/relatorios/exportar"
          method="GET"
          className="flex flex-wrap items-end gap-2.5"
        >
          <div>
            <label htmlFor="mes-relatorio" className={labelClass}>
              Relatório do mês
            </label>
            <input
              id="mes-relatorio"
              type="month"
              name="mes"
              defaultValue={mesAtual}
              max={mesAtual}
              className={inputClass}
            />
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              Fechado dia a dia, com resumo geral do mês.
            </p>
          </div>
          <button type="submit" className={botaoClass}>
            Exportar Excel
          </button>
        </form>
      )}
    </div>
  );
}
